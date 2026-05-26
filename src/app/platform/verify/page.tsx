import { Suspense } from 'react'
import { VerifyClient } from './VerifyClient'

export default function PlatformVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg text-center">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Platform Admin</h1>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Verifying your sign-in link…</p>}>
          <VerifyClient />
        </Suspense>
      </div>
    </div>
  )
}
