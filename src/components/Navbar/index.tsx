import { Logo } from './Logo'
import { SearchBar } from './SearchBar'
import { UserIconButton } from './UserIconButton'
import { Separator } from '@/components/ui/separator'
import type { User } from '@/types'

interface NavbarProps {
  readonly user: User | null
  readonly onLogout: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-4 px-6">
        <Logo />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1" />
        <SearchBar />
        <UserIconButton user={user} onLogout={onLogout} />
      </div>
      <Separator />
    </header>
  )
}
