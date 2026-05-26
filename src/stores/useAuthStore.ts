'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { api, setUnauthorizedHandler } from '@/services/api'
import type { User, AuthTenant } from '@/types'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000

interface AuthState {
  readonly user: User | null
  readonly tenant: AuthTenant | null
  readonly token: string | null
  readonly loginAt: number | null
  setAuth: (user: User, token: string, tenant: AuthTenant) => void
  clearAuth: () => Promise<void>
  rehydrate: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        tenant: null,
        token: null,
        loginAt: null,

        setAuth: (user, token, tenant) => {
          set({ user, token, tenant, loginAt: Date.now() })
          // Write a same-site cookie so proxy.ts can detect the session on
          // server-side navigation. Not httpOnly (set from JS) — the real
          // token is the authoritative copy in Zustand/localStorage.
          document.cookie = `auth-token=${token}; path=/; SameSite=Strict`
        },

        clearAuth: async () => {
          const { token } = get()
          set({ user: null, token: null, tenant: null, loginAt: null })
          document.cookie = 'auth-token=; path=/; max-age=0'
          if (token) {
            await api.delete('/api/auth/logout', { token }).catch(() => {
              // Already cleared locally — server-side failure is non-fatal.
            })
          }
        },

        rehydrate: () => {
          const { loginAt } = get()
          if (loginAt !== null && Date.now() - loginAt > SESSION_TTL_MS) {
            set({ user: null, token: null, tenant: null, loginAt: null })
          }
          // Register global 401 handler so any authenticated api call that
          // receives a 401 triggers the same logout path.
          setUnauthorizedHandler(() => {
            set({ user: null, token: null, tenant: null, loginAt: null })
            document.cookie = 'auth-token=; path=/; max-age=0'
            window.location.replace('/login')
          })
        },

        isAuthenticated: () => {
          const { token, loginAt } = get()
          if (!token || loginAt === null) return false
          return Date.now() - loginAt <= SESSION_TTL_MS
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          tenant: state.tenant,
          loginAt: state.loginAt,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
)
