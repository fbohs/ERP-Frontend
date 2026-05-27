'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import type { Category, UpdateCategoryBody } from '@/types'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface FieldErrors {
  name?: string
  slug?: string
  description?: string
  parentId?: string
  form?: string
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface Props {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCategoryDialog({ category, open, onOpenChange }: Props) {
  const updateCategory = useCategoriesStore((s) => s.updateCategory)
  const categories = useCategoriesStore((s) => s.categories)
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'ADMIN'

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const [name, setName] = useState(category.name)
  const [slug, setSlug] = useState(category.slug)
  const [description, setDescription] = useState(category.description ?? '')
  const [parentId, setParentId] = useState<string | null>(category.parentId)
  const [isActive, setIsActive] = useState(category.isActive ?? true)
  const [parentOpen, setParentOpen] = useState(false)
  const [parentQuery, setParentQuery] = useState('')

  // Re-populate whenever the category prop changes (different row opened)
  useEffect(() => {
    setName(category.name)
    setSlug(category.slug)
    setDescription(category.description ?? '')
    setParentId(category.parentId)
    setIsActive(category.isActive ?? true)
    setErrors({})
    idempotencyKeyRef.current = crypto.randomUUID()
  }, [category])

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive !== false && c.id !== category.id),
    [categories, category.id],
  )

  const filteredParents = useMemo(() => {
    const q = parentQuery.toLowerCase()
    return q ? activeCategories.filter((c) => c.name.toLowerCase().includes(q)) : activeCategories
  }, [activeCategories, parentQuery])

  const selectedParentName = parentId
    ? (activeCategories.find((c) => c.id === parentId)?.name ?? null)
    : null

  const isDirty =
    name !== category.name ||
    slug !== category.slug ||
    description !== (category.description ?? '') ||
    parentId !== category.parentId ||
    (isAdmin && isActive !== (category.isActive ?? true))

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!name.trim()) e.name = 'Name is required'
    else if (name.trim().length > 255) e.name = 'Name must be 255 characters or fewer'
    if (!slug.trim()) e.slug = 'Slug is required'
    else if (slug.length > 120) e.slug = 'Slug must be 120 characters or fewer'
    else if (!SLUG_REGEX.test(slug)) e.slug = 'Lowercase letters, numbers, and hyphens only'
    if (description.length > 1000) e.description = 'Description must be 1000 characters or fewer'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isDirty) return
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setErrors({})
    setSubmitting(true)

    const body: UpdateCategoryBody = {}
    if (name !== category.name) body.name = name.trim()
    if (slug !== category.slug) body.slug = slug.trim()
    if (description !== (category.description ?? '')) body.description = description.trim() || null
    if (parentId !== category.parentId) body.parentId = parentId
    if (isAdmin && isActive !== (category.isActive ?? true)) body.isActive = isActive

    try {
      const updated = await updateCategory(category.id, body, idempotencyKeyRef.current)
      toast.success(`"${updated.name}" updated successfully.`)
      onOpenChange(false)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'CATEGORY_SLUG_EXISTS') {
        setErrors({ slug: 'This slug is already in use. Choose a different one.' })
        idempotencyKeyRef.current = crypto.randomUUID()
      } else if (code === 'CIRCULAR_CATEGORY_REFERENCE') {
        setErrors({ parentId: 'This would create a circular reference. Choose a different parent.' })
        idempotencyKeyRef.current = crypto.randomUUID()
      } else if (code === 'CATEGORY_NOT_FOUND') {
        setErrors({ form: 'This category no longer exists. Refresh the page.' })
      } else if (code === 'VALIDATION_ERROR') {
        setErrors({ form: 'Something went wrong. Check your inputs and try again.' })
      } else {
        const msg = (err as Error).message
        if (!msg || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
          setErrors({ form: 'Network error. Check your connection and try again.' })
        } else {
          setErrors({ form: msg })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const notFound = errors.form?.includes('no longer exists')

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v)
          if (!v) {
            setErrors({})
            idempotencyKeyRef.current = crypto.randomUUID()
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <Field label="Name" error={errors.name}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field
            label="Slug"
            error={errors.slug}
            hint="Lowercase letters, numbers, and hyphens only"
          >
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
            />
            <p className={cn(
              'text-xs text-right',
              description.length > 1000 ? 'text-destructive' : 'text-muted-foreground',
            )}>
              {description.length} / 1000
            </p>
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Parent category (optional)</Label>
            <Popover open={parentOpen} onOpenChange={setParentOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={parentOpen}
                  className="w-full justify-between font-normal"
                  disabled={submitting}
                >
                  {selectedParentName ?? 'None (root category)'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="p-2 border-b border-border">
                  <Input
                    placeholder="Search categories…"
                    value={parentQuery}
                    onChange={(e) => setParentQuery(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary cursor-pointer',
                      parentId === null && 'text-primary',
                    )}
                    onClick={() => { setParentId(null); setParentQuery(''); setParentOpen(false) }}
                  >
                    <Check className={cn('h-4 w-4', parentId === null ? 'opacity-100' : 'opacity-0')} />
                    None (root category)
                  </button>
                  {filteredParents.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No categories found.</p>
                  ) : (
                    filteredParents.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary cursor-pointer',
                          parentId === cat.id && 'text-primary',
                        )}
                        onClick={() => { setParentId(cat.id); setParentQuery(''); setParentOpen(false) }}
                      >
                        <Check className={cn('h-4 w-4', parentId === cat.id ? 'opacity-100' : 'opacity-0')} />
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {errors.parentId && (
              <p className="text-xs text-destructive">{errors.parentId}</p>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="cursor-pointer" htmlFor="isActive-toggle">Active</Label>
              <button
                id="isActive-toggle"
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                disabled={submitting}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'bg-primary' : 'bg-input',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                    isActive ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
          )}

          {errors.form && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
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
            <Button type="submit" disabled={submitting || !isDirty || notFound}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
