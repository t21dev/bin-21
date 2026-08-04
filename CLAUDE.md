# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bin 21 is a modern, privacy-focused pastebin service built with Next.js 16.3, TypeScript, and Tailwind CSS 4. It supports 150+ language syntax highlighting via Shiki, Markdown rendering with GFM, client-side AES-256-GCM encryption for private pastes, and stores paste content in Cloudflare R2 with metadata in SQLite via Drizzle ORM.

It deploys to Railway as a **single service**: the SQLite file lives on a mounted volume at `/data`. Because Railway forbids replicas on a service with a volume, the app is always single-instance — which is what makes in-memory rate limiting and the in-process janitor correct rather than merely convenient. It also means redeploys incur brief downtime and the app cannot scale horizontally.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
npm run db:generate  # Generate a SQL migration after editing lib/db/schema.ts
npm run db:push      # Push schema directly (dev shortcut, skips migration files)
npm run db:generate  # Generate Drizzle migrations
```

## Architecture

### Folder Structure Pattern: server/ with actions + services

- **`server/actions/`** - Next.js Server Actions (entry points for mutations). Actions handle validation (Zod), call services, and return results.
- **`server/services/`** - Core business logic. Services are pure functions that handle DB queries, R2 storage, and data processing. Actions call services, never the other way around.
- **`lib/`** - Shared utilities (DB client, Shiki highlighter, rate limiter, janitor, admin auth, language list, ID generator).
- **`lib/db/`** - Drizzle ORM schema, SQLite client, and generated migrations.
- **`components/`** - React components. Client components use `'use client'` directive.
- **`components/ui/`** - Vendored third-party primitives (Evil Charts' Recharts wrapper). Written against shadcn token names, aliased onto Bin 21's tokens in `globals.css`.
- **`components/admin/`** - Admin analytics dashboard and charts.
- **`app/`** - Next.js App Router pages using route groups.
- **`types/`** - Shared TypeScript types.

### Data Flow

1. User submits paste form (client component)
2. Server Action (`server/actions/paste.actions.ts`) validates with Zod
3. Service (`server/services/paste.service.ts`) generates ID, uploads content to R2, saves metadata to SQLite
4. Returns paste ID to client for redirect

### Key Technical Decisions

- **Paste content stored in Cloudflare R2**, metadata in SQLite. Content is never stored in the DB.
- **SQLite via `better-sqlite3`** (not `node:sqlite` — drizzle-kit can't generate migrations for it). WAL mode; migrations run on boot in `lib/db/index.ts`, which is safe because the volume guarantees a single process.
- **Reads never mutate.** `readPaste`/`readPasteMetadata` are pure; `recordView` is the only view-counting write. This matters under Cache Components: a page body, its `generateMetadata`, and a prefetched shell each render in their own scope, so a write in the read path would double-count views and destroy burn-after-read pastes early. `ViewRecorder` in `app/[id]/page.tsx` calls `connection()` to pin the write to request time and wraps it in React `cache()` so the two PPR render passes collapse to one write. **Verify view counts after touching that file.**
- **Client-side encryption** uses Web Crypto API (AES-256-GCM + PBKDF2). The password/key never reaches the server.
- **Shiki** is used server-side for syntax highlighting (same engine as VS Code). The highlighter caps resident languages (`MAX_RESIDENT_LANGUAGES` in `lib/shiki.ts`) and recycles past it — grammars are never evicted by Shiki itself, and unbounded accumulation was measured at ~265MB RSS.
- **Rate limiting** is in-memory only (`lib/rate-limit.ts`). Correct here because the app is single-instance; counters reset on deploy.
- **Expired pastes** are reclaimed by an in-process janitor (`lib/janitor.ts`, started from `instrumentation.ts`), gated behind `JANITOR_ENABLED`. Reads already treat expired pastes as absent; the janitor is what actually deletes the row and the R2 object.
- **Cache Components + Partial Prefetching** are enabled. Nothing is cached without `'use cache'`. Routes are hidden with React `<Activity>` rather than unmounted, so client components must reset sensitive state in an effect cleanup (see `decrypt-form.tsx`, `paste-viewer.tsx`, `paste-form.tsx`). `runtime = 'edge'` is incompatible — do not reintroduce it.
- **Bot protection** uses honeypot fields, time-based detection, and JS challenges (no CAPTCHA).
- **View Transitions** via the native CSS `@view-transition` rule in `app/globals.css` (no JS library).
- **Dark mode** uses `class` strategy via `next-themes`. Pure black (#000000) for OLED optimization.
- **Path alias**: `@/*` maps to project root.

### Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_PATH` - SQLite file path (`/data/bin21.db` on Railway; defaults to `./.data/bin21.db`)
- `R2_*` - Cloudflare R2 credentials
- `NEXT_PUBLIC_APP_URL` - Public app URL for paste links
- `JANITOR_ENABLED` - set `true` only on the server; it deletes real R2 objects
- `ADMIN_TOKEN` - enables `/admin` analytics. Unset means the route 404s

### Design System

Colors: Primary Indigo (#6366F1), Secondary Violet (#8B5CF6), Accent Cyan (#22D3EE). Dark mode uses pure black (#000000) background. Fonts: Inter (UI), JetBrains Mono (code). All defined as CSS variables and Tailwind theme extensions in `app/globals.css`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
