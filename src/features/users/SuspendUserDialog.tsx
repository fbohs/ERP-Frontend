'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUsersStore } from '@/stores/useUsersStore'
import type { TenantUser } from '@/types'

interface Props {
  user: TenantUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendUserDialog({ user, open, onOpenChange }: Props) {
  const patchUser = useUsersStore((s) => s.patchUser)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const isSuspending = user.isActive

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await patchUser(user.id, !user.isActive, idempotencyKeyRef.current)
      onOpenChange(false)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'CANNOT_MODIFY_SELF') {
        setError('You cannot perform this action on your own account.')
      } else {
        setError((err as Error).message ?? 'Something went wrong.')
      }
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
          if (!v) { setError(null); idempotencyKeyRef.current = crypto.randomUUID() }
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isSuspending ? 'Suspend' : 'Reactivate'} &ldquo;{user.name}&rdquo;?
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {isSuspending
            ? 'They will no longer be able to sign in. Existing sessions expire naturally — immediate revocation is not applied.'
            : `${user.name} will regain access and can sign in immediately.`}
        </p>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={isSuspending ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting
              ? isSuspending ? 'Suspending…' : 'Reactivating…'
              : isSuspending ? 'Suspend' : 'Reactivate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
