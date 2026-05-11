import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { StatsCard } from '@/components/StatsCard'

export const metadata = { title: 'Dashboard — ERP' }

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Dashboard"
        description="Overview of your store performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value="$84,230"
          delta="+12.5% from last month"
          deltaPositive
          icon={DollarSign}
        />
        <StatsCard
          title="Orders"
          value="1,284"
          delta="+8.2% from last month"
          deltaPositive
          icon={ShoppingCart}
        />
        <StatsCard
          title="Products"
          value="392"
          delta="+3 new this week"
          deltaPositive
          icon={Package}
        />
        <StatsCard
          title="Customers"
          value="5,610"
          delta="+2.1% from last month"
          deltaPositive
          icon={Users}
        />
      </div>
    </div>
  )
}
