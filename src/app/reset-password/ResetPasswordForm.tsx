'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength } from '@/components/PasswordStrength'
import { api, ApiError } from '@/services/api'
import { validatePassword } from '@/utils/password'

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) router.replace('/forgot-password')
  }, [token, router])

  function validate(): string | null {
    const pwErr = validatePassword(password)
    if (pwErr) return pwErr
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validate()
    if (err) { setFieldError(err); return }
    setFieldError(null)
    setFormError(null)
    setLoading(true)

    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password })
      setSuccess(true)
      setTimeout(() => router.replace('/login'), 3000)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError('This reset link has expired or has already been used.')
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground">
          Password updated. Redirecting you to sign in…
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <PasswordStrength password={password} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}

      {formError && (
        <p className="text-sm text-destructive">
          {formError}{' '}
          <Link href="/forgot-password" className="underline">
            Request a new one.
          </Link>
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}
