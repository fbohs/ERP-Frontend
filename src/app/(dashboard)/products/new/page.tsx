import { DashboardHeader } from '@/components/DashboardHeader'
import { AddProductForm } from '@/features/products/AddProductForm'

export const metadata = { title: 'Add Product — ERP' }

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Add Product"
        description="Fill in the details to create a new product in your catalogue."
      />
      <AddProductForm />
    </div>
  )
}
