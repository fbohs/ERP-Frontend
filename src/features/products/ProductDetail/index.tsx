'use client'

import { useEffect } from 'react'
import { ShieldOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductsStore } from '@/stores/useProductsStore'
import { StatusSection } from './StatusSection'
import { DetailsSection } from './DetailsSection'

interface Props {
  readonly id: string
}

export function ProductDetail({ id }: Props) {
  const { currentProduct, currentProductLoading, currentProductError, fetchProduct } =
    useProductsStore()

  useEffect(() => {
    const controller = new AbortController()
    void fetchProduct(id, controller.signal)
    return () => controller.abort()
  }, [id, fetchProduct])

  if (currentProductLoading) return <ProductDetailSkeleton />

  if (currentProductError === 'FORBIDDEN') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 px-6 py-12 text-center">
        <ShieldOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this product.
        </p>
      </div>
    )
  }

  if (currentProductError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {currentProductError}
      </div>
    )
  }

  if (!currentProduct) return null

  return (
    <div className="flex flex-col gap-6">
      <StatusSection product={currentProduct} />
      <DetailsSection product={currentProduct} />
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((j) => <Skeleton key={j} className="h-9 w-full" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square w-full rounded-md" />)}
        </div>
      </div>
    </div>
  )
}
