'use client'

import { useEffect, useCallback } from 'react'
import { ShieldOff } from 'lucide-react'
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
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function parentName(category: Category, index: Map<string, Category>): string {
  if (!category.parentId) return '—'
  return index.get(category.parentId)?.name ?? '—'
}

export function CategoriesTable() {
  const { categories, loading, error, fetchCategories } = useCategoriesStore()
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'ADMIN'

  const load = useCallback((signal?: AbortSignal) => {
    void fetchCategories(signal)
  }, [fetchCategories])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  // Build an id→category index once for O(1) parent name lookups.
  const index = new Map(categories.map((c) => [c.id, c]))

  if (error === 'FORBIDDEN') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 px-6 py-12 text-center">
        <ShieldOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view categories.
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

  const colSpan = isAdmin ? 6 : 5

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Parent</TableHead>
            {isAdmin && <TableHead>Status</TableHead>}
            <TableHead>Created</TableHead>
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
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow
                key={cat.id}
                className={cn(isAdmin && cat.isActive === false && 'opacity-50')}
              >
                <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cat.description ? truncate(cat.description) : <span className="text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {parentName(cat, index)}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    {cat.isActive ? (
                      <Badge variant="outline" className="border-primary text-primary text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground text-muted-foreground text-xs">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(cat.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
