'use client'

import { LogOut, Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User as UserType } from '@/types'

interface UserIconButtonProps {
  readonly user: UserType | null
  readonly onLogout: () => void
}

export function UserIconButton({ user, onLogout }: UserIconButtonProps) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user?.avatarUrl} alt={user?.name ?? 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user ? (
          <DropdownMenuLabel>
            <p className="font-medium">{user.name}</p>
            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </DropdownMenuLabel>
        ) : (
          <DropdownMenuLabel>
            <p className="text-xs text-muted-foreground">Loading…</p>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
