import { Suspense } from 'react'
import { SetupPasswordForm } from './SetupPasswordForm'

export default function SetupPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Set your password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a password to activate your account.
            </p>
          </div>
          <Suspense>
            <SetupPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
