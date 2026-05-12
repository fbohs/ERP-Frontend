import { Separator } from '@/components/ui/separator'

interface SidebarHeaderProps {
  readonly label: string
}

export function SidebarHeader({ label }: SidebarHeaderProps) {
  return (
    <div>
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <Separator className="mt-1 mb-2" />
    </div>
  )
}
