'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useProductsStore } from '@/stores/useProductsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import type { ProductView, ProductApiError } from '@/types'

type ProductStatus = ProductView['status']
type VerificationStatus = ProductView['verificationStatus']

const STATUS_STYLES: Record<ProductStatus, string> = {
  DRAFT:    'border-muted-foreground text-muted-foreground',
  ACTIVE:   'border-blue-500 text-blue-500',
  INACTIVE: 'border-amber-500 text-amber-500',
  ARCHIVED: 'border-destructive text-destructive',
}

const VERIFICATION_STYLES: Record<VerificationStatus, string> = {
  PENDING:  'border-amber-500 text-amber-500',
  VERIFIED: 'border-primary text-primary',
  REJECTED: 'border-destructive text-destructive',
}

const ALL_STATUSES: readonly ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']

const SELECT_CLASS = cn(
  'h-9 rounded-md border border-input bg-card px-3 py-1',
  'text-sm text-foreground shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

export function StatusSection({ product }: { readonly product: ProductView }) {
  const updateProduct = useProductsStore((s) => s.updateProduct)
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'ADMIN'

  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>(product.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedStatus(product.status)
  }, [product.status])

  async function handleUpdate() {
    if (selectedStatus === product.status) return
    setSaving(true)
    setError(null)
    try {
      await updateProduct(product.id, { status: selectedStatus }, crypto.randomUUID())
      toast.success(`Status updated to ${selectedStatus}.`)
    } catch (err) {
      const apiErr = (err as { body?: ProductApiError }).body
      setError(apiErr?.error?.message ?? 'Failed to update status.')
      setSelectedStatus(product.status)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-start gap-6 p-5">
        {/* Status */}
        <div className="flex flex-col gap-2 min-w-[160px]">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
          <Badge variant="outline" className={cn('w-fit text-xs', STATUS_STYLES[product.status])}>
            {product.status}
          </Badge>
        </div>

        {/* Verification */}
        <div className="flex flex-col gap-2 min-w-[160px]">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Verification</Label>
          <Badge variant="outline" className={cn('w-fit text-xs', VERIFICATION_STYLES[product.verificationStatus])}>
            {product.verificationStatus.replace('_', ' ')}
          </Badge>
        </div>

        {/* Published */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Published</Label>
          <Badge
            variant="outline"
            className={cn(
              'w-fit text-xs',
              product.isPublished
                ? 'border-primary text-primary'
                : 'border-muted-foreground text-muted-foreground',
            )}
          >
            {product.isPublished ? 'Published' : 'Not published'}
          </Badge>
        </div>

        {isAdmin && product.isSuspendedByOperator && (
          <div className="flex flex-col gap-2 min-w-[120px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Operator</Label>
            <Badge variant="outline" className="w-fit text-xs border-destructive text-destructive">
              Suspended
            </Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Status change row */}
      <div className="flex items-center gap-3 p-4">
        <Label className="shrink-0 text-sm">Change status</Label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
          disabled={saving}
          className={SELECT_CLASS}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          type="button"
          size="sm"
          onClick={() => void handleUpdate()}
          disabled={saving || selectedStatus === product.status}
        >
          {saving ? 'Updating…' : 'Update'}
        </Button>
      </div>
    </div>
  )
}
