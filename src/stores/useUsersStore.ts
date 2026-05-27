'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TenantUser, CreateUserBody, UserApiError } from '@/types'

interface UsersState {
  users: TenantUser[]
  loading: boolean
  error: string | null

  fetchUsers: (signal?: AbortSignal) => Promise<void>
  createUser: (body: CreateUserBody, idempotencyKey: string) => Promise<TenantUser>
  patchUser: (id: string, isActive: boolean, idempotencyKey: string) => Promise<void>
  deleteUser: (id: string, idempotencyKey: string) => Promise<void>
}

function throwFromResponse(data: unknown): never {
  const err = data as UserApiError
  throw Object.assign(new Error(err.error.message), { code: err.error.code })
}

export const useUsersStore = create<UsersState>()(
  devtools(
    (set) => ({
      users: [],
      loading: false,
      error: null,

      fetchUsers: async (signal?) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/users', { signal })
          if (!res.ok) {
            const data = await res.json() as UserApiError
            set({ error: data.error.message, loading: false })
            return
          }
          const data = await res.json() as { users: TenantUser[] }
          set({ users: data.users, loading: false })
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          set({ error: 'Failed to load users', loading: false })
        }
      },

      createUser: async (body, idempotencyKey) => {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        })

        const data = await res.json()
        if (!res.ok) throwFromResponse(data)

        // Fetch the full user record so we have all fields (specs, createdAt, etc.)
        const created = data as { id: string }
        const detailRes = await fetch(`/api/users/${created.id}`)
        if (!detailRes.ok) throw new Error('Failed to fetch created user')
        const full = await detailRes.json() as TenantUser

        set((s) => ({ users: [...s.users, full] }))
        return full
      },

      patchUser: async (id, isActive, idempotencyKey) => {
        const res = await fetch(`/api/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ isActive }),
        })

        const data = await res.json()
        if (!res.ok) throwFromResponse(data)

        const updated = data as TenantUser
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? updated : u)),
        }))
      },

      deleteUser: async (id, idempotencyKey) => {
        const res = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: { 'Idempotency-Key': idempotencyKey },
        })

        if (!res.ok) {
          const data = await res.json()
          throwFromResponse(data)
        }

        set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
      },
    }),
    { name: 'UsersStore' },
  ),
)
