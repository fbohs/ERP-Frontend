import { DashboardHeader } from '@/components/DashboardHeader'
import { ProductDetail } from '@/features/products/ProductDetail'

export const metadata = { title: 'Product — ERP' }

type Props = { params: Promise<{ id: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Product details"
        description="Edit product information, manage images and status."
        backHref="/products"
        backLabel="Back to products"
      />
      <ProductDetail id={id} />
    </div>
  )
}
