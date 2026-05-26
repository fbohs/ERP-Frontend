'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Tenant, CreateTenantBody, BackendError } from '@/types'

interface TenantsState {
  tenants: Tenant[]
  loading: boolean
  error: string | null
  fetchTenants: (signal?: AbortSignal) => Promise<void>
  createTenant: (body: CreateTenantBody, idempotencyKey: string) => Promise<Tenant>
  toggleActive: (id: string, isActive: boolean, idempotencyKey: string) => Promise<void>
  onUnauthorized: () => void
}

export const usePlatformTenantsStore = create<TenantsState>()(
  devtools(
    (set, get) => ({
      tenants: [],
      loading: false,
      error: null,

      onUnauthorized: () => {},

      fetchTenants: async (signal?) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/platform/tenants', { signal })
          if (res.status === 401) {
            get().onUnauthorized()
            set({ loading: false })
            return
          }
          if (!res.ok) {
            const body = (await res.json()) as BackendError
            set({ error: body.error.message, loading: false })
            return
          }
          const body = (await res.json()) as { tenants: Tenant[] }
          set({ tenants: body.tenants, loading: false })
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          set({ error: 'Failed to load tenants', loading: false })
        }
      },

      createTenant: async (payload, idempotencyKey) => {
        const res = await fetch('/api/platform/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(payload),
        })

        if (res.status === 401) {
          get().onUnauthorized()
          throw new Error('UNAUTHORIZED')
        }

        const data = await res.json()

        if (!res.ok) {
          const err = data as BackendError
          throw Object.assign(new Error(err.error.message), { code: err.error.code })
        }

        // Fetch full tenant record and prepend to list
        const created = data as { tenant: { id: string } }
        const detailRes = await fetch(`/api/platform/tenants/${created.tenant.id}`)
        if (!detailRes.ok) throw new Error('Failed to fetch created tenant')
        const full = (await detailRes.json()) as Tenant

        set((s) => ({ tenants: [full, ...s.tenants] }))
        return full
      },

      toggleActive: async (id, isActive, idempotencyKey) => {
        const res = await fetch(`/api/platform/tenants/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ isActive }),
        })

        if (res.status === 401) {
          get().onUnauthorized()
          throw new Error('UNAUTHORIZED')
        }

        const data = await res.json()

        if (!res.ok) {
          const err = data as BackendError
          throw Object.assign(new Error(err.error.message), { code: err.error.code })
        }

        const updated = data as Tenant
        set((s) => ({
          tenants: s.tenants.map((t) => (t.id === id ? updated : t)),
        }))
      },
    }),
    { name: 'PlatformTenantsStore' },
  ),
)
