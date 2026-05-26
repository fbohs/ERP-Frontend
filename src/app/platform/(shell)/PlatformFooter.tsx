import { Separator } from '@/components/ui/separator'

export function PlatformFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ERP Platform Console. Internal use only.
          </p>
          <p className="text-xs text-muted-foreground">Super Admin Surface</p>
        </div>
      </div>
    </footer>
  )
}
