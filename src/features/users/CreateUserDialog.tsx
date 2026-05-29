'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUsersStore } from '@/stores/useUsersStore'
import type { UserRole, CreateUserBody, MerchantSpecs, VerifierSpecs } from '@/types'

const ASSIGNABLE_ROLES: readonly { value: Exclude<UserRole, 'ADMIN'>; label: string }[] = [
  { value: 'MERCHANT', label: 'Merchant' },
  { value: 'PRODUCT_VERIFIER', label: 'Product Verifier' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'PURCHASING_MANAGER', label: 'Purchasing Manager' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'WAREHOUSE_OPERATOR', label: 'Warehouse Operator' },
  { value: 'REPORT_VIEWER', label: 'Report Viewer' },
]

const CERT_LEVELS = ['JUNIOR', 'SENIOR', 'LEAD'] as const

interface FieldErrors {
  email?: string
  name?: string
  role?: string
  businessName?: string
  registrationNumber?: string
  address?: string
  phoneNumber?: string
  website?: string
  badgeId?: string
  certificationLevel?: string
  specializations?: string
  certifiedUntil?: string
  form?: string
}

export function CreateUserDialog() {
  const createUser = useUsersStore((s) => s.createUser)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  // Basic fields
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Exclude<UserRole, 'ADMIN'> | ''>('')

  // Merchant specs
  const [businessName, setBusinessName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [website, setWebsite] = useState('')

  // Verifier specs
  const [badgeId, setBadgeId] = useState('')
  const [certificationLevel, setCertificationLevel] = useState<'JUNIOR' | 'SENIOR' | 'LEAD' | ''>('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [specInput, setSpecInput] = useState('')
  const [certifiedUntil, setCertifiedUntil] = useState('')

  function reset() {
    setEmail(''); setName(''); setRole('')
    setBusinessName(''); setRegistrationNumber(''); setAddress(''); setPhoneNumber(''); setWebsite('')
    setBadgeId(''); setCertificationLevel(''); setSpecializations([]); setSpecInput(''); setCertifiedUntil('')
    setErrors({})
    idempotencyKeyRef.current = crypto.randomUUID()
  }

  function addSpecialization() {
    const v = specInput.trim()
    if (!v || specializations.includes(v)) return
    setSpecializations((prev) => [...prev, v])
    setSpecInput('')
  }

  function removeSpecialization(s: string) {
    setSpecializations((prev) => prev.filter((x) => x !== s))
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    if (!name.trim()) e.name = 'Name is required'
    if (!role) e.role = 'Role is required'

    if (role === 'MERCHANT') {
      if (!businessName.trim()) e.businessName = 'Business name is required'
      if (!registrationNumber.trim()) e.registrationNumber = 'Registration number is required'
      if (!address.trim()) e.address = 'Address is required'
      if (!phoneNumber.trim()) e.phoneNumber = 'Phone number is required'
      if (website.trim() && !/^https?:\/\/.+/.test(website.trim())) {
        e.website = 'Must be a valid URL (https://…)'
      }
    }

    if (role === 'PRODUCT_VERIFIER') {
      if (!badgeId.trim()) e.badgeId = 'Badge / Employee ID is required'
      if (!certificationLevel) e.certificationLevel = 'Certification level is required'
      if (specializations.length === 0) e.specializations = 'At least one specialization is required'
      if (!certifiedUntil) e.certifiedUntil = 'Certification expiry date is required'
    }

    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setErrors({})
    setSubmitting(true)

    let body: CreateUserBody
    if (role === 'MERCHANT') {
      const specs: MerchantSpecs = {
        merchant: {
          businessName: businessName.trim(),
          registrationNumber: registrationNumber.trim(),
          address: address.trim(),
          phoneNumber: phoneNumber.trim(),
          ...(website.trim() ? { website: website.trim() } : {}),
        },
      }
      body = { role: 'MERCHANT', email: email.trim(), name: name.trim(), specs }
    } else if (role === 'PRODUCT_VERIFIER') {
      const specs: VerifierSpecs = {
        verifier: {
          badgeId: badgeId.trim(),
          certificationLevel: certificationLevel as 'JUNIOR' | 'SENIOR' | 'LEAD',
          specializations,
          certifiedUntil,
        },
      }
      body = { role: 'PRODUCT_VERIFIER', email: email.trim(), name: name.trim(), specs }
    } else {
      body = {
        role: role as Exclude<UserRole, 'ADMIN' | 'MERCHANT' | 'PRODUCT_VERIFIER'>,
        email: email.trim(),
        name: name.trim(),
        specs: null,
      }
    }

    try {
      const created = await createUser(body, idempotencyKeyRef.current)
      toast.success(`Account created. ${created.name} will receive an email with their temporary password.`)
      setOpen(false)
      reset()
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'EMAIL_ALREADY_TAKEN') {
        setErrors({ email: 'This email is already registered in your organisation.' })
      } else if (code === 'CONFLICT') {
        setErrors({ form: 'Duplicate submission detected. Please try again.' })
        idempotencyKeyRef.current = crypto.randomUUID()
      } else if (code === 'VALIDATION_ERROR') {
        setErrors({ form: 'Please check your inputs and try again.' })
      } else {
        setErrors({ form: (err as Error).message ?? 'Something went wrong.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a new user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Basic details */}
          <Field label="Email" error={errors.email}>
            <Input
              id="email"
              type="email"
              placeholder="jane@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Full name" error={errors.name}>
            <Input
              id="name"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Role" error={errors.role}>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Exclude<UserRole, 'ADMIN'>)}
              disabled={submitting}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Merchant specs */}
          {role === 'MERCHANT' && (
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Business details
              </p>
              <Field label="Business name" error={errors.businessName}>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={submitting} placeholder="Acme Ltd" />
              </Field>
              <Field label="Registration number" error={errors.registrationNumber}>
                <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} disabled={submitting} placeholder="UK-12345" />
              </Field>
              <Field label="Business address" error={errors.address}>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={submitting} placeholder="1 Market St, London" />
              </Field>
              <Field label="Phone number" error={errors.phoneNumber}>
                <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={submitting} placeholder="+441234567890" />
              </Field>
              <Field label="Website (optional)" error={errors.website}>
                <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={submitting} placeholder="https://acme.com" />
              </Field>
            </div>
          )}

          {/* Verifier specs */}
          {role === 'PRODUCT_VERIFIER' && (
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Verifier credentials
              </p>
              <Field label="Badge / Employee ID" error={errors.badgeId}>
                <Input value={badgeId} onChange={(e) => setBadgeId(e.target.value)} disabled={submitting} placeholder="BADGE-042" />
              </Field>
              <Field label="Certification level" error={errors.certificationLevel}>
                <Select
                  value={certificationLevel}
                  onValueChange={(v) => setCertificationLevel(v as 'JUNIOR' | 'SENIOR' | 'LEAD')}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l.charAt(0) + l.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex flex-col gap-1.5">
                <Label>Specializations</Label>
                <div className="flex gap-2">
                  <Input
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addSpecialization() }
                    }}
                    disabled={submitting}
                    placeholder="e.g. electronics"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addSpecialization} disabled={submitting}>
                    Add
                  </Button>
                </div>
                {specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {specializations.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(s)}
                          className="opacity-60 hover:opacity-100"
                          disabled={submitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.specializations && (
                  <p className="text-xs text-destructive">{errors.specializations}</p>
                )}
              </div>
              <Field label="Certified until" error={errors.certifiedUntil}>
                <Input
                  type="date"
                  value={certifiedUntil}
                  onChange={(e) => setCertifiedUntil(e.target.value)}
                  disabled={submitting}
                />
              </Field>
            </div>
          )}

          {errors.form && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); reset() }} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
