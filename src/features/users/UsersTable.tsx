'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { useUsersStore } from '@/stores/useUsersStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { UserDetailSheet } from './UserDetailSheet'
import { DeleteUserDialog } from './DeleteUserDialog'
import { SuspendUserDialog } from './SuspendUserDialog'
import { ROLE_LABELS } from '@/types'
import type { TenantUser } from '@/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function UsersTable() {
  const { users, loading, error, fetchUsers } = useUsersStore()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [query, setQuery] = useState('')
  const [viewingUser, setViewingUser] = useState<TenantUser | null>(null)
  const [suspendingUser, setSuspendingUser] = useState<TenantUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<TenantUser | null>(null)

  const load = useCallback((signal?: AbortSignal) => {
    void fetchUsers(signal)
  }, [fetchUsers])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const filtered = users.filter((u) => {
    const q = query.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q)
    )
  })

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

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or role…"
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
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    {query ? 'No users match your search.' : 'No users yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const isSelf = user.id === currentUserId
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-foreground">
                        {user.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="outline" className="border-primary text-primary text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive text-destructive text-xs">
                            Suspended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingUser(user)}
                          >
                            View
                          </Button>
                          {!isSelf && user.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setSuspendingUser(user)}
                            >
                              Suspend
                            </Button>
                          )}
                          {!isSelf && !user.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary"
                              onClick={() => setSuspendingUser(user)}
                            >
                              Reactivate
                            </Button>
                          )}
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingUser(user)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserDetailSheet
        user={viewingUser}
        open={viewingUser !== null}
        onOpenChange={(open) => { if (!open) setViewingUser(null) }}
      />

      {suspendingUser && (
        <SuspendUserDialog
          user={suspendingUser}
          open={suspendingUser !== null}
          onOpenChange={(open) => { if (!open) setSuspendingUser(null) }}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          open={deletingUser !== null}
          onOpenChange={(open) => { if (!open) setDeletingUser(null) }}
        />
      )}
    </>
  )
}
