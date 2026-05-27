import { DashboardHeader } from '@/components/DashboardHeader'
import { CategoriesTable } from '@/features/categories/CategoriesTable'

export const metadata = { title: 'Categories — ERP' }

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Categories"
        description="Browse product categories in your catalogue."
      />
      <CategoriesTable />
    </div>
  )
}
