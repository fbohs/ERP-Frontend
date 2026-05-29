'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Category, CreateCategoryBody, UpdateCategoryBody, ListCategoriesResponse, CategoryApiError, UserRole } from '@/types'

interface CategoriesState {
  categories: Category[]
  loading: boolean
  // 'FORBIDDEN' is a sentinel; all other strings are display messages.
  error: string | null

  fetchCategories: (signal?: AbortSignal) => Promise<void>
  createCategory: (body: CreateCategoryBody, idempotencyKey: string) => Promise<Category>
  updateCategory: (id: string, body: UpdateCategoryBody, idempotencyKey: string) => Promise<Category>
  deactivateCategory: (id: string, idempotencyKey: string, role: UserRole) => Promise<void>
}

export const useCategoriesStore = create<CategoriesState>()(
  devtools(
    (set) => ({
      categories: [],
      loading: false,
      error: null,

      fetchCategories: async (signal?) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/categories', { signal })

          if (res.status === 401) {
            // Session expired — clear auth and let AuthBootstrap redirect.
            await useAuthStore.getState().clearAuth()
            return
          }

          if (res.status === 403) {
            set({ error: 'FORBIDDEN', loading: false })
            return
          }

          if (!res.ok) {
            const data = await res.json() as CategoryApiError
            set({ error: data.error?.message ?? 'Failed to load categories', loading: false })
            return
          }

          const data = await res.json() as ListCategoriesResponse
          set({ categories: [...data.categories], loading: false })
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          set({ error: 'Failed to load categories. Check your connection and try again.', loading: false })
        }
      },

      createCategory: async (body, idempotencyKey) => {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        })

        const data = await res.json()
        if (!res.ok) {
          const err = data as CategoryApiError
          throw Object.assign(new Error(err.error.message), { code: err.error.code })
        }

        const created = data as Category
        set((s) => ({ categories: [...s.categories, created] }))
        return created
      },

      updateCategory: async (id, body, idempotencyKey) => {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        })

        const data = await res.json()
        if (!res.ok) {
          const err = data as CategoryApiError
          throw Object.assign(new Error(err.error.message), { code: err.error.code })
        }

        const updated = data as Category
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? updated : c)),
        }))
        return updated
      },

      deactivateCategory: async (id, idempotencyKey, role) => {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: { 'Idempotency-Key': idempotencyKey },
        })

        if (res.status === 204) {
          if (role === 'ADMIN') {
            set((s) => ({
              categories: s.categories.map((c) =>
                c.id === id ? { ...c, isActive: false } : c,
              ),
            }))
          } else {
            set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
          }
          return
        }

        const data = await res.json() as CategoryApiError
        if (res.status === 404) {
          // Gone server-side — remove from local list before throwing
          set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
        }
        throw Object.assign(new Error(data.error.message), { code: data.error.code })
      },
    }),
    { name: 'CategoriesStore' },
  ),
)
