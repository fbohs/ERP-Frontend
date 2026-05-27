'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/useAuthStore'
import { api } from '@/services/api'
import { validateEmail, validateName, validatePhone } from '@/utils/validation'
import { validatePassword } from '@/utils/password'
import { PasswordStrength } from '@/components/PasswordStrength'
import type { User, AuthTenant } from '@/types'

interface RegisterResponse {
  readonly user: User
  readonly tenant: AuthTenant
}

interface RegisterPayload {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly confirmPassword: string
  readonly phone: string
}

export function RegisterForm() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    return (
      validateName(name) ??
      validateEmail(email) ??
      validatePhone(phone) ??
      validatePassword(password) ??
      (password !== confirmPassword ? 'Passwords do not match.' : null)
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)
    setLoading(true)

    const payload: RegisterPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      phone: phone.trim(),
    }

    try {
      const { user, tenant } = await api.post<RegisterResponse>('/auth/merchant/register', payload)
      setAuth(user, tenant)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-name">Name</Label>
        <Input
          id="reg-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Edward Patrick"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="merchant@example.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-phone">Phone</Label>
        <Input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555-0100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
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
        <Label htmlFor="reg-confirm-password">Confirm password</Label>
        <Input
          id="reg-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
