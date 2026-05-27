'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength } from '@/components/PasswordStrength'
import { useAuthStore } from '@/stores/useAuthStore'
import { api, ApiError } from '@/services/api'
import { validatePassword } from '@/utils/password'

const SETUP_TTL_SECONDS = 15 * 60
const WARN_AT_SECONDS = 2 * 60

export function SetupPasswordForm() {
  const router = useRouter()

  const pendingSetupToken = useAuthStore((s) => s.pendingSetupToken)
  const setPendingSetupToken = useAuthStore((s) => s.setPendingSetupToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(SETUP_TTL_SECONDS)

  const mountedAt = useRef(Date.now())

  useEffect(() => {
    if (!pendingSetupToken) { router.replace('/login'); return }
    if (isAuthenticated()) { router.replace('/dashboard'); return }
  }, [pendingSetupToken, isAuthenticated, router])

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - mountedAt.current) / 1000)
      setSecondsLeft(Math.max(0, SETUP_TTL_SECONDS - elapsed))
    }, 1000)
    return () => clearInterval(id)
  }, [])

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
      await api.post('/api/auth/setup-password', {
        token: pendingSetupToken,
        newPassword: password,
      })

      // Password is set and the session cookie is now live.
      // Clear the setup token and send the user to login so they authenticate
      // normally — the login response returns the full user + tenant object.
      setPendingSetupToken(null)
      router.replace('/login')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError(
          'This setup link has expired or has already been used. Please log in again.',
        )
        setTimeout(() => router.replace('/login'), 3000)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const showWarning = secondsLeft <= WARN_AT_SECONDS && secondsLeft > 0
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {showWarning && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Your setup link expires in {minutes}:{seconds}. Please finish soon.
        </p>
      )}

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
      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Activating…' : 'Set password & continue'}
      </Button>
    </form>
  )
}
