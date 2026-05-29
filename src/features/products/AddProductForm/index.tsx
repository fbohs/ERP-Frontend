'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useProductsStore } from '@/stores/useProductsStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { ImageUploadStep } from '@/features/products/ImageUploadStep'
import { UOM_GROUPS } from '@/constants/uom'
import { cn } from '@/lib/utils'
import type { CreateProductBody, ProductApiError } from '@/types'

const LIST_PRICE_REGEX = /^\d+(\.\d{1,4})?$/

const SELECT_CLASS = cn(
  'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1',
  'text-sm text-foreground shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

interface FieldErrors {
  name?: string
  sku?: string
  categoryId?: string
  uomCode?: string
  listPrice?: string
  compareAtPrice?: string
  tags?: string
  form?: string
}

interface FormState {
  name: string
  sku: string
  categoryId: string
  uomCode: string
  description: string
  type: 'GOODS' | 'SERVICE'
  listPrice: string
  compareAtPrice: string
  tagInput: string
  tags: string[]
}

const INITIAL: FormState = {
  name: '',
  sku: '',
  categoryId: '',
  uomCode: 'EA',
  description: '',
  type: 'GOODS',
  listPrice: '',
  compareAtPrice: '',
  tagInput: '',
  tags: [],
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>
}

export function AddProductForm() {
  const router = useRouter()
  const createProduct = useProductsStore((s) => s.createProduct)
  const { categories, fetchCategories } = useCategoriesStore()

  const [step, setStep] = useState<'form' | 'images'>('form')
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function addTag() {
    const tag = form.tagInput.trim()
    if (!tag) return
    if (form.tags.length >= 20) {
      setErrors((e) => ({ ...e, tags: 'Maximum 20 tags allowed' }))
      return
    }
    if (form.tags.includes(tag)) {
      set('tagInput', '')
      return
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: '' }))
    setErrors((e) => ({ ...e, tags: undefined }))
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!form.name.trim()) e.name = 'Name is required'
    else if (form.name.trim().length > 255) e.name = 'Name must be 255 characters or fewer'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    else if (form.sku.trim().length > 100) e.sku = 'SKU must be 100 characters or fewer'
    if (!form.categoryId) e.categoryId = 'Category is required'
    if (!form.uomCode) e.uomCode = 'Unit of measure is required'
    if (!form.listPrice.trim()) e.listPrice = 'List price is required'
    else if (!LIST_PRICE_REGEX.test(form.listPrice.trim())) e.listPrice = 'Enter a valid price (e.g. 49.99)'
    if (form.compareAtPrice.trim() && !LIST_PRICE_REGEX.test(form.compareAtPrice.trim())) {
      e.compareAtPrice = 'Enter a valid price (e.g. 99.99)'
    }
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setErrors({})
    setSubmitting(true)

    const body: CreateProductBody = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      categoryId: form.categoryId,
      uomCode: form.uomCode,
      listPrice: form.listPrice.trim(),
      type: form.type,
      description: form.description.trim() || null,
      tags: form.tags.length > 0 ? form.tags : undefined,
      compareAtPrice: form.compareAtPrice.trim() || null,
    }

    try {
      const created = await createProduct(body, idempotencyKeyRef.current)
      toast.success(`Product "${created.name}" created.`)
      setCreatedProductId(created.id)
      setStep('images')
    } catch (err) {
      idempotencyKeyRef.current = crypto.randomUUID()
      const apiErr = (err as { body?: ProductApiError }).body
      const code = apiErr?.error?.code
      if (code === 'PRODUCT_SKU_EXISTS') {
        setErrors({ sku: 'This SKU is already in use' })
      } else if (code === 'PRODUCT_SLUG_EXISTS') {
        setErrors({ form: 'A product with this name already exists (URL conflict). Try a different name.' })
      } else if (code === 'INVALID_CATEGORY') {
        setErrors({ categoryId: 'Category not found or inactive' })
      } else if (code === 'INVALID_UOM') {
        setErrors({ uomCode: 'Unit not recognised' })
      } else {
        setErrors({ form: apiErr?.error?.message ?? 'Something went wrong. Try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'images' && createdProductId) {
    return (
      <ImageUploadStep
        productId={createdProductId}
        onDone={() => router.push('/products')}
        onSkip={() => router.push('/products')}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      {/* ── Product details ─────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Product details</SectionHeading>
        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Name" required error={errors.name}>
              <Input
                placeholder="e.g. Blue Widget"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>

          <Field label="SKU" required error={errors.sku} hint="Must be unique within your catalogue">
            <Input
              placeholder="e.g. BW-001"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Category" required error={errors.categoryId}>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              disabled={submitting}
              className={SELECT_CLASS}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Unit of measure" required error={errors.uomCode}>
            <select
              value={form.uomCode}
              onChange={(e) => set('uomCode', e.target.value)}
              disabled={submitting}
              className={SELECT_CLASS}
            >
              {UOM_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.name} ({opt.code})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="flex gap-4 items-center h-9">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="GOODS"
                  checked={form.type === 'GOODS'}
                  onChange={() => set('type', 'GOODS')}
                  disabled={submitting}
                  className="accent-primary"
                />
                Goods
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="SERVICE"
                  checked={form.type === 'SERVICE'}
                  onChange={() => set('type', 'SERVICE')}
                  disabled={submitting}
                  className="accent-primary"
                />
                Service
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <Field label="Description" error={errors.form}>
              <Textarea
                placeholder="Describe the product…"
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag and press Enter"
                value={form.tagInput}
                onChange={(e) => set('tagInput', e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={submitting}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={submitting}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={submitting}
                      aria-label={`Remove tag ${tag}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Pricing</SectionHeading>
        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <Field label="List price (₹)" required error={errors.listPrice} hint="e.g. 49.99 — no currency symbol">
            <Input
              placeholder="0.00"
              value={form.listPrice}
              onChange={(e) => set('listPrice', e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Compare-at price (₹)" error={errors.compareAtPrice} hint="Strike-through 'was' price (optional)">
            <Input
              placeholder="0.00"
              value={form.compareAtPrice}
              onChange={(e) => set('compareAtPrice', e.target.value)}
              disabled={submitting}
            />
          </Field>
        </div>
      </section>

      {errors.form && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/products')}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create product'}
        </Button>
      </div>
    </form>
  )
}
