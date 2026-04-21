# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Active Project

**Libri Ex Machina** — a personal media library manager at `/library`.

## Commands (run from project root)

```bash
npm run setup       # First-time: install deps + prisma generate + db push
npm run dev         # Dev server with Turbopack at localhost:3000
npm run build       # Production build (prisma generate + db push + next build)
npm run lint        # ESLint
npm run test        # Vitest unit tests
```

**Environment:** Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `ANTHROPIC_API_KEY`, and `JWT_SECRET`.

## Architecture

**Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma (PostgreSQL/Neon).

### Key Files

- **`src/app/library/page.tsx`** — Main library UI (all state, modals, and shelf rendering in one file)
- **`src/app/library/types.ts`** — `LibraryItem`, `MediaType`, `CollectorField` types
- **`src/app/library/media-config.ts`** — Per-media-type field config, option arrays, `DETAIL_FIELDS`, `COLLECTOR_SECTIONS`
- **`src/app/library/DetailPanel.tsx`** — Item detail slide-in panel
- **`src/app/library/CollectorNotesModal.tsx`** — Collector metadata modal
- **`src/app/library/BarcodeScanner.tsx`** — Camera barcode scan component
- **`src/app/library/barcode-lookup.ts`** — ISBN/barcode → metadata API calls
- **`src/app/library/cover-fetcher.ts`** — Open Library + Wikipedia cover URL helpers
- **`src/app/api/library/route.ts`** — GET/PUT endpoints for cloud sync (requires auth)
- **`src/lib/auth.ts`** — JWT session management (bcrypt + jose)
- **`src/lib/prisma.ts`** — Prisma client singleton
- **`src/actions/index.ts`** — Server actions: `signIn`, `signUp`, `signOut`, `getUser`

### Data Storage

Items are stored in `localStorage` for anonymous users and synced to the `LibraryCollection` table (Prisma/PostgreSQL) for authenticated users. The `storageMode` state in `page.tsx` tracks which is active.

### Auth

Optional JWT auth (HS256, 7-day expiry) stored in httpOnly cookies. Anonymous users get full app access; signing in persists the collection to the database.

## Database

Prisma with PostgreSQL (Neon). Two models: `User` and `LibraryCollection`. Run `npm run setup` on first use, or `npx prisma db push` to sync schema changes.

## Tests

Four test suites under `src/app/library/__tests__/`:
- `stability.test.ts` — core logic (shelf layout, sort, filter, localStorage, backup merge, cover URLs)
- `usability.test.ts` — barcode lookup, Wikipedia cover fetch
- `security.test.ts` — CSRF, auth middleware, input sanitisation
- `elegance.test.ts` — UI behaviour mirrors

Run a single suite: `npx vitest src/app/library/__tests__/stability.test.ts`

## Path Alias

`@/*` → `src/*` (configured in `tsconfig.json`).
