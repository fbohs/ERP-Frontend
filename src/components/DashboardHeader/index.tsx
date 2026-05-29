import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface DashboardHeaderProps {
  readonly title: string
  readonly description?: string
  readonly actions?: React.ReactNode
  readonly backHref?: string
  readonly backLabel?: string
}

export function DashboardHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = 'Back',
}: DashboardHeaderProps) {
  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      )}
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
