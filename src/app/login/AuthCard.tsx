import { LoginForm } from './LoginForm'

export function AuthCard() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg">
      <div className="p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ERP Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your merchant account</p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
