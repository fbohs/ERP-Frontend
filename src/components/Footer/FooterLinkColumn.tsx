import Link from 'next/link'

interface FooterLink {
  readonly label: string
  readonly href: string
}

interface FooterLinkColumnProps {
  readonly heading: string
  readonly links: readonly FooterLink[]
}

export function FooterLinkColumn({ heading, links }: FooterLinkColumnProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </p>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-foreground/70 hover:text-primary transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
