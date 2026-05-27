'use client'

import { useEffect } from 'react'
import { bootstrapUnauthorizedHandler } from '@/stores/useAuthStore'

// Placed in the root layout. Wires the global 401 handler so any authenticated
// API call that receives a 401 triggers a full logout and redirect to /login.
// Does NOT call validateSession() here — public pages (login, setup-password)
// must not attempt session validation, as it can delete the session cookie
// before a successful login redirect completes.
export function AuthBootstrap() {
  useEffect(() => {
    bootstrapUnauthorizedHandler()
  }, [])

  return null
}
