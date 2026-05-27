# State Management Learnings

---

## 1. Zustand Population Bug — Route Handler Must Return the Fetched Entity

**Problem:** A verify flow completed successfully (cookie set, redirect triggered), but the Zustand store remained empty (`platformAdmin: null`). The nav showed a fallback avatar forever on fresh load.

**Root cause:** The backend `/platform/auth/verify` endpoint returns only `{ token: string }` — no admin object. The route handler set the cookie and returned `{ ok: true }` with nothing else, so the client had no admin data to call `setAuth()` with.

**Fix:** In the route handler, after setting the cookie, chain a `GET /auth/me` call with the fresh token and include the result in the response body:

```ts
// route handler — after verifying token and setting cookie
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

Then the client reads `data.admin` and calls `setAuth(admin)` before redirecting.

**Lesson:** When a flow transitions authentication state, the response body must carry the entity the client needs to populate its store. A bare `{ ok: true }` is insufficient if the store needs data.

---

## 2. Non-Fatal Fallback Pattern

When a secondary fetch *enhances* but does not *gate* a flow, wrap it in try/catch and treat failure as non-fatal:

```ts
let admin: unknown = null
try {
  const meRes = await fetch(...)
  if (meRes.ok) admin = await meRes.json()
} catch { /* swallow */ }
```

**When this is appropriate:** The primary action (e.g., setting the auth cookie) already succeeded. The secondary data (e.g., admin display name) has an alternative recovery path (e.g., `validateSession()` called on next mount). The absence of secondary data degrades the UX (missing avatar) but does not break functionality.

**When this is NOT appropriate:** The secondary data gates a subsequent action (e.g., you need the entity ID before redirecting to its detail page). In that case, failure must surface as an error, not be swallowed.

---

## 3. `readonly` on Zustand Interface Properties That Are Mutated in Rehydration

**Problem:** Marking a Zustand state property `readonly` in the interface then directly assigning to it in `onRehydrateStorage` causes a TypeScript error (`Cannot assign to 'x' because it is a read-only property`).

**Root cause:** `onRehydrateStorage` receives the hydrated state object, and Zustand intentionally allows mutation there (it's a one-time init callback, not a setter). TypeScript sees the property as `readonly` and rejects the assignment.

**Fix:** Remove `readonly` from properties that are legitimately mutated during rehydration:

```ts
interface PlatformAuthState {
  readonly platformAdmin: PlatformAdmin | null
  serverValidated: boolean  // ← not readonly; mutated in onRehydrateStorage
}
```

**Rule:** Only mark a property `readonly` if it is never directly assigned outside of the `set()` callback. Rehydration callbacks count as direct assignment.
