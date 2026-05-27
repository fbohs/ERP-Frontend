import { CreateUserDialog } from '@/features/users/CreateUserDialog'
import { UsersTable } from '@/features/users/UsersTable'

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users in your organisation
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <UsersTable />
    </div>
  )
}
