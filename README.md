# ERP — High-Performance Enterprise Frontend

A full-featured ERP frontend built with **Next.js 16 (App Router)**, **TypeScript**, **shadcn/ui**, and **Zustand**. Themed neon-on-black, dark-by-default.

## Stack

- **Next.js 16** — App Router, React Server Components, Turbopack
- **React 19**
- **TypeScript** (strict)
- **shadcn/ui** — components, design tokens, accessibility primitives (built on Tailwind CSS v4 + Radix UI)
- **Zustand v5** — domain-scoped client state (UI, auth, cart, etc.)
- **Vitest** — unit/component tests

## Theme

Neon-on-black: true-black surfaces, neon-cyan primary, neon-magenta accent, off-white body text, hairline borders. Theme tokens live as CSS variables in `src/app/globals.css` and are consumed by shadcn components directly — no theme factory, no provider. The app ships **dark-by-default** via `<html class="dark">`. See `claude.md` for the full palette.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command               | Purpose                          |
| --------------------- | -------------------------------- |
| `npm run dev`         | Start the dev server             |
| `npm run build`       | Production build                 |
| `npm run start`       | Run the production build         |
| `npm run lint`        | Lint with `next lint`            |
| `npm run type-check`  | TypeScript type check (no emit)  |
| `npm run test`        | Run Vitest test suite            |
| `npm run test:watch`  | Vitest in watch mode             |

## Project docs

- `claude.md` — full engineering guide (stack, theme, architecture, build/test, patterns to follow and avoid)
- `component.md` — component conventions (folder layout, naming, server vs client, styling rules)
