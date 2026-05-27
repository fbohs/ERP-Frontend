'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Category } from '@/types'

interface Props {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateCategoryDialog({ category, open, onOpenChange }: Props) {
  const deactivateCategory = useCategoriesStore((s) => s.deactivateCategory)
  const role = useAuthStore((s) => s.user?.role)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  async function handleConfirm() {
    if (!role) return
    setSubmitting(true)
    setError(null)
    try {
      await deactivateCategory(category.id, idempotencyKeyRef.current, role)
      toast.success(`"${category.name}" has been deactivated.`)
      onOpenChange(false)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'CATEGORY_HAS_PRODUCTS') {
        toast.error(
          'Cannot deactivate — this category has active products assigned to it. Archive or reassign those products first.',
        )
        onOpenChange(false)
      } else if (code === 'CATEGORY_NOT_FOUND') {
        toast.error('Category not found. It may have already been removed.')
        onOpenChange(false)
      } else {
        // Network / unknown — keep dialog open, reuse idempotency key
        setError('Network error. Try again.')
      }
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
          <DialogTitle>Deactivate category?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          &ldquo;{category.name}&rdquo; will be deactivated and hidden from non-admin users.
          You can reactivate it later from the edit panel.
        </p>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
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
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
