# Session 01 — Platform Admin Auth & Dashboard Shell

## Context

Implementing a separate superadmin (PlatformAdmin) identity alongside tenant (merchant) identity in a Next.js 16 App Router project. Backend runs at `http://localhost:6363`.

---

## 1. Separate Identity Architecture

Superadmin is a completely different identity from tenant users:

| Concern | Tenant | PlatformAdmin |
|---|---|---|
| Auth method | Password | Passwordless magic link |
| Cookie | `auth-token` | `platform-auth-token` |
| Zustand store | `useAuthStore` | `usePlatformAuthStore` |
| localStorage key | `auth-storage` | `platform-auth-storage` |
| Type shape | `User` (has `role`, `avatarUrl`) | `PlatformAdmin` (has `publicId`, `isActive`) |
| Self-registration | Allowed | No — bootstrapped via CLI only |

Both sessions can coexist in the same browser with zero conflict because every layer uses different keys.

---

## 2. Passwordless Magic Link Flow (Two-Step)

```
Step 1 — Request link
  Client → POST /api/platform/auth/request-link { email }
  Route handler → POST http://localhost:6363/platform/auth/request-link
  Always return { ok: true } regardless — enumeration defense.
  Frontend always shows "check your inbox" screen.

Step 2 — Verify token
  User clicks email link → /platform/verify?token=<hex>
  Client → POST /api/platform/auth/verify { token }
  Route handler → POST http://localhost:6363/platform/auth/verify
  Backend returns { token: string } (bearer token, NOT an admin object)
  Route handler sets httpOnly cookie, then calls GET /platform/auth/me
  Returns { ok: true, admin } to client.
  Client calls setAuth(admin) → redirects to /platform/dashboard.
```

**Key**: backend returns only `{ token: string }` from verify — no admin object. Admin details require a separate `GET /platform/auth/me` call.

---

## 3. Enumeration Defense

`POST /platform/auth/request-link` must always return 200 `{ ok: true }` regardless of whether the email belongs to a known admin. The route handler swallows all backend errors:

```ts
// Always returns { ok: true } — never leaks whether email exists
try {
  await fetch(`${PLATFORM_API}/platform/auth/request-link`, { ... })
} catch { /* swallow */ }
return NextResponse.json({ ok: true })
```

---

## 4. Route Handlers as Server-Side Proxies

Never expose the backend port (`6363`) to the browser. All backend calls go through Next.js route handlers:

- Browser calls `/api/platform/auth/verify`
- Route handler calls `http://localhost:6363/platform/auth/verify` server-to-server
- `PLATFORM_API_URL` env var has no `NEXT_PUBLIC_` prefix — it's server-only

This also lets the route handler set httpOnly cookies, which client code can never do.

---

## 5. httpOnly Cookie vs Zustand — What Protects What

**httpOnly cookie** = the real auth guard. `proxy.ts` reads it to gate `/platform/*` routes. Client JS cannot read or forge it.

**Zustand store** = display cache only. Stores `platformAdmin` for showing name/email in the nav. It is NOT the source of truth for "is this user logged in."

`isAuthenticated()` in the store returns `platformAdmin !== null && serverValidated` — this is unreliable as a security check because Zustand can be cleared on hard refresh. Never use it to conditionally render sensitive server data; use the cookie-based server check for that.

---

## 6. The Zustand Population Bug (and Fix)

**Problem**: `VerifyClient` verified successfully, got `{ ok: true }`, and redirected. `setAuth()` was never called. `platformAdmin` stayed `null` in Zustand. Nav showed "PA" fallback forever.

**Root cause**: Backend `/platform/auth/verify` returns only `{ token }` — no admin details. The route handler set the cookie and returned `{ ok: true }` with nothing else.

**Fix**: In the verify route handler, after setting the cookie, call `GET /platform/auth/me` with the fresh token and include the result in the response:

```ts
// route handler — after setting cookie
let admin: unknown = null
try {
  const meRes = await fetch(`${PLATFORM_API}/platform/auth/me`, {
    headers: { Authorization: `Bearer ${data.token}` },
  })
  if (meRes.ok) admin = await meRes.json()
} catch {
  // Non-fatal — client falls back to validateSession() on next mount
}
return NextResponse.json({ ok: true, admin })
```

Then `VerifyClient` reads `data.admin` and calls `setAuth()` before redirecting.

**Fallback**: If `/me` fails (endpoint not ready), `admin` is null, `setAuth()` is skipped, and `PlatformNav`'s `validateSession()` on mount is the fallback. No hard dependency on `/me` being live.

---

## 7. Next.js 16: proxy.ts, Not middleware.ts

`middleware.ts` is deprecated in Next.js 16. The equivalent is `src/proxy.ts` exporting a function named `proxy`.

Critical rule: always bypass `/api/*` routes in proxy logic, or API calls get redirect-looped:

```ts
if (pathname.startsWith('/api/')) return NextResponse.next()
```

---

## 8. Suspense Boundary for useSearchParams

Any component that calls `useSearchParams()` must be wrapped in a `<Suspense>` boundary in App Router, or the build fails:

```tsx
// page.tsx (Server Component)
export default function VerifyPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <VerifyClient /> {/* calls useSearchParams() */}
    </Suspense>
  )
}
```

---

## 9. Route Groups for Shared Layout

`src/app/platform/(dashboard)/` uses a route group (parentheses) to apply a shared layout (nav + sidebar + footer) without adding `dashboard` to the URL. Routes inside are `/platform/dashboard`, `/platform/tenants`, `/platform/settings` — not `/platform/dashboard/dashboard`.

---

## 10. Visual Distinction: Platform vs Tenant

Platform admin surface uses **magenta accent** (`--accent: #ff2bd6`) everywhere tenant uses **cyan primary** (`--primary: #00ffd5`). This makes it immediately obvious which surface you're on:

- Platform logo: `Shield` icon, `text-accent`
- Platform avatar: `bg-accent text-accent-foreground`
- Platform "Super Admin" badge: `border-accent text-accent`
- Tenant equivalents: all use `text-primary` / `bg-primary`

---

## 11. Non-Fatal Fallback Pattern

When a secondary fetch enhances but doesn't gate a flow, wrap it in try/catch and treat failure as non-fatal:

```ts
let admin: unknown = null
try {
  const meRes = await fetch(...)
  if (meRes.ok) admin = await meRes.json()
} catch { /* swallow */ }
```

This is appropriate when the primary action (setting the cookie) already succeeded and the secondary data (admin details) has an alternative path (`validateSession()` on mount).

---

## Files Created This Session

```
src/
├── stores/usePlatformAuthStore.ts
├── constants/platformNavigation.ts
├── app/
│   ├── login/AuthCard.tsx                          (register tab removed)
│   ├── platform/
│   │   ├── login/page.tsx + PlatformLoginCard.tsx
│   │   ├── verify/page.tsx + VerifyClient.tsx
│   │   └── (dashboard)/
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
└── types/index.ts                                  (PlatformAdmin added)
```
