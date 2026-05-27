'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { setUnauthorizedHandler } from '@/services/api'
import type { User, AuthTenant } from '@/types'

interface AuthState {
  readonly user: User | null
  readonly tenant: AuthTenant | null
  // Held in memory only (not persisted). Passed from login → setup-password page.
  readonly pendingSetupToken: string | null

  setAuth: (user: User, tenant: AuthTenant) => void
  setPendingSetupToken: (token: string | null) => void
  clearAuth: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        tenant: null,
        pendingSetupToken: null,

        setAuth: (user, tenant) => {
          set({ user, tenant })
        },

        setPendingSetupToken: (token) => {
          set({ pendingSetupToken: token })
        },

        clearAuth: async () => {
          set({ user: null, tenant: null })
          await fetch('/api/auth/logout', { method: 'DELETE' }).catch(() => {
            // Best-effort — local state already cleared.
          })
        },

        isAuthenticated: () => get().user !== null,
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          tenant: state.tenant,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
)

// Wired up by AuthBootstrap on mount so any API 401 (outside auth routes)
// triggers a full logout and redirect.
export function bootstrapUnauthorizedHandler() {
  setUnauthorizedHandler(async () => {
    useAuthStore.setState({ user: null, tenant: null })
    await fetch('/api/auth/logout', { method: 'DELETE' }).catch(() => {})
    window.location.replace('/login')
  })
}
