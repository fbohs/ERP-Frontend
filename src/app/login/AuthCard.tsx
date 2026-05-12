'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

type Tab = 'login' | 'register'

const TABS: { id: Tab; label: string }[] = [
  { id: 'login', label: 'Sign in' },
  { id: 'register', label: 'Register' },
]

const SUBTITLE: Record<Tab, string> = {
  login: 'Sign in to your merchant account',
  register: 'Create a new merchant account',
}

export function AuthCard() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg">
      <div className="flex border-b border-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === id
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ERP Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">{SUBTITLE[tab]}</p>
        </div>

        {tab === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  )
}
