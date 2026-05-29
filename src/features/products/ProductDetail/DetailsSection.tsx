'use client'

import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useProductsStore } from '@/stores/useProductsStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { UOM_GROUPS } from '@/constants/uom'
import { cn } from '@/lib/utils'
import type { ProductView, UpdateProductBody, ProductApiError } from '@/types'
import { ImagesSection } from './ImagesSection'

const SELECT_CLASS = cn(
  'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1',
  'text-sm text-foreground shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

interface FormState {
  name: string
  sku: string
  categoryId: string
  uomCode: string
  description: string
  type: 'GOODS' | 'SERVICE'
  tagInput: string
  tags: string[]
  hsnCode: string
}

interface FieldErrors {
  name?: string
  sku?: string
  categoryId?: string
  uomCode?: string
  tags?: string
  form?: string
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  readonly label: string
  readonly required?: boolean
  readonly error?: string
  readonly hint?: string
  readonly children: React.ReactNode
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

function SectionHeading({ children }: { readonly children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>
}

function fromProduct(p: ProductView): FormState {
  return {
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    uomCode: p.uomCode,
    description: p.description ?? '',
    type: p.type,
    tagInput: '',
    tags: [...p.tags],
    hsnCode: p.hsnCode ?? '',
  }
}

export function DetailsSection({ product }: { readonly product: ProductView }) {
  const updateProduct = useProductsStore((s) => s.updateProduct)
  const { categories, fetchCategories } = useCategoriesStore()

  const [form, setForm] = useState<FormState>(() => fromProduct(product))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const defaultVariant = product.variants[0] ?? null

  useEffect(() => { void fetchCategories() }, [fetchCategories])

  // Reset form when navigating to a different product
  useEffect(() => {
    setForm(fromProduct(product))
  }, [product.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function addTag() {
    const tag = form.tagInput.trim()
    if (!tag) return
    if (form.tags.length >= 20) { setErrors((e) => ({ ...e, tags: 'Maximum 20 tags allowed' })); return }
    if (!form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: '' }))
    } else {
      setField('tagInput', '')
    }
    setErrors((e) => ({ ...e, tags: undefined }))
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!form.name.trim()) e.name = 'Name is required'
    else if (form.name.trim().length > 255) e.name = 'Name must be 255 characters or fewer'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    else if (form.sku.trim().length > 100) e.sku = 'SKU must be 100 characters or fewer'
    if (!form.categoryId) e.categoryId = 'Category is required'
    if (!form.uomCode) e.uomCode = 'Unit of measure is required'
    return e
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setErrors({})
    setSaving(true)

    const body: UpdateProductBody = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      categoryId: form.categoryId,
      uomCode: form.uomCode,
      type: form.type,
      description: form.description.trim() || null,
      tags: form.tags,
      hsnCode: form.hsnCode.trim() || null,
    }

    try {
      await updateProduct(product.id, body, idempotencyKeyRef.current)
      idempotencyKeyRef.current = crypto.randomUUID()
      toast.success('Product details saved.')
    } catch (err) {
      idempotencyKeyRef.current = crypto.randomUUID()
      const apiErr = (err as { body?: ProductApiError }).body
      const code = apiErr?.error?.code
      if (code === 'PRODUCT_SKU_EXISTS') setErrors({ sku: 'This SKU is already in use' })
      else if (code === 'INVALID_CATEGORY') setErrors({ categoryId: 'Category not found or inactive' })
      else if (code === 'INVALID_UOM') setErrors({ uomCode: 'Unit not recognised' })
      else if (code === 'PRODUCT_SLUG_EXISTS') setErrors({ form: 'A product with this name already exists (URL conflict).' })
      else setErrors({ form: apiErr?.error?.message ?? 'Something went wrong. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-6 p-6">
        {/* Product details */}
        <div className="flex flex-col gap-4">
          <SectionHeading>Product details</SectionHeading>
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Name" required error={errors.name}>
                <Input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  disabled={saving}
                />
              </Field>
            </div>

            <Field label="SKU" required error={errors.sku} hint="Unique identifier for this product">
              <Input
                value={form.sku}
                onChange={(e) => setField('sku', e.target.value)}
                disabled={saving}
                className="font-mono"
              />
            </Field>

            <Field label="Category" required error={errors.categoryId}>
              <select
                value={form.categoryId}
                onChange={(e) => setField('categoryId', e.target.value)}
                disabled={saving}
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
                onChange={(e) => setField('uomCode', e.target.value)}
                disabled={saving}
                className={SELECT_CLASS}
              >
                {UOM_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.name} ({opt.code})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <Field label="HSN Code" hint="Optional — Harmonised System nomenclature">
              <Input
                placeholder="e.g. 8471"
                value={form.hsnCode}
                onChange={(e) => setField('hsnCode', e.target.value)}
                disabled={saving}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <div className="flex gap-4 items-center h-9">
                {(['GOODS', 'SERVICE'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={form.type === t}
                      onChange={() => setField('type', t)}
                      disabled={saving}
                      className="accent-primary"
                    />
                    {t === 'GOODS' ? 'Goods' : 'Service'}
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <Field label="Description">
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => setField('description', html)}
                  disabled={saving}
                />
              </Field>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a tag and press Enter"
                  value={form.tagInput}
                  onChange={(e) => setField('tagInput', e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={saving}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={saving}>
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
                        disabled={saving}
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
        </div>

        {/* Pricing — read-only from default variant */}
        {defaultVariant && (
          <div className="flex flex-col gap-4">
            <SectionHeading>Pricing</SectionHeading>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>List price (₹)</Label>
                <Input value={defaultVariant.listPrice} disabled readOnly />
              </div>
              {defaultVariant.compareAtPrice && (
                <div className="flex flex-col gap-1.5">
                  <Label>Compare-at price (₹)</Label>
                  <Input value={defaultVariant.compareAtPrice} disabled readOnly />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Prices are managed on variants.</p>
          </div>
        )}

        {/* Images — inline within this card */}
        <ImagesSection product={product} />

        {errors.form && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-end border-t border-border bg-muted/20 px-6 py-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
