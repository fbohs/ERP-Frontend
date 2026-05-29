import { DashboardHeader } from '@/components/DashboardHeader'
import { CategoriesTable } from '@/features/categories/CategoriesTable'
import { CreateCategoryDialog } from '@/features/categories/CreateCategoryDialog'

export const metadata = { title: 'Categories — ERP' }

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Categories"
        description="Browse product categories in your catalogue."
        actions={<CreateCategoryDialog />}
      />
      <CategoriesTable />
    </div>
  )
}
