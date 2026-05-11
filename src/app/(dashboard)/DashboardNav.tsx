'use client'

import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/stores/useAuthStore'

export function DashboardNav() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return <Navbar user={user} onLogout={clearAuth} />
}
