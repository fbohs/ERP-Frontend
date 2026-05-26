'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { PlatformAdmin } from '@/types'

interface PlatformAuthState {
  readonly platformAdmin: PlatformAdmin | null
  readonly serverValidated: boolean
  setAuth: (admin: PlatformAdmin) => void
  clearAuth: () => Promise<void>
  validateSession: () => Promise<void>
  isAuthenticated: () => boolean
}

export const usePlatformAuthStore = create<PlatformAuthState>()(
  devtools(
    persist(
      (set, get) => ({
        platformAdmin: null,
        serverValidated: false,
        setAuth: (admin) => set({ platformAdmin: admin, serverValidated: true }),
        clearAuth: async () => {
          set({ platformAdmin: null, serverValidated: false })
          const res = await fetch('/api/platform/auth/logout', { method: 'POST' })
          if (!res.ok) throw new Error(`Logout failed: ${res.statusText}`)
        },
        validateSession: async () => {
          try {
            const res = await fetch('/api/platform/auth/me')
            if (res.ok) {
              const admin = (await res.json()) as PlatformAdmin
              set({ platformAdmin: admin, serverValidated: true })
            } else {
              set({ platformAdmin: null, serverValidated: false })
            }
          } catch {
            set({ serverValidated: false })
          }
        },
        isAuthenticated: () => {
          const { platformAdmin, serverValidated } = get()
          return platformAdmin !== null && serverValidated
        },
      }),
      {
        name: 'platform-auth-storage',
        partialize: (state) => ({ platformAdmin: state.platformAdmin }),
        onRehydrateStorage: () => (state) => {
          if (state?.platformAdmin) {
            state.serverValidated = true
          }
        },
      },
    ),
    { name: 'PlatformAuthStore' },
  ),
)
