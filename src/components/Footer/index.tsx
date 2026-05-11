import { Separator } from '@/components/ui/separator'
import { FooterLinkColumn } from './FooterLinkColumn'
import { QuickLinks } from './QuickLinks'
import { FOOTER_COLUMNS } from '@/constants/navigation'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <FooterLinkColumn key={col.heading} heading={col.heading} links={col.links} />
          ))}
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ERP Admin Panel. All rights reserved.
          </p>
          <QuickLinks />
        </div>
      </div>
    </footer>
  )
}
