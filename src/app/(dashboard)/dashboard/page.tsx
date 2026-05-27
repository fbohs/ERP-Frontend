import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'

export const metadata = { title: 'Dashboard — ERP' }

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Dashboard"
        description="Overview of your workspace."
      />
      <DashboardOverview />
    </div>
  )
}
