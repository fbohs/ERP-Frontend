'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/services/api'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldError(null)
    setLoading(true)

    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() })
      // Always show the same message — backend always returns 200 regardless
      // of whether the email is registered (enumeration defense).
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        setFieldError('Please enter a valid email address.')
      } else {
        setFieldError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <p className="text-sm text-muted-foreground">
          If that address is registered, a reset link is on its way. Check your inbox.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
        {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
