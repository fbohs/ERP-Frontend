import { Plus } from 'lucide-react'
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

export default function TenantsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All tenants onboarded on the platform
          </p>
        </div>
        <Button disabled className="gap-2">
          <Plus className="h-4 w-4" />
          Onboard Tenant
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onboarded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Shell row — illustrates future data shape */}
            <TableRow className="opacity-30 pointer-events-none select-none">
              <TableCell className="font-medium">Acme Corp</TableCell>
              <TableCell className="text-muted-foreground">acme</TableCell>
              <TableCell className="text-muted-foreground">Starter</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-primary text-primary text-xs">
                  Active
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" disabled>View</Button>
                  <Button variant="ghost" size="sm" disabled className="text-destructive">
                    Suspend
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                No tenants onboarded yet — API integration pending.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
