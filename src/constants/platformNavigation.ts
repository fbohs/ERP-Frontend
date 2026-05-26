import {
  LayoutDashboard,
  Building2,
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

export const PLATFORM_NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Overview',
    links: [
      { label: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Tenants',
    links: [
      { label: 'All Tenants', href: '/platform/tenants', icon: Building2 },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'Settings', href: '/platform/settings', icon: Settings },
    ],
  },
]
