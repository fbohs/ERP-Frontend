import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  readonly title: string
  readonly value: string
  readonly delta?: string
  readonly deltaPositive?: boolean
  readonly icon: LucideIcon
  readonly href?: string
}

export function StatsCard({ title, value, delta, deltaPositive, icon: Icon, href }: StatsCardProps) {
  const card = (
    <Card className={cn(href && 'cursor-pointer transition-colors hover:border-primary/50 hover:bg-card/80')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {delta && (
          <p
            className={cn(
              'mt-1 text-xs',
              deltaPositive ? 'text-primary' : 'text-destructive',
            )}
          >
            {delta}
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href} className="block">{card}</Link>
  }

  return card
}
