# Platform Admin — Project-Specific Notes

Session and design decisions specific to the `/platform/*` admin surface. Generic patterns extracted from these sessions live in the topic files.

---

## Visual Identity — Platform vs Tenant Surface

Platform admin uses **magenta accent** (`--accent: #ff2bd6`) everywhere the tenant surface uses **cyan primary** (`--primary: #00ffd5`). This makes it immediately obvious which surface you're on at a glance:

| Element | Tenant | Platform Admin |
|---|---|---|
| Logo icon | `LayoutDashboard`, `text-primary` | `Shield`, `text-accent` |
| Avatar background | `bg-primary text-primary-foreground` | `bg-accent text-accent-foreground` |
| Role badge | `text-primary border-primary` | `text-accent border-accent` |

**Why:** Both surfaces share the same browser session and can be open in adjacent tabs. Color-coding prevents accidental admin actions in the wrong context.

---

## Files Created — Sessions

### Session 01 — Platform Auth & Dashboard Shell

```
src/
├── stores/usePlatformAuthStore.ts
├── constants/platformNavigation.ts
├── app/
│   ├── platform/
│   │   ├── login/page.tsx + PlatformLoginCard.tsx
│   │   ├── verify/page.tsx + VerifyClient.tsx
│   │   └── (shell)/                          ← renamed from (dashboard) — see nextjs-routing.md #1
│   │       ├── layout.tsx
│   │       ├── PlatformNav.tsx
│   │       ├── PlatformUserButton.tsx
│   │       ├── PlatformSidebar.tsx
│   │       ├── PlatformFooter.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── tenants/page.tsx
│   │       └── settings/page.tsx
│   └── api/platform/auth/
│       ├── request-link/route.ts
│       ├── verify/route.ts
│       ├── me/route.ts
│       └── logout/route.ts
└── types/index.ts                            (PlatformAdmin added)
```

### Session 02 — Tenant Management UI

```
src/
├── types/index.ts                            (Tenant, CreateTenantBody, BackendError added)
├── stores/usePlatformTenantsStore.ts
├── app/
│   ├── api/platform/tenants/
│   │   ├── route.ts                         (GET list, POST create)
│   │   └── [id]/route.ts                    (GET single, PATCH suspend/reactivate)
│   └── platform/(shell)/tenants/
│       ├── page.tsx                          (server component shell)
│       ├── TenantsTable.tsx                  (client — fetch on mount, search, skeleton)
│       ├── CreateTenantDialog.tsx            (client — form with client+server validation)
│       └── SuspendTenantDialog.tsx           (client — confirmation dialog)
```
