'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePlatformAuthStore } from '@/stores/usePlatformAuthStore'
import type { PlatformAdmin } from '@/types'

export function VerifyClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = usePlatformAuthStore((s) => s.setAuth)

  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setErrorMessage('No sign-in token found in the link. Please request a new one.')
      setStatus('error')
      return
    }

    async function verify() {
      try {
        const res = await fetch('/api/platform/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ message: 'Verification failed.' }))) as {
            message?: string
          }
          setErrorMessage(err.message ?? 'Invalid or expired sign-in link.')
          setStatus('error')
          return
        }

        const data = (await res.json()) as { ok: boolean; admin: PlatformAdmin | null }
        if (data.admin) setAuth(data.admin)

        router.replace('/platform/dashboard')
      } catch {
        setErrorMessage('Unable to verify your link. Please request a new one.')
        setStatus('error')
      }
    }

    void verify()
  }, [searchParams, router, setAuth])

  if (status === 'verifying') {
    return <p className="text-sm text-muted-foreground">Verifying your sign-in link…</p>
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="text-sm text-destructive">{errorMessage}</p>
      <a
        href="/platform/login"
        className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        Request a new sign-in link
      </a>
    </div>
  )
}
