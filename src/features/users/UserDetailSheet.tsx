'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ROLE_LABELS } from '@/types'
import type { TenantUser, MerchantSpecs, VerifierSpecs } from '@/types'

interface Props {
  user: TenantUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function MerchantDetails({ specs }: { specs: MerchantSpecs }) {
  const m = specs.merchant
  return (
    <>
      <Separator />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Business details</p>
      <Detail label="Business name" value={m.businessName} />
      <Detail label="Registration number" value={m.registrationNumber} />
      <Detail label="Address" value={m.address} />
      <Detail label="Phone" value={m.phoneNumber} />
      {m.website && (
        <Detail
          label="Website"
          value={
            <a href={m.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {m.website}
            </a>
          }
        />
      )}
    </>
  )
}

function VerifierDetails({ specs }: { specs: VerifierSpecs }) {
  const v = specs.verifier
  return (
    <>
      <Separator />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verifier credentials</p>
      <Detail label="Badge / Employee ID" value={v.badgeId} />
      <Detail label="Certification level" value={v.certificationLevel.charAt(0) + v.certificationLevel.slice(1).toLowerCase()} />
      <Detail
        label="Specializations"
        value={
          <div className="flex flex-wrap gap-1 pt-0.5">
            {v.specializations.map((s) => (
              <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                {s}
              </span>
            ))}
          </div>
        }
      />
      <Detail label="Certified until" value={formatDate(v.certifiedUntil)} />
    </>
  )
}

function hasKey<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}

export function UserDetailSheet({ user, open, onOpenChange }: Props) {
  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          <Detail label="Email" value={user.email} />
          <Detail
            label="Role"
            value={<Badge variant="secondary" className="text-xs w-fit">{ROLE_LABELS[user.role]}</Badge>}
          />
          <Detail
            label="Status"
            value={
              user.isActive
                ? <Badge variant="outline" className="border-primary text-primary text-xs w-fit">Active</Badge>
                : <Badge variant="outline" className="border-destructive text-destructive text-xs w-fit">Suspended</Badge>
            }
          />
          <Detail label="Member since" value={formatDate(user.createdAt)} />

          {user.specs && hasKey(user.specs, 'merchant') && (
            <MerchantDetails specs={user.specs as MerchantSpecs} />
          )}
          {user.specs && hasKey(user.specs, 'verifier') && (
            <VerifierDetails specs={user.specs as VerifierSpecs} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
