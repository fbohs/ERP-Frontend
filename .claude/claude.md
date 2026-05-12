# ERP — Engineering Guide

## Stack

- **Next.js 16** App Router (no Pages Router; do not introduce `pages/`)
- **React 19** Server Components by default; `'use client'` only where required
- **TypeScript** with `strict: true`
- **shadcn/ui** for all components, theming, and a11y primitives. shadcn is built on **Tailwind CSS v4** + **Radix UI**, so Tailwind is part of the stack by definition — but it's used *through* shadcn conventions (CSS variables, `cn()`, `cva` variants), not as a free-for-all utility soup.
- **Zustand v5** for client-side, domain-scoped stores
- **Vitest** for unit and component tests

> **No MUI. No emotion. No styled-components.** All styling flows through shadcn primitives and the design tokens defined below.

## Theme — Neon on Black

The theme lives entirely as CSS variables in `src/app/globals.css`. shadcn components read these tokens directly, so there is no theme factory, no provider, no runtime wiring.

Palette intent: true-black surfaces, neon-cyan primary, neon-magenta accent, off-white foreground, hairline neon-tinted borders. The app ships **dark-by-default**.

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Light scale kept minimal — app runs in dark by default. */
  --background: #f7f7f8;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --primary: #007a6b;
  --primary-foreground: #ffffff;
  --border: #e5e5e5;
  --ring: #007a6b;
  --radius: 0.5rem;
}

.dark {
  --background: #000000;          /* true black */
  --foreground: #f2f2f2;          /* off-white body text */
  --card: #0a0a0a;
  --card-foreground: #f2f2f2;
  --popover: #0a0a0a;
  --popover-foreground: #f2f2f2;
  --primary: #00ffd5;             /* neon cyan — CTAs, links, focus */
  --primary-foreground: #000000;
  --secondary: #1a1a1a;
  --secondary-foreground: #f2f2f2;
  --muted: #161616;
  --muted-foreground: #a3a3a3;
  --accent: #ff2bd6;              /* neon magenta — highlights, selected states */
  --accent-foreground: #000000;
  --destructive: #ff3b30;
  --destructive-foreground: #ffffff;
  --border: #1f1f1f;              /* hairline */
  --input: #1f1f1f;
  --ring: #00ffd5;                /* focus ring = primary neon */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

```tsx
// src/app/layout.tsx
import './globals.css'

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
```

If a runtime light/dark toggle is needed later, use `next-themes` wrapped in a tiny `ThemeProvider` client component — do not introduce a custom theme factory.

### Neon discipline

- Neon is loud. **One** neon for primary CTAs; the second neon (magenta) is reserved for highlights, selected states, and focus emphasis. Do not fill large surfaces with neon.
- Body text stays off-white (`--foreground`). Neon belongs on interactive affordances, status pills, chart accents, and headings of emphasis — never paragraphs.
- Focus rings must stay visible against black. Don't override shadcn's `focus-visible:ring-*` classes.

## Coding Standards

### TypeScript
- `strict: true` enforced. Never `any`; use `unknown` and narrow.
- `interface` for object shapes; `type` for unions and mapped types.
- Discriminated unions for variants.
- `readonly` on component props and immutable data.
- Prefer `Partial<T>`, `Pick<T>`, `Omit<T>` over redeclaring shapes.

### SOLID

**Single Responsibility — split stores by domain**
```ts
// src/stores/useUserStore.ts
export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
```

**Open/Closed — composition over inheritance**
```ts
interface ProductRenderer {
  render: (product: Product) => React.ReactNode
}
```

**Liskov — props contract holds for all variants**
```ts
interface ListProps<T> {
  readonly data: readonly T[]
  readonly loading: boolean
  readonly error: string | null
}
```

### Zustand pattern

```ts
// src/stores/useAppStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  readonly sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      }),
      { name: 'app-storage' },
    ),
  ),
)
```

Stores are client-only — any component that imports them must be `'use client'`.

## Architecture

### Folder structure

```
src/
├── app/
│   ├── layout.tsx              # <html class="dark"> + <body>; no providers needed by default
│   ├── page.tsx
│   ├── globals.css             # Tailwind v4 entry + shadcn CSS variables (the theme)
│   ├── loading.tsx             # Suspense skeleton shown while a segment is loading
│   ├── error.tsx               # Error boundary for a segment ('use client' required)
│   ├── not-found.tsx           # 404 UI for a segment
│   └── (feature)/              # Route groups per feature; each can have its own loading/error/not-found
├── components/
│   ├── ui/                     # shadcn primitives (Button, Card, Dialog, …) — generated by CLI
│   ├── Navbar/                 # index.tsx + helpers (Logo, SearchBar, User Icon Button, …)
│   └── Footer/                 # index.tsx + helpers (FooterLinkColumn, Quick Links, …)
├── features/                   # Feature-scoped logic (user, auth, product, order, payment, report generation)
├── hooks/                      # Reusable client hooks
├── stores/                     # Zustand stores, one per domain
├── services/                   # API clients, fetchers (server- and client-safe)
├── lib/
│   └── utils.ts                # cn() helper (shadcn standard)
├── utils/                      # Pure helpers
├── types/                      # Shared TypeScript types
└── constants/                  # Static data (countries, categories, social media links, …)
```

**Component organization.** Each public component lives in a PascalCase folder named after itself. The entry is `index.tsx` so consumers import the bare path: `import { Navbar } from '@/components/Navbar'`. Helper subcomponents local to a feature sit beside the entry (`components/Navbar/Logo.tsx`); helpers reused across two or more features get lifted to their own folder. shadcn primitives are the exception — they sit flat under `components/ui/` because that's where the shadcn CLI puts them. Avoid atoms/molecules/organisms; folder-by-feature scales better.

### Server vs Client Components

- **Default to Server Components.** They render on the server, ship no JS, and can fetch directly.
- Add `'use client'` only when the component needs: hooks (`useState`, `useEffect`, Zustand), browser APIs, event handlers, or context.
- Keep the client boundary low in the tree. A typical page is a Server Component that imports a small Client Component for the interactive part.
- Pass plain serializable props across the boundary. No functions, no class instances.
- Guard server-only modules with `import 'server-only'` at the top of the file. This causes a build-time error if the module is accidentally imported into a Client Component — critical for anything in `services/` or `lib/` that uses secrets or server-only APIs.

### Styling rules

- **shadcn first.** If shadcn ships a primitive for it (Button, Card, Tabs, Dialog, Sheet, …) use it. Don't hand-roll equivalents.
- **Tokens, not literals.** Use semantic classes — `bg-background`, `text-foreground`, `border-border`, `text-primary`, `bg-card` — so the neon palette flows everywhere automatically. Do not hardcode `#00ffd5` or `bg-black` in components.
- **`cn()` for conditional classes.** Compose with the helper from `lib/utils.ts`; never string-concatenate class names.
- **Variants via `cva`.** When a component needs visual variants, use `class-variance-authority` the way shadcn does — don't invent a parallel system.
- **No inline `style={{ … }}`** for anything tokens can express. Inline styles are reserved for dynamic values that genuinely can't be a class (e.g., a computed grid template).

### Data fetching

- Prefer **server-side fetching in Server Components** with `fetch()` and Next.js cache directives (`{ next: { revalidate: 60 } }`, `{ cache: 'no-store' }`).
- Use **route handlers** under `src/app/api/.../route.ts` for endpoints owned by the frontend.
- Server-side request interception (auth guards, redirects, rewrites) belongs in `src/proxy.ts` — export a function named `proxy`. **Do not create `middleware.ts`**; it is deprecated as of Next.js 16 and renamed to `proxy.ts`.
- For client-side mutations, call route handlers; do not duplicate fetch logic in client components.

## Build & Test

```bash
npm run dev          # Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Run the production build
npm run type-check   # tsc --noEmit
npm run lint         # next lint
npm run lint:fix
npm run format       # Prettier

npm run test                 # Vitest, run once
npm run test:watch
npm run test:coverage
npm run test -- src/components/Navbar/Navbar.test.tsx
```

### Component test

```ts
import { render, screen } from '@testing-library/react'
import { Greeting } from './Greeting'

describe('Greeting', () => {
  it('renders the default greeting', () => {
    render(<Greeting />)
    expect(screen.getByRole('heading', { name: /hello, world/i })).toBeInTheDocument()
  })

  it('renders a custom name', () => {
    render(<Greeting name="ERP" />)
    expect(screen.getByText(/hello, erp/i)).toBeInTheDocument()
  })
})
```

### Store test

```ts
import { useAppStore } from '@/stores/useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ sidebarOpen: true })
  })

  it('toggles the sidebar', () => {
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })
})
```

## Patterns to Avoid

**1. Pages Router** — no `pages/` directory; App Router only.

**2. MUI, emotion, styled-components** — out. If you find yourself reaching for `@mui/*` or `styled`, stop and use the shadcn equivalent. There is no migration path back.

**3. Unnecessary `'use client'`** — don't tag a whole layout or page as client just because one descendant needs state. Extract the interactive piece into its own client component and keep the page on the server.

**4. Hardcoded colors** — no `#00ffd5`, no `bg-[#000]`, no inline `style={{ color: '...' }}`. Use semantic tokens (`text-primary`, `bg-background`, `border-border`, `text-accent`) so the neon palette stays consistent everywhere.

**5. Massive stores** — no single store holding cart + user + UI + CMS state. Split by domain.

**6. `any` and unchecked casts** —
```ts
// Avoid
const handle = (data: any) => { ... }

// Prefer
const handle = (data: User[]) => { ... }
```

**7. Mixed naming** —
```ts
const userData = {}              // variables/functions: camelCase
const UserCard: React.FC = ...   // components: PascalCase
interface UserDTO { ... }        // types/interfaces: PascalCase
```

### Testing anti-patterns

**1. Implementation details** —
```ts
// Avoid
expect(component.state.isOpen).toBe(true)

// Prefer
expect(screen.getByRole('dialog')).toBeVisible()
```

**2. Over-mocking** — mock only what crosses an external boundary (network, filesystem). Don't mock React, Zustand, or your own modules.

**3. Real network in tests** — stub HTTP via `vi.fn()` or MSW. Tests must run offline and deterministically.