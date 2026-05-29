'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useAuthStore } from '@/stores/useAuthStore'
import type {
  ProductListView,
  ProductView,
  CreateProductBody,
  PresignResponse,
  ConfirmImagesBody,
  ListProductsResponse,
  ProductApiError,
} from '@/types'

interface ProductsState {
  products: ProductListView[]
  loading: boolean
  error: string | null

  fetchProducts: (signal?: AbortSignal) => Promise<void>
  createProduct: (body: CreateProductBody, idempotencyKey: string) => Promise<ProductView>
  presignImage: (
    productId: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
    idempotencyKey: string,
  ) => Promise<PresignResponse>
  confirmImages: (
    productId: string,
    body: ConfirmImagesBody,
    idempotencyKey: string,
  ) => Promise<ProductView>
  setPrimaryImage: (
    productId: string,
    s3Key: string,
    idempotencyKey: string,
  ) => Promise<ProductView>
  reorderImages: (
    productId: string,
    s3Keys: string[],
    idempotencyKey: string,
  ) => Promise<ProductView>
}

export const useProductsStore = create<ProductsState>()(
  devtools(
    (set) => ({
      products: [],
      loading: false,
      error: null,

      fetchProducts: async (signal?) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/products', { signal })

          if (res.status === 401) {
            await useAuthStore.getState().clearAuth()
            return
          }

          if (res.status === 403) {
            set({ error: 'FORBIDDEN', loading: false })
            return
          }

          if (!res.ok) {
            const data = await res.json() as ProductApiError
            set({ error: data.error?.message ?? 'Failed to load products', loading: false })
            return
          }

          const data = await res.json() as ListProductsResponse
          set({ products: [...data.products], loading: false })
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          set({ error: 'Failed to load products. Check your connection and try again.', loading: false })
        }
      },

      createProduct: async (body, idempotencyKey) => {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        })

        const data: unknown = await res.json()
        if (!res.ok) {
          throw Object.assign(new Error('CreateProductError'), { status: res.status, body: data })
        }

        const created = data as ProductView
        set((s) => ({ products: [...s.products, created] }))
        return created
      },

      presignImage: async (productId, mimeType, idempotencyKey) => {
        const res = await fetch(`/api/products/${productId}/images/presign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ mimeType }),
        })

        const data: unknown = await res.json()
        if (!res.ok) {
          throw Object.assign(new Error('PresignError'), { status: res.status, body: data })
        }
        return data as PresignResponse
      },

      confirmImages: async (productId, body, idempotencyKey) => {
        const res = await fetch(`/api/products/${productId}/images/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        })

        const data: unknown = await res.json()
        if (!res.ok) {
          throw Object.assign(new Error('ConfirmImagesError'), { status: res.status, body: data })
        }

        const product = data as ProductView
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, ...product } : p,
          ),
        }))
        return product
      },

      setPrimaryImage: async (productId, s3Key, idempotencyKey) => {
        const res = await fetch(`/api/products/${productId}/images/primary`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ s3Key }),
        })

        const data: unknown = await res.json()
        if (!res.ok) {
          throw Object.assign(new Error('SetPrimaryError'), { status: res.status, body: data })
        }

        const product = data as ProductView
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, ...product } : p,
          ),
        }))
        return product
      },

      reorderImages: async (productId, s3Keys, idempotencyKey) => {
        const res = await fetch(`/api/products/${productId}/images/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ s3Keys }),
        })

        const data: unknown = await res.json()
        if (!res.ok) {
          throw Object.assign(new Error('ReorderImagesError'), { status: res.status, body: data })
        }

        const product = data as ProductView
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, ...product } : p,
          ),
        }))
        return product
      },
    }),
    { name: 'ProductsStore' },
  ),
)
