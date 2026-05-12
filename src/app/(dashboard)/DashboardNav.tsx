'use client'

import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/stores/useAuthStore'

export function DashboardNav() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  return <Navbar user={user} onLogout={handleLogout} />
}
