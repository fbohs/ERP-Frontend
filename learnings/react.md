# React Learnings

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

## 4. Don't Overwrite Form State in Submit Handler

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
