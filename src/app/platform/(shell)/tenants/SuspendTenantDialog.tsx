'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePlatformTenantsStore } from '@/stores/usePlatformTenantsStore'
import type { Tenant } from '@/types'

interface Props {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendTenantDialog({ tenant, open, onOpenChange }: Props) {
  const toggleActive = usePlatformTenantsStore((s) => s.toggleActive)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID())

  const isSuspending = tenant.isActive

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await toggleActive(tenant.id, !tenant.isActive, idempotencyKeyRef.current)
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
      idempotencyKeyRef.current = crypto.randomUUID()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v)
          if (!v) {
            setError(null)
            idempotencyKeyRef.current = crypto.randomUUID()
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isSuspending ? 'Suspend' : 'Reactivate'} &ldquo;{tenant.name}&rdquo;?
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {isSuspending
            ? "This tenant's users will lose access on their next request. You can reactivate it at any time."
            : 'This tenant will be reactivated and its users will regain access.'}
        </p>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant={isSuspending ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting
              ? isSuspending
                ? 'Suspending…'
                : 'Reactivating…'
              : isSuspending
                ? 'Suspend'
                : 'Reactivate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
