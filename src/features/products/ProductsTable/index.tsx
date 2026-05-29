'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProductsStore } from '@/stores/useProductsStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import type { ProductListView } from '@/types'

const PRODUCT_WRITE_ROLES = ['ADMIN'] as const

type ProductStatus = ProductListView['status']
type VerificationStatus = ProductListView['verificationStatus']

const STATUS_STYLES: Record<ProductStatus, string> = {
  DRAFT:    'border-muted-foreground text-muted-foreground',
  ACTIVE:   'border-blue-500 text-blue-500',
  INACTIVE: 'border-amber-500 text-amber-500',
  ARCHIVED: 'border-destructive text-destructive',
}

const VERIFICATION_STYLES: Record<VerificationStatus, string> = {
  PENDING:  'border-amber-500 text-amber-500',
  VERIFIED: 'border-primary text-primary',
  REJECTED: 'border-destructive text-destructive',
}

const ALL_STATUSES: readonly ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[status])}>
      {status}
    </Badge>
  )
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge variant="outline" className={cn('text-xs', VERIFICATION_STYLES[status])}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function ProductsTable() {
  const { products, loading, error, fetchProducts } = useProductsStore()
  const { categories, fetchCategories } = useCategoriesStore()
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'ADMIN'
  const canWrite = role !== undefined && (PRODUCT_WRITE_ROLES as readonly string[]).includes(role)

  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const load = useCallback((signal?: AbortSignal) => {
    void fetchProducts(signal)
  }, [fetchProducts])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    void fetchCategories(controller.signal)
    return () => controller.abort()
  }, [load, fetchCategories])

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      if (categoryFilter && p.categoryId !== categoryFilter) return false
      return true
    })
  }, [products, statusFilter, categoryFilter])

  const SELECT_CLASS = cn(
    'h-9 rounded-md border border-input bg-card px-3 py-1',
    'text-sm text-foreground shadow-sm',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  )

  if (error === 'FORBIDDEN') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 px-6 py-12 text-center">
        <ShieldOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view products.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {error}
        <Button variant="ghost" size="sm" className="ml-3" onClick={() => load()}>
          Retry
        </Button>
      </div>
    )
  }

  const colSpan = 5 + (isAdmin ? 1 : 0)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
            className={SELECT_CLASS}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {canWrite && (
          <Button asChild size="sm">
            <Link href="/products/new">
              <Plus className="mr-1 h-4 w-4" />
              Add product
            </Link>
          </Button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              {isAdmin && <TableHead>Suspended</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colSpan }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">
                  {products.length === 0 ? 'No products yet.' : 'No products match the current filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categoryName={categoryMap.get(product.categoryId) ?? '—'}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ProductRow({
  product,
  categoryName,
  isAdmin,
}: {
  product: ProductListView
  categoryName: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const isSuspended = isAdmin && product.isSuspendedByOperator === true

  return (
    <TableRow
      className={cn('cursor-pointer hover:bg-muted/30', isSuspended && 'opacity-60')}
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{categoryName}</TableCell>
      <TableCell>
        <StatusBadge status={product.status} />
      </TableCell>
      <TableCell>
        <VerificationBadge status={product.verificationStatus} />
      </TableCell>
      {isAdmin && (
        <TableCell>
          {isSuspended ? (
            <Badge variant="outline" className="border-destructive text-destructive text-xs">
              Suspended
            </Badge>
          ) : (
            <span className="text-muted-foreground/50 text-xs">—</span>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}
