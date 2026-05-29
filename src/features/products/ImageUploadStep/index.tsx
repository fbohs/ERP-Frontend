'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ImagePlus, X, Star, StarOff, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useProductsStore } from '@/stores/useProductsStore'
import { cn } from '@/lib/utils'
import type { ConfirmImagesBody } from '@/types'

type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp'
const ALLOWED_MIMES: ReadonlySet<string> = new Set<AllowedMime>(['image/jpeg', 'image/png', 'image/webp'])

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface ImageEntry {
  readonly localId: string
  readonly file: File
  readonly previewUrl: string
  isPrimary: boolean
  uploadState: UploadState
  s3Key: string | null
  errorMessage: string | null
}

interface Props {
  readonly productId: string
  readonly onDone: () => void
  readonly onSkip: () => void
}

export function ImageUploadStep({ productId, onDone, onSkip }: Props) {
  const { presignImage, confirmImages } = useProductsStore()

  const [images, setImages] = useState<ImageEntry[]>([])
  const [phase, setPhase] = useState<'select' | 'uploading' | 'confirming'>('select')
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urls = images.map((img) => img.previewUrl)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])  // only on unmount

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
        uploadState: 'idle',
        s3Key: null,
        errorMessage: null,
      })
    }

    setRejectedFiles(rejected)
    setImages((prev) => {
      const combined = [...prev, ...valid]
      // ensure exactly one primary — auto-select first if none set
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
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) addFiles(files)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function markPrimary(localId: string) {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.localId === localId })),
    )
  }

  function removeImage(localId: string) {
    setImages((prev) => {
      const entry = prev.find((img) => img.localId === localId)
      if (entry) URL.revokeObjectURL(entry.previewUrl)

      const remaining = prev.filter((img) => img.localId !== localId)
      const wasPrimary = entry?.isPrimary ?? false
      if (wasPrimary && remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true }
      }
      return remaining
    })
  }

  const updateEntry = useCallback(
    (localId: string, patch: Partial<Omit<ImageEntry, 'localId' | 'file' | 'previewUrl'>>) => {
      setImages((prev) =>
        prev.map((img) => (img.localId === localId ? { ...img, ...patch } : img)),
      )
    },
    [],
  )

  async function handleUpload() {
    if (images.length === 0) {
      onDone()
      return
    }

    setPhase('uploading')
    setConfirmError(null)

    // Presign + PUT all files in parallel
    const results = await Promise.all(
      images.map(async (img) => {
        try {
          const presignKey = crypto.randomUUID()
          const mimeType = img.file.type as AllowedMime
          const { s3Key, uploadUrl } = await presignImage(productId, mimeType, presignKey)

          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': img.file.type },
            body: img.file,
          })

          if (!putRes.ok) throw new Error(`S3 upload failed (${putRes.status})`)

          updateEntry(img.localId, { uploadState: 'done', s3Key })
          return { localId: img.localId, s3Key, isPrimary: img.isPrimary, ok: true as const }
        } catch {
          updateEntry(img.localId, { uploadState: 'error', errorMessage: 'Upload failed — try again' })
          return { localId: img.localId, ok: false as const }
        }
      }),
    )

    const failed = results.filter((r) => !r.ok)
    if (failed.length > 0) {
      setPhase('select')
      return
    }

    // All uploaded — build confirm body and confirm
    setPhase('confirming')
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
      onDone()
    } catch (err) {
      const body = (err as { body?: { error?: { message?: string } } }).body
      setConfirmError(body?.error?.message ?? 'Failed to save images. Try again.')
      setPhase('select')
    }
  }

  const isBusy = phase === 'uploading' || phase === 'confirming'
  const hasErrors = images.some((img) => img.uploadState === 'error')

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">Add product images</h3>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or WebP · max 5 MB each · up to 10 images.
          The starred image is shown as the primary thumbnail.
        </p>
      </div>
      <Separator />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isBusy && fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border',
          'px-6 py-10 text-center transition-colors',
          isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50 hover:bg-muted/20',
        )}
      >
        <ImagePlus className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Click to select or drag and drop images here
        </p>
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

      {/* Rejected file warnings */}
      {rejectedFiles.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          {rejectedFiles.map((msg, i) => (
            <p key={i} className="text-xs text-destructive">{msg}</p>
          ))}
        </div>
      )}

      {/* Image grid */}
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

      {/* Confirm error */}
      {confirmError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{confirmError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isBusy}
        >
          Skip for now
        </Button>
        <Button
          type="button"
          onClick={() => void handleUpload()}
          disabled={isBusy || (images.length > 0 && hasErrors && phase === 'select')}
        >
          {phase === 'uploading' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {phase === 'confirming' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {phase === 'uploading'
            ? 'Uploading…'
            : phase === 'confirming'
            ? 'Saving…'
            : images.length === 0
            ? 'Done'
            : hasErrors
            ? 'Retry failed'
            : 'Upload images'}
        </Button>
      </div>
    </div>
  )
}

function ImageTile({
  entry,
  onMarkPrimary,
  onRemove,
  disabled,
}: {
  entry: ImageEntry
  onMarkPrimary: () => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.previewUrl}
        alt={entry.file.name}
        className="h-full w-full object-cover"
      />

      {/* Upload state overlay */}
      {entry.uploadState === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}
      {entry.uploadState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/70 px-2 text-center">
          <AlertCircle className="h-4 w-4 text-white" />
          <p className="text-[10px] text-white leading-tight">{entry.errorMessage}</p>
        </div>
      )}

      {/* Controls (hidden when busy) */}
      {!disabled && entry.uploadState !== 'uploading' && (
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

      {/* Primary label */}
      {entry.isPrimary && entry.uploadState !== 'error' && (
        <span className="absolute bottom-1 left-1 rounded-sm bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-foreground">
          Primary
        </span>
      )}
    </div>
  )
}
