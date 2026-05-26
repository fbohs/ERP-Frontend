# TypeScript & Config Learnings

---

## 1. `tsconfig.json` — Keep `types` Array Complete

**Problem:** An explicit `"types"` array in `tsconfig.json` suppresses all ambient `@types` packages not listed. Missing entries (`"node"`, `"@testing-library/jest-dom"`) cause type errors for `__dirname` in `vitest.config.ts` and jest-dom matchers in tests.

**Fix:** Add the missing entries, or remove the `types` override entirely to let TypeScript auto-discover all installed `@types` packages.

```json
// Before
"types": ["vitest/globals"]

// After
"types": ["vitest/globals", "node", "@testing-library/jest-dom"]
```

**Rule:** The moment you add an explicit `"types"` array, you opt out of auto-discovery for everything not listed. Either commit to listing all needed packages or delete the override entirely.

**File:** `tsconfig.json`
