import { Separator } from '@/components/ui/separator'

interface DashboardHeaderProps {
  readonly title: string
  readonly description?: string
  readonly actions?: React.ReactNode
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Separator className="mt-4" />
    </div>
  )
}
