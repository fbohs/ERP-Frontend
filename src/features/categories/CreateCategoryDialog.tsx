'use client'

import { useRef, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import type { Category, CreateCategoryBody } from '@/types'

const CATEGORY_WRITE_ROLES = ['ADMIN', 'CONTENT_MANAGER'] as const

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface FieldErrors {
  name?: string
  slug?: string
  description?: string
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

export function CreateCategoryDialog() {
  const role = useAuthStore((s) => s.user?.role)
  const createCategory = useCategoriesStore((s) => s.createCategory)
  const categories = useCategoriesStore((s) => s.categories)

  if (!role || !(CATEGORY_WRITE_ROLES as readonly string[]).includes(role)) return null

  return <CreateCategoryDialogInner createCategory={createCategory} categories={categories} />
}

type CreateCategoryFn = (body: CreateCategoryBody, idempotencyKey: string) => Promise<Category>

function CreateCategoryDialogInner({
  createCategory,
  categories,
}: {
  createCategory: CreateCategoryFn
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentOpen, setParentOpen] = useState(false)
  const [parentQuery, setParentQuery] = useState('')

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive !== false),
    [categories],
  )

  const filteredParents = useMemo(() => {
    const q = parentQuery.toLowerCase()
    return q
      ? activeCategories.filter((c) => c.name.toLowerCase().includes(q))
      : activeCategories
  }, [activeCategories, parentQuery])

  const selectedParentName = parentId
    ? (activeCategories.find((c) => c.id === parentId)?.name ?? null)
    : null

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(toSlug(value))
  }

  function handleSlugChange(value: string) {
    setSlug(value)
    setSlugTouched(true)
  }

  function reset() {
    setName('')
    setSlug('')
    setSlugTouched(false)
    setDescription('')
    setParentId(null)
    setParentQuery('')
    setErrors({})
    idempotencyKeyRef.current = crypto.randomUUID()
  }

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
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setErrors({})
    setSubmitting(true)

    const body: CreateCategoryBody = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      parentId,
    }

    try {
      const created = await createCategory(body, idempotencyKeyRef.current)
      toast.success(`Category "${created.name}" created successfully.`)
      setOpen(false)
      reset()
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'CATEGORY_SLUG_EXISTS') {
        setErrors({ slug: 'This slug is already in use. Choose a different one.' })
        idempotencyKeyRef.current = crypto.randomUUID()
      } else if (code === 'VALIDATION_ERROR') {
        setErrors({ form: 'Something went wrong. Check your inputs and try again.' })
      } else {
        const msg = (err as Error).message
        if (msg && msg.toLowerCase().includes('network')) {
          setErrors({ form: 'Network error. Check your connection and try again.' })
        } else {
          setErrors({ form: msg ?? 'Something went wrong. Check your inputs and try again.' })
        }
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
          Add Category
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a new category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <Field label="Name" error={errors.name}>
            <Input
              placeholder="e.g. Electronics"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field
            label="Slug"
            error={errors.slug}
            hint="Lowercase letters, numbers, and hyphens only"
          >
            <Input
              placeholder="e.g. electronics"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="A short description of this category"
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
              onClick={() => { setOpen(false); reset() }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
