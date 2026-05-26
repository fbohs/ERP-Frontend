# Auth & Security Learnings

---

## 1. Never Store Bearer Tokens Client-Side

**Problem:** Writing a token to `document.cookie` makes it readable by JavaScript (XSS risk). Persisting it via Zustand `persist` stores it in `localStorage` (also XSS-accessible).

**Fix:**
- Remove the token from the store state entirely.
- Let the server set an HttpOnly cookie on login (via `Set-Cookie` header).
- On logout, call a server endpoint (`POST /api/auth/logout`) to expire the HttpOnly cookie; clear client user state immediately regardless of whether the request succeeds.
- Derive `isAuthenticated` from user presence, not token presence.
- Use `partialize` to exclude sensitive fields from `localStorage` persistence.

```ts
// Before
setAuth: (user, token) => {
  document.cookie = `auth-token=${token}; path=/; SameSite=Strict; Max-Age=...`
  set({ user, token })
},
isAuthenticated: () => get().token !== null,

// After
setAuth: (user) => set({ user }),
clearAuth: () => {
  set({ user: null })
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
},
isAuthenticated: () => get().user !== null,
```

```ts
// partialize — only user object goes to localStorage, never the token
partialize: (state) => ({ user: state.user }),
```

**Files:** `src/stores/useAuthStore.ts`, `src/app/login/LoginForm.tsx`

---

## 2. Password Validation — Exclude Whitespace from Special Character Rule

**Problem:** `/[^A-Za-z0-9]/` matches whitespace, so a password like `"password 1A"` passes the special character check on the space alone.

**Fix:** Use Unicode property escapes to match only punctuation (`\p{P}`) and symbols (`\p{S}`), which whitespace does not belong to.

```ts
// Before
test: (p) => /[^A-Za-z0-9]/.test(p)

// After
test: (p) => /\p{P}|\p{S}/u.test(p)
```

This also correctly handles non-ASCII special characters that an ASCII enumeration would miss.

**File:** `src/utils/password.ts`

---

## 3. Separate Identity Architecture (Tenant vs Platform Admin)

Two completely independent identities can coexist in the same browser with zero conflict as long as every layer uses different keys:

| Concern | Tenant | PlatformAdmin |
|---|---|---|
| Auth method | Password | Passwordless magic link |
| Cookie | `auth-token` | `platform-auth-token` |
| Zustand store | `useAuthStore` | `usePlatformAuthStore` |
| localStorage key | `auth-storage` | `platform-auth-storage` |
| Type shape | `User` (has `role`, `avatarUrl`) | `PlatformAdmin` (has `publicId`, `isActive`) |
| Self-registration | Allowed | No — bootstrapped via CLI only |

---

## 4. Passwordless Magic Link Flow (Two-Step)

```
Step 1 — Request link
  Client → POST /api/platform/auth/request-link { email }
  Route handler → POST <backend>/platform/auth/request-link
  Always return { ok: true } regardless — enumeration defense.
  Frontend always shows "check your inbox" screen.

Step 2 — Verify token
  User clicks email link → /platform/verify?token=<hex>
  Client → POST /api/platform/auth/verify { token }
  Route handler → POST <backend>/platform/auth/verify
  Backend returns { token: string } (bearer token only — NOT an admin object)
  Route handler sets httpOnly cookie, then calls GET /platform/auth/me
  Returns { ok: true, admin } to client.
  Client calls setAuth(admin) → redirects to /platform/dashboard.
```

**Key:** The backend `/platform/auth/verify` endpoint returns only `{ token }` — no admin object. Admin details require a separate `GET /platform/auth/me` call. The route handler must chain both and return the admin in the verify response.

---

## 5. Enumeration Defense — Always Return 200 on Auth Requests

`POST /platform/auth/request-link` must always return `200 { ok: true }` regardless of whether the email belongs to a known admin. Swallow all backend errors in the route handler:

```ts
// Always returns { ok: true } — never leaks whether email exists
try {
  await fetch(`${PLATFORM_API}/platform/auth/request-link`, { ... })
} catch { /* swallow */ }
return NextResponse.json({ ok: true })
```

---

## 6. httpOnly Cookie vs Zustand — What Protects What

**httpOnly cookie** = the real auth guard. `proxy.ts` reads it on the server to gate routes. Client JS cannot read or forge it.

**Zustand store** = display cache only. Stores the admin object for showing name/email in the UI. It is NOT the source of truth for "is this user logged in."

`isAuthenticated()` in the Zustand store returns `platformAdmin !== null && serverValidated` — this is unreliable as a security check because Zustand can be cleared on hard refresh. Never use it to conditionally render sensitive server data; use a server-side cookie check for that.
