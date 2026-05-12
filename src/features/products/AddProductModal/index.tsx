'use client'

import { useState } from 'react'
import { Plus, X, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ProductFormState {
  name: string
  sku: string
  description: string
  category: string
  status: 'active' | 'draft' | 'archived'
  price: string
  compareAtPrice: string
  costPerItem: string
  stock: string
  lowStockThreshold: string
  featuredImageUrl: string
  carouselImages: string[]
  tags: string
}

const INITIAL_STATE: ProductFormState = {
  name: '',
  sku: '',
  description: '',
  category: '',
  status: 'draft',
  price: '',
  compareAtPrice: '',
  costPerItem: '',
  stock: '',
  lowStockThreshold: '',
  featuredImageUrl: '',
  carouselImages: [''],
  tags: '',
}

const CATEGORIES = [
  'Electronics',
  'Accessories',
  'Clothing',
  'Footwear',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Beauty & Health',
  'Automotive',
]

const SELECT_CLASS = cn(
  'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1',
  'text-sm text-foreground shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

function SectionHeading({ children }: { readonly children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>
}

function FieldGroup({ children }: { readonly children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

export function AddProductModal() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProductFormState>(INITIAL_STATE)

  const set = (field: keyof Omit<ProductFormState, 'carouselImages'>, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setCarouselImage = (index: number, value: string) =>
    setForm((prev) => {
      const next = [...prev.carouselImages]
      next[index] = value
      return { ...prev, carouselImages: next }
    })

  const addCarouselImage = () =>
    setForm((prev) => ({ ...prev, carouselImages: [...prev.carouselImages, ''] }))

  const removeCarouselImage = (index: number) =>
    setForm((prev) => ({
      ...prev,
      carouselImages: prev.carouselImages.filter((_, i) => i !== index),
    }))

  const handleClose = () => {
    setOpen(false)
    setForm(INITIAL_STATE)
  }

  const handleSubmit = (publishStatus: 'draft' | 'active') => {
    // TODO: wire to products API
    console.log({ ...form, status: publishStatus })
    handleClose()
  }

  const isValid = form.name.trim().length > 0 && form.price.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add product
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new product listing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-2">
          {/* ── Basic Info ─────────────────────────────────────────── */}
          <FieldGroup>
            <SectionHeading>Basic info</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ap-name">
                  Product name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ap-name"
                  placeholder="e.g. Wireless Headphones Pro"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-sku">SKU</Label>
                <Input
                  id="ap-sku"
                  placeholder="e.g. WHP-001"
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-category">Category</Label>
                <select
                  id="ap-category"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ap-description">Description</Label>
                <Textarea
                  id="ap-description"
                  placeholder="Describe the product — materials, dimensions, key features…"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-status">Status</Label>
                <select
                  id="ap-status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as ProductFormState['status'])}
                  className={SELECT_CLASS}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-tags">Tags</Label>
                <Input
                  id="ap-tags"
                  placeholder="e.g. wireless, audio, premium (comma-separated)"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                />
              </div>
            </div>
          </FieldGroup>

          <Separator />

          {/* ── Media ──────────────────────────────────────────────── */}
          <FieldGroup>
            <SectionHeading>Media</SectionHeading>

            <div className="space-y-1.5">
              <Label htmlFor="ap-featured">Featured image URL</Label>
              <Input
                id="ap-featured"
                placeholder="https://cdn.example.com/image.jpg"
                value={form.featuredImageUrl}
                onChange={(e) => set('featuredImageUrl', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Carousel images</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addCarouselImage}>
                  <ImagePlus className="mr-1 h-4 w-4" />
                  Add image
                </Button>
              </div>

              <div className="space-y-2">
                {form.carouselImages.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Image ${i + 1} URL`}
                      value={url}
                      onChange={(e) => setCarouselImage(i, e.target.value)}
                    />
                    {form.carouselImages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCarouselImage(i)}
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FieldGroup>

          <Separator />

          {/* ── Pricing ────────────────────────────────────────────── */}
          <FieldGroup>
            <SectionHeading>Pricing</SectionHeading>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ap-price">
                  Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ap-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-compare">Compare-at price ($)</Label>
                <Input
                  id="ap-compare"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.compareAtPrice}
                  onChange={(e) => set('compareAtPrice', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-cost">Cost per item ($)</Label>
                <Input
                  id="ap-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.costPerItem}
                  onChange={(e) => set('costPerItem', e.target.value)}
                />
              </div>
            </div>
          </FieldGroup>

          <Separator />

          {/* ── Inventory ──────────────────────────────────────────── */}
          <FieldGroup>
            <SectionHeading>Inventory</SectionHeading>

            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="space-y-1.5">
                <Label htmlFor="ap-stock">Stock quantity</Label>
                <Input
                  id="ap-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-threshold">Low stock threshold</Label>
                <Input
                  id="ap-threshold"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={form.lowStockThreshold}
                  onChange={(e) => set('lowStockThreshold', e.target.value)}
                />
              </div>
            </div>
          </FieldGroup>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={!isValid}
            onClick={() => handleSubmit('draft')}
          >
            Save as draft
          </Button>
          <Button disabled={!isValid} onClick={() => handleSubmit('active')}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
