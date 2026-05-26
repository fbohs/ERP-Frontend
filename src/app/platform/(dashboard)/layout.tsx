import { PlatformNav } from './PlatformNav'
import { PlatformSidebar } from './PlatformSidebar'
import { PlatformFooter } from './PlatformFooter'

export default function PlatformDashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformNav />
      <div className="flex flex-1">
        <PlatformSidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <PlatformFooter />
    </div>
  )
}
