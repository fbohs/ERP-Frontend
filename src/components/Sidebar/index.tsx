'use client'

import { SidebarLink } from './SidebarLink'
import { SidebarHeader } from './SidebarHeader'
import { NAV_GROUPS } from '@/constants/navigation'
import { useAuthStore } from '@/stores/useAuthStore'

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      links: group.links.filter(
        // Before hydration, show all links so the sidebar isn't empty on first paint.
        // Role-gated pages are still protected server-side by the proxy.
        (link) => !hasHydrated || !link.roles || (role !== undefined && link.roles.includes(role)),
      ),
    }))
    .filter((group) => group.links.length > 0)

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r bg-background px-3 py-4">
      {visibleGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <SidebarHeader label={group.label} />
          <nav className="flex flex-col gap-0.5">
            {group.links.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
              />
            ))}
          </nav>
        </div>
      ))}
    </aside>
  )
}
