import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { nitro } from 'nitro/vite'

export default defineConfig(({ mode }) => {
  // Make .env visible to server code in dev (`process.env.R2_*`, DATABASE_PATH…).
  // Production reads the real environment; nothing here is baked into the build
  // except the public app URL below.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) process.env[k] ??= v

  return {
    server: { port: 3000 },
    // The public URL is used for absolute OG/Twitter image URLs in <head>, which
    // render on both server and client. Kept under its old Next.js name so the
    // Railway variable doesn't need renaming.
    define: {
      'import.meta.env.NEXT_PUBLIC_APP_URL': JSON.stringify(env.NEXT_PUBLIC_APP_URL || 'https://bin21.dev'),
    },
    plugins: [
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart(),
      nitro({
        // Keep these as real node_modules instead of bundling them (the same
        // reason next.config.ts had serverExternalPackages):
        // - shiki loads each grammar on demand; bundled, all ~300 grammars land
        //   in one 8MB module that is parsed in full on the first highlight.
        // - better-sqlite3 is a native addon; @vercel/og reads its font and
        //   wasm files from its own package directory.
        traceDeps: ['shiki*', 'better-sqlite3*', '@vercel/og*'],
      }),
      // React's plugin must come after Start's.
      viteReact(),
    ],
  }
})
