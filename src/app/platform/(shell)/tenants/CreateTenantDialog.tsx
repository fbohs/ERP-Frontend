'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { usePlatformTenantsStore } from '@/stores/usePlatformTenantsStore'

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

interface FieldErrors {
  tenantName?: string
  slug?: string
  adminEmail?: string
  adminName?: string
  form?: string
}

export function CreateTenantDialog() {
  const createTenant = usePlatformTenantsStore((s) => s.createTenant)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID())

  const [tenantName, setTenantName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminName, setAdminName] = useState('')

  function reset() {
    setTenantName('')
    setSlug('')
    setAdminEmail('')
    setAdminName('')
    setErrors({})
    idempotencyKeyRef.current = crypto.randomUUID()
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!tenantName.trim()) e.tenantName = 'Name is required'
    if (!slug.trim()) {
      e.slug = 'Slug is required'
    } else if (slug.length > 63) {
      e.slug = 'Slug must be 63 characters or fewer'
    } else if (!SLUG_RE.test(slug)) {
      e.slug = 'Lowercase letters, numbers, hyphens only; must start and end with alphanumeric'
    }
    if (!adminEmail.trim()) {
      e.adminEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      e.adminEmail = 'Enter a valid email address'
    }
    if (!adminName.trim()) e.adminName = 'Admin name is required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await createTenant(
        {
          tenant: { name: tenantName.trim(), slug: slug.trim() },
          admin: { email: adminEmail.trim(), name: adminName.trim() },
        },
        idempotencyKeyRef.current,
      )
      setOpen(false)
      reset()
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'TENANT_SLUG_TAKEN') {
        setErrors({ slug: 'This slug is already taken' })
      } else if (code === 'VALIDATION_ERROR') {
        setErrors({ form: 'Please check your inputs and try again' })
      } else {
        setErrors({ form: (err as Error).message ?? 'Something went wrong' })
      }
      // Reuse the same idempotency key on retry for idempotent re-submission
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Onboard Tenant
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Onboard a new tenant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tenant-name">Tenant name</Label>
            <Input
              id="tenant-name"
              placeholder="Acme Corp"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              disabled={submitting}
            />
            {errors.tenantName && <p className="text-xs text-destructive">{errors.tenantName}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="acme-corp"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase alphanumeric and hyphens, 1–63 chars
            </p>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
          </div>

          <div className="border-t border-border pt-2">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              First admin account
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  placeholder="Alice Smith"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  disabled={submitting}
                />
                {errors.adminName && (
                  <p className="text-xs text-destructive">{errors.adminName}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="alice@acme.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={submitting}
                />
                {errors.adminEmail && (
                  <p className="text-xs text-destructive">{errors.adminEmail}</p>
                )}
              </div>
            </div>
          </div>

          {errors.form && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                reset()
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
