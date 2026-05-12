import Link from 'next/link'
import { Zap } from 'lucide-react'

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
      <Zap className="h-5 w-5 text-primary" />
      <span className="text-primary">ERP</span>
      <span className="text-muted-foreground text-sm font-normal">Admin</span>
    </Link>
  )
}
