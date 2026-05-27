'use client'

import { SidebarLink } from '@/components/Sidebar/SidebarLink'
import { SidebarHeader } from '@/components/Sidebar/SidebarHeader'
import { PLATFORM_NAV_GROUPS } from '@/constants/platformNavigation'

export function PlatformSidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-background px-3 py-4">
      {PLATFORM_NAV_GROUPS.map((group) => (
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
