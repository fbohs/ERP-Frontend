import { ForgotPasswordForm } from './ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Forgot your password?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send a reset link if it&apos;s registered.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
