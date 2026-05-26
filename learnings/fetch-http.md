# Fetch / HTTP Learnings

---

## 1. Normalize `HeadersInit` Before Spreading

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

## 2. AbortController Timeout

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

## 3. Guard Against Empty / 204 Bodies

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
