import { DashboardHeader } from '@/components/DashboardHeader'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Order, OrderStatus } from '@/types'

export const metadata = { title: 'Orders — ERP' }

const MOCK_ORDERS: readonly Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-0001',
    customerId: 'c1',
    customerName: 'Jordan Lee',
    status: 'delivered',
    total: 239.98,
    itemCount: 2,
    createdAt: '2025-04-12',
  },
  {
    id: '2',
    orderNumber: 'ORD-0002',
    customerId: 'c2',
    customerName: 'Sam Rivera',
    status: 'processing',
    total: 89.99,
    itemCount: 1,
    createdAt: '2025-05-01',
  },
  {
    id: '3',
    orderNumber: 'ORD-0003',
    customerId: 'c3',
    customerName: 'Morgan Chen',
    status: 'pending',
    total: 49.99,
    itemCount: 1,
    createdAt: '2025-05-10',
  },
]

const STATUS_VARIANT: Record<
  OrderStatus,
  'default' | 'secondary' | 'outline' | 'destructive' | 'accent'
> = {
  pending: 'secondary',
  processing: 'outline',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="Orders" description="Track and manage customer orders." />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_ORDERS.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className="text-right">{order.itemCount}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
