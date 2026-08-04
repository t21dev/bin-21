import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // shiki and better-sqlite3 must not be bundled: shiki loads grammars at
  // runtime, better-sqlite3 is a native .node addon.
  serverExternalPackages: ['shiki', 'better-sqlite3'],

  // Instant Navigations (Next.js 16.3). Nothing is cached unless it opts in with
  // 'use cache', and links prefetch a prerendered shell for instant navigation.
  cacheComponents: true,
  partialPrefetching: true,
}

export default nextConfig
