'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePlatformTenantsStore } from '@/stores/usePlatformTenantsStore'
import { SuspendTenantDialog } from './SuspendTenantDialog'
import type { Tenant } from '@/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TenantsTable() {
  const router = useRouter()
  const { tenants, loading, error } = usePlatformTenantsStore()

  const [query, setQuery] = useState('')
  const [pendingTenant, setPendingTenant] = useState<Tenant | null>(null)

  const handleUnauthorized = useCallback(() => {
    router.replace('/platform/login')
  }, [router])

  useEffect(() => {
    usePlatformTenantsStore.setState({ onUnauthorized: handleUnauthorized })
  }, [handleUnauthorized])

  useEffect(() => {
    const controller = new AbortController()
    void usePlatformTenantsStore.getState().fetchTenants(controller.signal)
    return () => controller.abort()
  }, [])

  const filtered = tenants.filter((t) => {
    const q = query.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q)
    )
  })

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {error}
        <Button variant="ghost" size="sm" className="ml-3" onClick={() => void usePlatformTenantsStore.getState().fetchTenants()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tenants…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onboarded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {query ? 'No tenants match your search.' : 'No tenants onboarded yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium text-foreground">{tenant.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {tenant.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tenant.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-primary text-primary text-xs"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-destructive text-destructive text-xs"
                      >
                        Suspended
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tenant.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingTenant(tenant)}
                        className={
                          tenant.isActive
                            ? 'text-destructive hover:text-destructive'
                            : 'text-primary hover:text-primary'
                        }
                      >
                        {tenant.isActive ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pendingTenant && (
        <SuspendTenantDialog
          tenant={pendingTenant}
          open={pendingTenant !== null}
          onOpenChange={(v) => {
            if (!v) setPendingTenant(null)
          }}
        />
      )}
    </div>
  )
}
