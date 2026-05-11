'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  readonly user: User | null
  readonly token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        setAuth: (user, token) => set({ user, token }),
        clearAuth: () => set({ user: null, token: null }),
        isAuthenticated: () => get().token !== null,
      }),
      { name: 'auth-storage' },
    ),
    { name: 'AuthStore' },
  ),
)
