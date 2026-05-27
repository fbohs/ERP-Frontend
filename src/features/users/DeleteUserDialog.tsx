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

export function DeleteUserDialog({ user, open, onOpenChange }: Props) {
  const deleteUser = useUsersStore((s) => s.deleteUser)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await deleteUser(user.id, idempotencyKeyRef.current)
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
          <DialogTitle>Delete &ldquo;{user.name}&rdquo;?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Their account will be permanently deactivated. This action cannot be undone.
        </p>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
