'use client'

import {
  Package,
  Layers,
  ShoppingCart,
  Users,
  BarChart3,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/StatsCard'
import { useAuthStore } from '@/stores/useAuthStore'
import type { UserRole } from '@/types'

interface StatConfig {
  readonly title: string
  readonly icon: LucideIcon
  readonly href?: string
  readonly delta?: string
  readonly deltaPositive?: boolean
}

const ROLE_STATS: Record<UserRole, readonly StatConfig[]> = {
  ADMIN: [
    { title: 'Subordinates', icon: UserCog, href: '/users', delta: 'Merchants, managers & more', deltaPositive: true },
    { title: 'Categories', icon: Layers, href: '/categories' },
    { title: 'Products', icon: Package, href: '/products' },
  ],
  MERCHANT: [
    { title: 'Products', icon: Package, href: '/products', delta: 'Your catalogue', deltaPositive: true },
    { title: 'Categories', icon: Layers, href: '/categories' },
  ],
  SALES_MANAGER: [
    { title: 'Orders', icon: ShoppingCart, href: '/orders' },
    { title: 'Customers', icon: Users, href: '/customers' },
    { title: 'Reports', icon: BarChart3, href: '/reports' },
  ],
  INVENTORY_MANAGER: [
    { title: 'Products', icon: Package, href: '/products' },
    { title: 'Categories', icon: Layers, href: '/categories' },
    { title: 'Reports', icon: BarChart3, href: '/reports' },
  ],
  PURCHASING_MANAGER: [
    { title: 'Orders', icon: ShoppingCart, href: '/orders' },
    { title: 'Products', icon: Package, href: '/products' },
    { title: 'Reports', icon: BarChart3, href: '/reports' },
  ],
  WAREHOUSE_OPERATOR: [
    { title: 'Orders', icon: ShoppingCart, href: '/orders' },
    { title: 'Products', icon: Package, href: '/products' },
  ],
  CONTENT_MANAGER: [
    { title: 'Products', icon: Package, href: '/products' },
    { title: 'Categories', icon: Layers, href: '/categories' },
    { title: 'Reports', icon: BarChart3, href: '/reports' },
  ],
  PRODUCT_VERIFIER: [
    { title: 'Products', icon: Package, href: '/products' },
    { title: 'Reports', icon: BarChart3, href: '/reports' },
  ],
  REPORT_VIEWER: [
    { title: 'Reports', icon: BarChart3, href: '/reports' },
    { title: 'Products', icon: Package, href: '/products' },
    { title: 'Categories', icon: Layers, href: '/categories' },
  ],
}


const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

export function DashboardOverview() {
  const role = useAuthStore((s) => s.user?.role)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  if (!hasHydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-5 flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>
    )
  }

  if (!role) return null

  const stats = ROLE_STATS[role]
  const colKey = (stats.length <= 4 ? stats.length : 4) as 2 | 3 | 4
  const lgCols = GRID_COLS[colKey] ?? GRID_COLS[3]

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${lgCols}`}>
      {stats.map((s) => (
        <StatsCard
          key={s.title}
          title={s.title}
          value="—"
          icon={s.icon}
          href={s.href}
          delta={s.delta}
          deltaPositive={s.deltaPositive}
        />
      ))}
    </div>
  )
}

