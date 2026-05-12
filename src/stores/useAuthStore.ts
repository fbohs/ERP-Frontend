'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  readonly user: User | null
  setAuth: (user: User) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        setAuth: (user) => set({ user }),
        clearAuth: () => {
          set({ user: null })
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        },
        isAuthenticated: () => get().user !== null,
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user }),
      },
    ),
    { name: 'AuthStore' },
  ),
)
