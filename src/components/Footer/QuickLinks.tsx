import Link from 'next/link'
import { QUICK_LINKS } from '@/constants/navigation'

export function QuickLinks() {
  return (
    <nav aria-label="Quick links" className="flex flex-wrap gap-x-6 gap-y-1">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
