import { DashboardHeader } from '@/components/DashboardHeader'
import { ProductsTable } from '@/features/products/ProductsTable'

export const metadata = { title: 'Products — ERP' }

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Products"
        description="Manage your product catalogue."
      />
      <ProductsTable />
    </div>
  )
}
