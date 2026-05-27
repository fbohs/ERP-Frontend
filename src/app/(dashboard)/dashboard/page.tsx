import { Package, Tag, Users } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { StatsCard } from '@/components/StatsCard'

export const metadata = { title: 'Dashboard — ERP' }

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Dashboard"
        description="Overview of your organisation."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Subordinates"
          value="—"
          delta="Merchants, managers & more"
          deltaPositive
          icon={Users}
          href="/users"
        />
        <StatsCard
          title="Total Categories"
          value="—"
          icon={Tag}
        />
        <StatsCard
          title="Total Products"
          value="—"
          icon={Package}
        />
      </div>
    </div>
  )
}
