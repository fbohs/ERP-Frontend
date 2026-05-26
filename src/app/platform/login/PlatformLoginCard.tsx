'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateEmail } from '@/utils/validation'

type Step = 'request' | 'sent'

export function PlatformLoginCard() {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRequestLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationError = validateEmail(email)
    if (validationError) { setError(validationError); return }
    setError(null)
    setLoading(true)

    try {
      await fetch('/api/platform/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      // Always transition to "sent" — backend always returns 200 (enumeration defense)
      setStep('sent')
    } catch {
      setError('Unable to send link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg">
      <div className="p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 'request'
              ? 'Enter your admin email to receive a sign-in link'
              : 'Check your inbox'}
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequestLink} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending link…' : 'Send sign-in link'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              If <span className="font-medium text-foreground">{email}</span> is a registered
              platform admin, a sign-in link has been sent. Click the link in the email to continue.
            </p>
            <p className="text-xs text-muted-foreground">
              The link is single-use and expires shortly.
            </p>
            <button
              type="button"
              onClick={() => { setStep('request'); setError(null) }}
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
