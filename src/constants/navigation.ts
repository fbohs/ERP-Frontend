import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface NavLink {
  readonly label: string
  readonly href: string
  readonly icon: LucideIcon
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
    label: 'Store',
    links: [
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Orders', href: '/orders', icon: ShoppingCart },
      { label: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    label: 'Insights',
    links: [{ label: 'Reports', href: '/reports', icon: BarChart3 }],
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
