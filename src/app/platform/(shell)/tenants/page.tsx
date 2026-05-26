import { CreateTenantDialog } from './CreateTenantDialog'
import { TenantsTable } from './TenantsTable'

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
        <CreateTenantDialog />
      </div>

      <TenantsTable />
    </div>
  )
}
