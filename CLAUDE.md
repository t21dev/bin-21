# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bin 21 is a modern, privacy-focused pastebin service built with Next.js 16, TypeScript, and Tailwind CSS 4. It supports 150+ language syntax highlighting via Shiki, Markdown rendering with GFM, client-side AES-256-GCM encryption for private pastes, and stores paste content in Cloudflare R2 with metadata in PostgreSQL via Drizzle ORM.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
npm run db:push  # Push Drizzle schema to database
npm run db:generate  # Generate Drizzle migrations
```

## Architecture

### Folder Structure Pattern: server/ with actions + services

- **`server/actions/`** - Next.js Server Actions (entry points for mutations). Actions handle validation (Zod), call services, and return results.
- **`server/services/`** - Core business logic. Services are pure functions that handle DB queries, R2 storage, and data processing. Actions call services, never the other way around.
- **`lib/`** - Shared utilities (DB client, Shiki highlighter, rate limiter, language list, ID generator).
- **`lib/db/`** - Drizzle ORM schema and database client.
- **`components/`** - React components. Client components use `'use client'` directive.
- **`app/`** - Next.js App Router pages using route groups.
- **`types/`** - Shared TypeScript types.

### Data Flow

1. User submits paste form (client component)
2. Server Action (`server/actions/paste.actions.ts`) validates with Zod
3. Service (`server/services/paste.service.ts`) generates ID, uploads content to R2, saves metadata to PostgreSQL
4. Returns paste ID to client for redirect

### Key Technical Decisions

- **Paste content stored in Cloudflare R2**, metadata in PostgreSQL. Content is never stored in the DB.
- **Client-side encryption** uses Web Crypto API (AES-256-GCM + PBKDF2). The password/key never reaches the server.
- **Shiki** is used server-side for syntax highlighting (same engine as VS Code).
- **Rate limiting** uses Upstash Redis with in-memory fallback when Redis is unavailable.
- **Bot protection** uses honeypot fields, time-based detection, and JS challenges (no CAPTCHA).
- **View Transitions** API via `next/view-transitions` for smooth page navigation.
- **Dark mode** uses `class` strategy via `next-themes`. Pure black (#000000) for OLED optimization.
- **Path alias**: `@/*` maps to project root.

### Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_URL` - PostgreSQL connection string
- `R2_*` - Cloudflare R2 credentials
- `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` - Rate limiting (optional, falls back to in-memory)
- `NEXT_PUBLIC_APP_URL` - Public app URL for paste links

### Design System

Colors: Primary Indigo (#6366F1), Secondary Violet (#8B5CF6), Accent Cyan (#22D3EE). Dark mode uses pure black (#000000) background. Fonts: Inter (UI), JetBrains Mono (code). All defined as CSS variables and Tailwind theme extensions in `app/globals.css`.
