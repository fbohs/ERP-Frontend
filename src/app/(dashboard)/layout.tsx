import { Sidebar } from '@/components/Sidebar'
import { DashboardNav } from './DashboardNav'

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
