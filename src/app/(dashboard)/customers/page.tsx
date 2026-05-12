import { DashboardHeader } from '@/components/DashboardHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import type { Customer } from '@/types'

export const metadata = { title: 'Customers — ERP' }

const MOCK_CUSTOMERS: readonly Customer[] = [
  {
    id: '1',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '+1 555-0100',
    orderCount: 14,
    totalSpent: 2148.5,
    createdAt: '2024-03-01',
  },
  {
    id: '2',
    name: 'Sam Rivera',
    email: 'sam@example.com',
    orderCount: 7,
    totalSpent: 890.0,
    createdAt: '2024-07-15',
  },
  {
    id: '3',
    name: 'Morgan Chen',
    email: 'morgan@example.com',
    phone: '+1 555-0102',
    orderCount: 3,
    totalSpent: 149.97,
    createdAt: '2025-01-20',
  },
]

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="Customers" description="Manage your customer base." />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CUSTOMERS.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.phone ?? '—'}
                </TableCell>
                <TableCell className="text-right">{formatNumber(customer.orderCount)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
