# Code Review Learnings

Lessons captured from a security, accessibility, and correctness review of this codebase.

---

## 1. React 19 — Drop `forwardRef`

**Problem:** `React.forwardRef` is deprecated in React 19.

**Fix:** Accept `ref` as a plain destructured prop. `React.ComponentProps<T>` already includes it.

```tsx
// Before (React 18)
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => <input ref={ref} {...props} />
)
Input.displayName = 'Input'

// After (React 19)
function Input({ className, ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />
}
```

Named functions carry their name automatically — `displayName` assignment is no longer needed.

**Files:** `src/components/ui/input.tsx`, `src/components/ui/label.tsx`

---

## 2. Radix UI — `onSelect` vs `onClick` on `DropdownMenuItem`

**Problem:** Using `onClick` on a Radix `DropdownMenuItem` does not fire on keyboard activation (Enter / Space).

**Fix:** Use `onSelect` — it fires on both mouse click and keyboard activation.

```tsx
// Before
<DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>

// After
<DropdownMenuItem onSelect={onLogout}>Log out</DropdownMenuItem>
```

**File:** `src/components/Navbar/UserIconButton.tsx`

---

## 3. `useCallback` Stale Closure — Use Functional Updater

**Problem:** Including state values in `useCallback` deps causes the callback to recreate on every render and can still close over stale values in concurrent mode.

**Fix:** Move the computation inside a `setState` functional updater. React always passes the latest committed value as `prev`, removing the need for the state variable in deps.

```ts
// Before — stale closure risk, recreates on every storedValue change
const setValue = useCallback((value) => {
  const valueToStore = typeof value === 'function' ? value(storedValue) : value
  setStoredValue(valueToStore)
  localStorage.setItem(key, JSON.stringify(valueToStore))
}, [key, storedValue])

// After — stable reference, always sees latest state
const setValue = useCallback((value) => {
  setStoredValue((prev) => {
    try {
      const valueToStore = typeof value === 'function' ? value(prev) : value
      localStorage.setItem(key, JSON.stringify(valueToStore))
      return valueToStore
    } catch {
      return prev
    }
  })
}, [key])
```

**File:** `src/hooks/useLocalStorage.ts`

---

## 4. Fetch — Normalize `HeadersInit` Before Spreading

**Problem:** Spreading `fetchOptions.headers` with a type cast silently drops entries when the caller passes a `Headers` instance or a `string[][]` array.

**Fix:** Always normalize via `new Headers(...)` which accepts all three valid `HeadersInit` forms.

```ts
// Before — breaks for Headers instance or [key, value][] tuples
const headers = {
  'Content-Type': 'application/json',
  ...(fetchOptions.headers as Record<string, string>),
}

// After — handles all HeadersInit forms
const headers = {
  'Content-Type': 'application/json',
  ...Object.fromEntries(new Headers(fetchOptions.headers).entries()),
}
```

**File:** `src/services/api.ts`

---

## 5. Fetch — AbortController Timeout

**Problem:** A fetch with no timeout hangs indefinitely on slow or unresponsive servers.

**Fix:** Attach an `AbortController` signal and clear the timer in `finally` to prevent leaks. Respect any signal the caller already provided.

```ts
const REQUEST_TIMEOUT_MS = 30_000

const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

let res: Response
try {
  res = await fetch(url, {
    ...fetchOptions,
    signal: fetchOptions.signal ?? controller.signal,
  })
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)
  }
  throw err
} finally {
  clearTimeout(timeoutId)
}
```

**File:** `src/services/api.ts`

---

## 6. Fetch — Guard Against Empty / 204 Bodies

**Problem:** `res.json()` throws a SyntaxError on 204 No Content or any response with an empty body.

**Fix:** Read the body as text first, then parse only if non-empty.

```ts
// Before
return res.json() as Promise<T>

// After
const text = await res.text()
return (text.length === 0 ? null : JSON.parse(text)) as T
```

**File:** `src/services/api.ts`

---

## 7. Auth — Never Store Bearer Tokens Client-Side

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

**Files:** `src/stores/useAuthStore.ts`, `src/app/login/LoginForm.tsx`, `src/app/login/RegisterForm.tsx`

---

## 8. Password Validation — Exclude Whitespace from Special Character Rule

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

## 9. `AddProductModal` — Don't Overwrite Form State in Submit Handler

**Problem:** A submit handler that always forces a hardcoded status overrides the user's dropdown selection (e.g., choosing "archived" was silently ignored).

**Fix:** Make the override optional and fall back to the form's own state.

```ts
// Before
const handleSubmit = (publishStatus: 'draft' | 'active') => {
  console.log({ ...form, status: publishStatus })
}

// After
const handleSubmit = (publishStatus?: ProductFormState['status']) => {
  const effectiveStatus = publishStatus ?? form.status
  console.log({ ...form, status: effectiveStatus })
}
```

**File:** `src/features/products/AddProductModal/index.tsx`

---

## 10. `tsconfig.json` — Keep `types` Array Complete

**Problem:** An explicit `"types"` array in `tsconfig.json` suppresses all ambient `@types` packages not listed. Missing entries (`"node"`, `"@testing-library/jest-dom"`) cause type errors for `__dirname` in `vitest.config.ts` and jest-dom matchers in tests.

**Fix:** Add the missing entries, or remove the `types` override entirely to let TypeScript auto-discover all installed `@types` packages.

```json
// Before
"types": ["vitest/globals"]

// After
"types": ["vitest/globals", "node", "@testing-library/jest-dom"]
```

**File:** `tsconfig.json`
