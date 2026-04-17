# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # First-time: install deps + run Prisma generate + migrate
npm run dev         # Dev server with Turbopack at localhost:3000
npm run build       # Production build
npm run lint        # ESLint
npm run test        # Vitest (all tests)
npm run db:reset    # Reset SQLite database (destructive)
```

Run a single test file: `npx vitest src/lib/__tests__/file-system.test.ts`

**Environment:** Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, the app falls back to a `MockLanguageModel` that generates static placeholder components.

## Architecture

**Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma (SQLite), Vercel AI SDK with Anthropic Claude Haiku 4.5.

### Core Data Flow

```
User Chat Input
  → POST /api/chat (route.ts)
  → streamText() with Claude + tools
  → Tool calls (str_replace_editor / file_manager)
  → VirtualFileSystem (in-memory)
  → FileSystemContext (React state)
  → PreviewFrame (Babel JSX transform → live render)
```

### Virtual File System (`src/lib/file-system.ts`)

All generated files live **in-memory only** — nothing is written to disk during generation. The `VirtualFileSystem` class provides file operations (`createFile`, `updateFile`, `deleteFile`, `replaceInFile`, `insertInFile`, etc.) and `serialize()` / `deserializeFromNodes()` for persistence. Projects are saved to Prisma only when a user is authenticated.

### Agentic Chat Loop (`src/app/api/chat/route.ts`)

POST endpoint accepts `{ messages, files, projectId }`. Uses Vercel AI SDK `streamText()` with two tools:
- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): `view`, `create`, `str_replace`, `insert`, `undo_edit` commands
- **`file_manager`** (`src/lib/tools/file-manager.ts`): `rename`, `delete` commands

Max 40 steps (4 for mock) to prevent infinite loops. System prompt lives in `src/lib/prompts/generation.tsx` — it instructs Claude to create `/App.jsx`, use Tailwind, and use `@/` path aliases.

### Three-Panel UI (`src/app/main-content.tsx`)

`ResizablePanelGroup` with:
- **Left (35%):** `ChatInterface` — messages + input
- **Right (65%):** Tabs for `PreviewFrame` (live render) and a split `FileTree` + `CodeEditor` (Monaco)

### State Management

Two React contexts (no external state library):
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): Owns the `VirtualFileSystem` instance, selected file, and `handleToolCall` dispatcher. Auto-selects `/App.jsx` if present.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`, passes serialized filesystem to the API, routes tool-call results back to `FileSystemContext`.

### Auth (`src/lib/auth.ts`)

Optional; JWT (HS256, 7-day expiry) stored in httpOnly cookies. Anonymous users can use the app without signing in — their work is tracked in `src/lib/anon-work-tracker.ts`. Middleware at `src/middleware.ts` protects only `/api/projects` and `/api/filesystem` routes.

### Provider Abstraction (`src/lib/provider.ts`)

Returns Anthropic model when `ANTHROPIC_API_KEY` is set, otherwise returns `MockLanguageModel` that simulates multi-step tool use with static placeholder components (Counter, ContactForm, Card).

### JSX Transform (`src/lib/transform/`)

Babel Standalone runs **client-side** in `PreviewFrame` to transpile JSX → JS, enabling live preview without a build step. The `@/` alias is resolved against the virtual filesystem at transform time.

## Code Style

Use comments sparingly. Only comment complex code.

## Path Alias

`@/*` → `src/*` (configured in `tsconfig.json`). Within generated components, `@/` resolves against the virtual filesystem.

## Database

Prisma with SQLite (`prisma/dev.db`). Two models: `User` (email + bcrypt password) and `Project` (stores `messages` and `data` as JSON strings). Run `npm run setup` to create the DB on first use.
