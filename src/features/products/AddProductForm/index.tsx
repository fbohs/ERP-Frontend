'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Plus, ImagePlus, Star, StarOff, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useProductsStore } from '@/stores/useProductsStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { UOM_GROUPS } from '@/constants/uom'
import { cn } from '@/lib/utils'
import type { CreateProductBody, ProductApiError, ConfirmImagesBody } from '@/types'

const LIST_PRICE_REGEX = /^\d+(\.\d{1,4})?$/

const SELECT_CLASS = cn(
  'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1',
  'text-sm text-foreground shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp'
const ALLOWED_MIMES: ReadonlySet<string> = new Set<AllowedMime>([
  'image/jpeg',
  'image/png',
  'image/webp',
])

interface ImageEntry {
  readonly localId: string
  readonly file: File
  readonly previewUrl: string
  isPrimary: boolean
  errorMessage: string | null
}

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

type SubmitPhase = 'creating' | 'uploading' | 'confirming'

const PHASE_LABEL: Record<SubmitPhase, string> = {
  creating: 'Creating product…',
  uploading: 'Uploading images…',
  confirming: 'Saving images…',
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

export function AddProductForm() {
  const router = useRouter()
  const { createProduct, presignImage, confirmImages } = useProductsStore()
  const { categories, fetchCategories } = useCategoriesStore()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase | null>(null)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  // Image state
  const [images, setImages] = useState<ImageEntry[]>([])
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  // Revoke object URLs on unmount
  useEffect(() => {
    const urls = images.map((img) => img.previewUrl)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // ── Tag helpers ───────────────────────────────────────────
  function addTag() {
    const tag = form.tagInput.trim()
    if (!tag) return
    if (form.tags.length >= 20) {
      setErrors((e) => ({ ...e, tags: 'Maximum 20 tags allowed' }))
      return
    }
    if (form.tags.includes(tag)) {
      setField('tagInput', '')
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

  // ── Image helpers ─────────────────────────────────────────
  function addFiles(files: File[]) {
    const rejected: string[] = []
    const valid: ImageEntry[] = []

    for (const file of files) {
      if (!ALLOWED_MIMES.has(file.type)) {
        rejected.push(`${file.name} — only JPEG, PNG, and WebP are supported`)
        continue
      }
      valid.push({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: false,
        errorMessage: null,
      })
    }

    setRejectedFiles(rejected)
    setImages((prev) => {
      const combined = [...prev, ...valid]
      const hasPrimary = combined.some((img) => img.isPrimary)
      if (!hasPrimary && combined.length > 0) {
        combined[0] = { ...combined[0], isPrimary: true }
      }
      return combined
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) addFiles(files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    addFiles(Array.from(e.dataTransfer.files))
  }

  function markPrimary(localId: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.localId === localId })))
  }

  function removeImage(localId: string) {
    setImages((prev) => {
      const entry = prev.find((img) => img.localId === localId)
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      const remaining = prev.filter((img) => img.localId !== localId)
      if (entry?.isPrimary && remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true }
      }
      return remaining
    })
  }

  // ── Validation ────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setErrors({})

    // Step 1 — create product
    setSubmitPhase('creating')
    let productId: string

    try {
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
      const created = await createProduct(body, idempotencyKeyRef.current)
      productId = created.id
      toast.success(`Product "${created.name}" created.`)
    } catch (err) {
      idempotencyKeyRef.current = crypto.randomUUID()
      setSubmitPhase(null)
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
      return
    }

    // Step 2 — upload images (if any selected)
    if (images.length > 0) {
      setSubmitPhase('uploading')

      const results = await Promise.all(
        images.map(async (img) => {
          try {
            const mimeType = img.file.type as AllowedMime
            const { s3Key, uploadUrl } = await presignImage(productId, mimeType, crypto.randomUUID())
            const putRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': img.file.type },
              body: img.file,
            })
            if (!putRes.ok) throw new Error(`S3 upload failed (${putRes.status})`)
            return { s3Key, isPrimary: img.isPrimary, ok: true as const }
          } catch {
            return { ok: false as const }
          }
        }),
      )

      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) {
        setSubmitPhase(null)
        toast.error('Product created, but some images failed to upload. You can add them later from the product page.')
        router.push('/products')
        return
      }

      // Step 3 — confirm images
      setSubmitPhase('confirming')
      const successful = results.filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
      const primaryResult = successful.find((r) => r.isPrimary)
      const otherResults = successful.filter((r) => !r.isPrimary)

      const confirmBody: ConfirmImagesBody = {
        images: {
          primary: primaryResult ? { s3Key: primaryResult.s3Key } : undefined,
          others: otherResults.length > 0
            ? otherResults.map((r) => ({ s3Key: r.s3Key }))
            : undefined,
        },
      }

      try {
        await confirmImages(productId, confirmBody, crypto.randomUUID())
      } catch {
        setSubmitPhase(null)
        toast.error('Product created, but images could not be saved. You can add them later from the product page.')
        router.push('/products')
        return
      }
    }

    setSubmitPhase(null)
    router.push('/products')
  }

  const isBusy = submitPhase !== null

  return (
    <>
      {/* Translucent overlay during submission */}
      {isBusy && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">{PHASE_LABEL[submitPhase]}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-8 max-w-2xl">
        {/* ── Product details ────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Product details</SectionHeading>
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Name" required error={errors.name}>
                <Input
                  placeholder="e.g. Blue Widget"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  disabled={isBusy}
                />
              </Field>
            </div>

            <Field label="SKU" required error={errors.sku} hint="Must be unique within your catalogue">
              <Input
                placeholder="e.g. BW-001"
                value={form.sku}
                onChange={(e) => setField('sku', e.target.value)}
                disabled={isBusy}
              />
            </Field>

            <Field label="Category" required error={errors.categoryId}>
              <select
                value={form.categoryId}
                onChange={(e) => setField('categoryId', e.target.value)}
                disabled={isBusy}
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
                disabled={isBusy}
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
                    onChange={() => setField('type', 'GOODS')}
                    disabled={isBusy}
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
                    onChange={() => setField('type', 'SERVICE')}
                    disabled={isBusy}
                    className="accent-primary"
                  />
                  Service
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <Field label="Description">
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => setField('description', html)}
                  disabled={isBusy}
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
                  disabled={isBusy}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={isBusy}>
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
                        disabled={isBusy}
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

        {/* ── Pricing ───────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Pricing</SectionHeading>
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <Field label="List price (₹)" required error={errors.listPrice} hint="e.g. 49.99 — no currency symbol">
              <Input
                placeholder="0.00"
                value={form.listPrice}
                onChange={(e) => setField('listPrice', e.target.value)}
                disabled={isBusy}
              />
            </Field>

            <Field label="Compare-at price (₹)" error={errors.compareAtPrice} hint="Strike-through 'was' price (optional)">
              <Input
                placeholder="0.00"
                value={form.compareAtPrice}
                onChange={(e) => setField('compareAtPrice', e.target.value)}
                disabled={isBusy}
              />
            </Field>
          </div>
        </section>

        {/* ── Images ────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Product images</SectionHeading>
          <Separator />
          <p className="text-xs text-muted-foreground -mt-2">
            JPEG, PNG, or WebP · max 5 MB each · up to 10 images. The starred image is the primary thumbnail.
          </p>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !isBusy && fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border',
              'px-6 py-10 text-center transition-colors',
              isBusy
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:border-primary/50 hover:bg-muted/20',
            )}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to select or drag and drop images here</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileInput}
              disabled={isBusy}
            />
          </div>

          {rejectedFiles.length > 0 && (
            <div className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
              {rejectedFiles.map((msg, i) => (
                <p key={i} className="text-xs text-destructive">{msg}</p>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <ImageTile
                  key={img.localId}
                  entry={img}
                  onMarkPrimary={() => markPrimary(img.localId)}
                  onRemove={() => removeImage(img.localId)}
                  disabled={isBusy}
                />
              ))}
            </div>
          )}
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
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            Create product
          </Button>
        </div>
      </form>
    </>
  )
}

function ImageTile({
  entry,
  onMarkPrimary,
  onRemove,
  disabled,
}: {
  readonly entry: ImageEntry
  readonly onMarkPrimary: () => void
  readonly onRemove: () => void
  readonly disabled: boolean
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={entry.previewUrl} alt={entry.file.name} className="h-full w-full object-cover" />

      {entry.errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/70 px-2 text-center">
          <AlertCircle className="h-4 w-4 text-white" />
          <p className="text-[10px] text-white leading-tight">{entry.errorMessage}</p>
        </div>
      )}

      {!disabled && (
        <>
          <button
            type="button"
            onClick={onMarkPrimary}
            title={entry.isPrimary ? 'Primary image' : 'Set as primary'}
            className={cn(
              'absolute left-1 top-1 rounded-full p-1 transition-colors',
              entry.isPrimary
                ? 'bg-primary text-primary-foreground'
                : 'bg-black/50 text-white hover:bg-primary hover:text-primary-foreground',
            )}
          >
            {entry.isPrimary ? (
              <Star className="h-3 w-3 fill-current" />
            ) : (
              <StarOff className="h-3 w-3" />
            )}
          </button>

          <button
            type="button"
            onClick={onRemove}
            title="Remove image"
            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}

      {entry.isPrimary && (
        <span className="absolute bottom-1 left-1 rounded-sm bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-foreground">
          Primary
        </span>
      )}
    </div>
  )
}
