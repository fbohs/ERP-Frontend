import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavLink {
  readonly label: string
  readonly href: string
  readonly icon: LucideIcon
  // Roles that can see this link. Undefined means visible to all authenticated users.
  readonly roles?: readonly UserRole[]
}

interface NavGroup {
  readonly label: string
  readonly links: readonly NavLink[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Overview',
    links: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Team',
    links: [
      {
        label: 'Users',
        href: '/users',
        icon: UserCog,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    label: 'Store',
    links: [
      { label: 'Products', href: '/products', icon: Package },
      {
        label: 'Orders',
        href: '/orders',
        icon: ShoppingCart,
        roles: ['ADMIN', 'SALES_MANAGER', 'WAREHOUSE_OPERATOR', 'PURCHASING_MANAGER'],
      },
      {
        label: 'Customers',
        href: '/customers',
        icon: Users,
        roles: ['ADMIN', 'SALES_MANAGER'],
      },
    ],
  },
  {
    label: 'Insights',
    links: [
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASING_MANAGER', 'PRODUCT_VERIFIER', 'CONTENT_MANAGER', 'REPORT_VIEWER'],
      },
    ],
  },
  {
    label: 'System',
    links: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
]

interface FooterLink {
  readonly label: string
  readonly href: string
}

interface FooterColumn {
  readonly heading: string
  readonly links: readonly FooterLink[]
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'Store',
    links: [
      { label: 'Products', href: '/products' },
      { label: 'Orders', href: '/orders' },
      { label: 'Customers', href: '/customers' },
    ],
  },
  {
    heading: 'Insights',
    links: [{ label: 'Reports', href: '/reports' }],
  },
  {
    heading: 'System',
    links: [{ label: 'Settings', href: '/settings' }],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
]

export const QUICK_LINKS: readonly FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]
