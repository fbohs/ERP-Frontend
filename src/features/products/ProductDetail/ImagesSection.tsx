'use client'

import { useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Star, StarOff, X, ImagePlus, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useProductsStore } from '@/stores/useProductsStore'
import { cn } from '@/lib/utils'
import type { ProductView, MediaView, ConfirmImagesBody } from '@/types'

type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp'
const ALLOWED_MIMES: ReadonlySet<string> = new Set<AllowedMime>(['image/jpeg', 'image/png', 'image/webp'])

interface PendingImage {
  readonly localId: string
  readonly file: File
  readonly previewUrl: string
  isPrimary: boolean
  errorMessage: string | null
}

function SectionHeading({ children }: { readonly children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>
}

export function ImagesSection({ product }: { readonly product: ProductView }) {
  const { setPrimaryImage, deleteProductImage, presignImage, confirmImages } = useProductsStore()

  const [pending, setPending] = useState<PendingImage[]>([])
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [settingPrimaryKey, setSettingPrimaryKey] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedMedia = [...product.media].sort((a, b) => a.sortOrder - b.sortOrder)

  // ── Existing image actions ────────────────────────────────
  async function handleSetPrimary(media: MediaView) {
    if (media.isPrimary || settingPrimaryKey) return
    setSettingPrimaryKey(media.s3Key)
    try {
      await setPrimaryImage(product.id, media.s3Key, crypto.randomUUID())
      toast.success('Primary image updated.')
    } catch {
      toast.error('Failed to update primary image.')
    } finally {
      setSettingPrimaryKey(null)
    }
  }

  async function handleDelete(media: MediaView) {
    if (deletingKey) return
    setDeletingKey(media.s3Key)
    try {
      await deleteProductImage(product.id, media.s3Key)
      toast.success('Image removed.')
    } catch {
      toast.error('Failed to remove image.')
    } finally {
      setDeletingKey(null)
    }
  }

  // ── Pending image helpers ─────────────────────────────────
  function addFiles(files: File[]) {
    const rejected: string[] = []
    const valid: PendingImage[] = []

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
    setPending((prev) => {
      const combined = [...prev, ...valid]
      if (combined.length > 0 && !combined.some((img) => img.isPrimary)) {
        combined[0] = { ...combined[0], isPrimary: true }
      }
      return combined
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function markPendingPrimary(localId: string) {
    setPending((prev) => prev.map((img) => ({ ...img, isPrimary: img.localId === localId })))
  }

  function removePending(localId: string) {
    setPending((prev) => {
      const entry = prev.find((img) => img.localId === localId)
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      const remaining = prev.filter((img) => img.localId !== localId)
      if (entry?.isPrimary && remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true }
      }
      return remaining
    })
  }

  const updatePending = useCallback(
    (localId: string, patch: Partial<Pick<PendingImage, 'errorMessage'>>) => {
      setPending((prev) => prev.map((img) => (img.localId === localId ? { ...img, ...patch } : img)))
    },
    [],
  )

  async function handleUpload() {
    if (pending.length === 0) return
    setUploading(true)

    const results = await Promise.all(
      pending.map(async (img) => {
        try {
          const mimeType = img.file.type as AllowedMime
          const { s3Key, uploadUrl } = await presignImage(product.id, mimeType, crypto.randomUUID())
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': img.file.type },
            body: img.file,
          })
          if (!putRes.ok) throw new Error(`S3 upload failed (${putRes.status})`)
          return { s3Key, isPrimary: img.isPrimary, localId: img.localId, ok: true as const }
        } catch {
          updatePending(img.localId, { errorMessage: 'Upload failed' })
          return { localId: img.localId, ok: false as const }
        }
      }),
    )

    const failed = results.filter((r) => !r.ok)
    if (failed.length > 0) {
      setUploading(false)
      toast.error(`${failed.length} image(s) failed to upload.`)
      return
    }

    const successful = results.filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
    const primaryResult = successful.find((r) => r.isPrimary)
    const otherResults = successful.filter((r) => !r.isPrimary)

    // Only set primary from pending if product has no existing images
    const hasExistingPrimary = sortedMedia.some((m) => m.isPrimary)

    const confirmBody: ConfirmImagesBody = {
      images: {
        primary: !hasExistingPrimary && primaryResult ? { s3Key: primaryResult.s3Key } : undefined,
        others: [
          ...(hasExistingPrimary && primaryResult ? [{ s3Key: primaryResult.s3Key }] : []),
          ...otherResults.map((r) => ({ s3Key: r.s3Key })),
        ].length > 0
          ? [
              ...(hasExistingPrimary && primaryResult ? [{ s3Key: primaryResult.s3Key }] : []),
              ...otherResults.map((r) => ({ s3Key: r.s3Key })),
            ]
          : undefined,
      },
    }

    try {
      await confirmImages(product.id, confirmBody, crypto.randomUUID())
      // Revoke preview URLs
      pending.forEach((img) => URL.revokeObjectURL(img.previewUrl))
      setPending([])
      toast.success('Images uploaded successfully.')
    } catch {
      toast.error('Images uploaded but could not be saved. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const isBusy = uploading || !!deletingKey || !!settingPrimaryKey

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading>Product images</SectionHeading>
      <Separator />
      <p className="text-xs text-muted-foreground -mt-2">
        JPEG, PNG, or WebP · max 5 MB each. The starred image is the primary thumbnail.
      </p>

      {/* Existing images */}
      {sortedMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {sortedMedia.map((media) => (
            <ExistingImageTile
              key={media.s3Key}
              media={media}
              onSetPrimary={() => void handleSetPrimary(media)}
              onDelete={() => void handleDelete(media)}
              isSettingPrimary={settingPrimaryKey === media.s3Key}
              isDeleting={deletingKey === media.s3Key}
              disabled={isBusy}
            />
          ))}
        </div>
      )}

      {sortedMedia.length === 0 && pending.length === 0 && (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      )}

      {/* Pending new images */}
      {pending.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {pending.map((img) => (
            <PendingImageTile
              key={img.localId}
              entry={img}
              onMarkPrimary={() => markPendingPrimary(img.localId)}
              onRemove={() => removePending(img.localId)}
              disabled={uploading}
            />
          ))}
        </div>
      )}

      {rejectedFiles.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          {rejectedFiles.map((msg, i) => (
            <p key={i} className="text-xs text-destructive">{msg}</p>
          ))}
        </div>
      )}

      {/* Drop zone + upload controls */}
      <div
        onDrop={(e) => { e.preventDefault(); if (!isBusy) addFiles(Array.from(e.dataTransfer.files)) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isBusy && fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border',
          'px-6 py-8 text-center transition-colors',
          isBusy
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-primary/50 hover:bg-muted/20',
        )}
      >
        <ImagePlus className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Click to add more images or drag and drop</p>
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

      {pending.length > 0 && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleUpload()} disabled={isBusy}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              `Upload ${pending.length} image${pending.length > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function ExistingImageTile({
  media,
  onSetPrimary,
  onDelete,
  isSettingPrimary,
  isDeleting,
  disabled,
}: {
  readonly media: MediaView
  readonly onSetPrimary: () => void
  readonly onDelete: () => void
  readonly isSettingPrimary: boolean
  readonly isDeleting: boolean
  readonly disabled: boolean
}) {
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-md border border-border bg-muted', isDeleting && 'opacity-50')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt={media.altText ?? 'Product image'} className="h-full w-full object-cover" />

      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}

      {!disabled && !isDeleting && (
        <>
          <button
            type="button"
            onClick={onSetPrimary}
            disabled={media.isPrimary || isSettingPrimary}
            title={media.isPrimary ? 'Primary image' : 'Set as primary'}
            className={cn(
              'absolute left-1 top-1 rounded-full p-1 transition-colors',
              media.isPrimary
                ? 'bg-primary text-primary-foreground'
                : 'bg-black/50 text-white hover:bg-primary hover:text-primary-foreground',
              (media.isPrimary || isSettingPrimary) && 'cursor-default',
            )}
          >
            {isSettingPrimary ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : media.isPrimary ? (
              <Star className="h-3 w-3 fill-current" />
            ) : (
              <StarOff className="h-3 w-3" />
            )}
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Remove image"
            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}

      {media.isPrimary && (
        <span className="absolute bottom-1 left-1 rounded-sm bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-foreground">
          Primary
        </span>
      )}
    </div>
  )
}

function PendingImageTile({
  entry,
  onMarkPrimary,
  onRemove,
  disabled,
}: {
  readonly entry: PendingImage
  readonly onMarkPrimary: () => void
  readonly onRemove: () => void
  readonly disabled: boolean
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md border border-dashed border-primary/40 bg-muted">
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
            title={entry.isPrimary ? 'Primary' : 'Set as primary'}
            className={cn(
              'absolute left-1 top-1 rounded-full p-1 transition-colors',
              entry.isPrimary
                ? 'bg-primary text-primary-foreground'
                : 'bg-black/50 text-white hover:bg-primary hover:text-primary-foreground',
            )}
          >
            {entry.isPrimary ? <Star className="h-3 w-3 fill-current" /> : <StarOff className="h-3 w-3" />}
          </button>

          <button
            type="button"
            onClick={onRemove}
            title="Remove"
            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}

      <span className="absolute bottom-1 right-1 rounded-sm bg-black/60 px-1 py-0.5 text-[10px] text-white">
        Pending
      </span>
    </div>
  )
}
