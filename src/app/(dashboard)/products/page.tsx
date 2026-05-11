import { Plus } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/utils/format'
import type { Product } from '@/types'

export const metadata = { title: 'Products — ERP' }

const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones Pro',
    sku: 'WHP-001',
    price: 149.99,
    stock: 84,
    category: 'Electronics',
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    name: 'Mechanical Keyboard TKL',
    sku: 'MKB-002',
    price: 89.99,
    stock: 0,
    category: 'Electronics',
    status: 'active',
    createdAt: '2025-02-14',
  },
  {
    id: '3',
    name: 'USB-C Hub 7-in-1',
    sku: 'UCH-003',
    price: 49.99,
    stock: 210,
    category: 'Accessories',
    status: 'draft',
    createdAt: '2025-03-01',
  },
]

const STATUS_VARIANT: Record<Product['status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  draft: 'secondary',
  archived: 'outline',
}

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Products"
        description="Manage your product catalogue."
        actions={
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add product
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PRODUCTS.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {product.sku}
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">
                  <span className={product.stock === 0 ? 'text-destructive' : undefined}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[product.status]}>{product.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
