'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { usePlatformAuthStore } from '@/stores/usePlatformAuthStore'
import { PlatformUserButton } from './PlatformUserButton'

export function PlatformNav() {
  const router = useRouter()
  const platformAdmin = usePlatformAuthStore((s) => s.platformAdmin)
  const clearAuth = usePlatformAuthStore((s) => s.clearAuth)

  async function handleLogout() {
    try {
      await clearAuth()
    } catch {
      // Cookie cleared regardless; server-side cleanup is best-effort
    } finally {
      router.push('/platform/login')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-4 px-6">
        <Link
          href="/platform/dashboard"
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <Shield className="h-5 w-5 text-accent" />
          <span className="text-accent">ERP</span>
          <span className="text-sm font-normal text-muted-foreground">Platform</span>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1" />
        <PlatformUserButton admin={platformAdmin} onLogout={handleLogout} />
      </div>
      <Separator />
    </header>
  )
}
