'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  readonly user: User | null
  readonly serverValidated: boolean
  setAuth: (user: User) => void
  clearAuth: () => Promise<void>
  validateSession: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        serverValidated: false,
        setAuth: (user) => set({ user, serverValidated: true }),
        clearAuth: async () => {
          // Clear local state first so the client is always logged out, even if
          // the server request fails. The thrown error lets callers observe failure.
          set({ user: null, serverValidated: false })
          const res = await fetch('/api/auth/logout', { method: 'POST' })
          if (!res.ok) throw new Error(`Logout failed: ${res.statusText}`)
        },
        validateSession: async () => {
          try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
              const user = (await res.json()) as User
              set({ user, serverValidated: true })
            } else {
              set({ user: null, serverValidated: false })
            }
          } catch {
            set({ serverValidated: false })
          }
        },
        isAuthenticated: () => {
          const { user, serverValidated } = get()
          return user !== null && serverValidated
        },
      }),
      {
        name: 'auth-storage',
        // serverValidated is intentionally excluded — it must be re-earned from
        // the server on every hydration via validateSession().
        partialize: (state) => ({ user: state.user }),
      },
    ),
    { name: 'AuthStore' },
  ),
)
