# Next.js Routing Learnings

---

## 1. Route Group Name Must Not Match Any Child Folder Name (Turbopack)

**Date:** 2026-05-26  
**Context:** Platform-admin surface (`/platform/*`), Next.js 16.2.6 with Turbopack in dev mode.

### What happened

All routes under `src/app/platform/` — including `login` and `verify` — returned 404, even though their `page.tsx` files existed and had no import errors. The proxy was functioning correctly. The dev-server log showed a single repeating error:

```
You cannot have two parallel pages that resolve to the same path.
Please check /platform/(dashboard)/dashboard and /platform/dashboard.
```

### Root cause

The route group was named `(dashboard)`. Inside it was a subdirectory also named `dashboard`:

```
src/app/platform/
└── (dashboard)/          ← route group; name stripped from URL
    ├── layout.tsx
    ├── dashboard/         ← child folder; adds "dashboard" to URL → /platform/dashboard
    ├── settings/
    └── tenants/
```

Turbopack uses the route group's bare name for internal conflict detection. Because `(dashboard)` and `dashboard/` share the name, Turbopack sees two entries resolving to `/platform/dashboard` and **disables the entire `platform/` segment tree** — not just the conflicting page. Every page under `platform/` becomes 404, including completely unrelated `login/` and `verify/`.

### Why it was hard to spot

1. **Silent blast radius.** The error only names the two dashboard paths, but the failure scope is the entire parent segment.
2. **Hot-reload doesn't detect directory renames.** The error appears to clear in logs (later compilations show success) but the broken router state persists until a full server restart.
3. **Proxy was a red herring.** The proxy correctly passed `NextResponse.next()` for public paths — the pages simply weren't registered in the router at all.
4. **RSC payload reveals the truth.** The flight payload on the 404 response showed the router tree only had `/_not-found` as a child of the root — no `platform` segment. That's the signal the entire segment failed to register.

### Diagnosis steps that worked

```bash
# 1. Confirm scope — test inside and outside the route group with a fake auth cookie
curl -s -o /dev/null -w "%{http_code}" -b "platform-auth-token=fake" http://localhost:3000/platform/dashboard
# → 404 (inside route group — broken)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/login
# → 404 (outside route group — also broken — confirms parent segment failure)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
# → 200 (different segment tree — fine)

# 2. Read dev log
tail -100 .next/dev/logs/next-development.log | grep ERROR

# 3. Confirm Next.js 16 invokes proxy.ts correctly
grep "middlewareModule.proxy" node_modules/next/dist/server/next-server.js
# → handler: middlewareModule.proxy || middlewareModule.middleware || middlewareModule
```

### Fix

Rename the route group so its bare name cannot collide with any child folder:

```bash
mv src/app/platform/\(dashboard\) src/app/platform/\(shell\)
```

Then **fully restart the dev server** — hot reload does not pick up directory renames.

### Rules to carry forward

| Rule | Why |
|------|-----|
| Never name a route group `(X)` if a direct child folder is also named `X` | Turbopack conflict detector uses the bare name; collision disables the entire parent segment |
| After any directory rename, do a full dev server restart | Turbopack's watcher doesn't reprocess structural filesystem changes at runtime |
| When all routes in a segment 404, decode the RSC flight payload | The payload's route tree reveals whether the segment is registered at all |
| Test scope breadth-first when debugging 404s: which sibling segments work vs. break? | Narrows hypothesis from "page bug" → "segment registration bug" → "route conflict" |

### Interview framing

> "We had a hard-to-diagnose 404 affecting an entire route segment in Next.js 16. The error message named two conflicting dashboard pages, but the real casualties were the login and verify pages that had nothing to do with the dashboard. I narrowed it down by testing routes both inside and outside the affected route group with fake auth cookies, then decoded the RSC flight payload on the 404 response — which showed the router hadn't registered the `platform` segment at all, not just the conflicting page. Root cause was a naming collision in Turbopack: a route group named `(dashboard)` with a child folder also named `dashboard/` — Turbopack uses the bare name for conflict detection and disables the whole parent segment on collision. Fix was a one-liner rename of the route group, plus a full server restart because hot reload doesn't reprocess directory renames."

---

## 2. `proxy.ts` Not `middleware.ts` (Next.js 16)

`middleware.ts` is deprecated in Next.js 16. The equivalent is `src/proxy.ts` exporting a function named `proxy`.

Next.js 16 loads it as: `middlewareModule.proxy || middlewareModule.middleware || middlewareModule` — so the export name must be `proxy`.

**Critical rule:** always bypass `/api/*` routes in proxy logic, or API route handlers get redirect-looped:

```ts
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Must be first — API routes handle their own auth
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // ... rest of guard logic
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## 3. Route Handlers as Server-Side Proxies

Never expose the backend port to the browser. All backend calls go through Next.js route handlers:

- Browser calls `/api/platform/auth/verify`
- Route handler calls `http://localhost:6363/platform/auth/verify` server-to-server
- `PLATFORM_API_URL` env var has **no** `NEXT_PUBLIC_` prefix — it's server-only

This pattern also lets the route handler set HttpOnly cookies, which client JS cannot do.

---

## 4. Suspense Boundary Required for `useSearchParams`

Any component that calls `useSearchParams()` must be wrapped in a `<Suspense>` boundary in App Router, or the build fails with a static generation error:

```tsx
// page.tsx (Server Component)
export default function VerifyPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <VerifyClient /> {/* calls useSearchParams() inside */}
    </Suspense>
  )
}
```

---

## 5. Route Groups for Shared Layout Without URL Pollution

A route group `(name)` applies a shared `layout.tsx` to all routes inside it without adding `name` to the URL. Routes inside `platform/(shell)/` resolve at `/platform/...`:

```
src/app/platform/
└── (shell)/
    ├── layout.tsx       ← nav + sidebar + footer
    ├── dashboard/       → /platform/dashboard
    ├── tenants/         → /platform/tenants
    └── settings/        → /platform/settings
```

**Do not name the route group the same as any child folder** — see entry #1 above.
