import { createFileRoute } from '@tanstack/react-router'

const manifest = {
  name: 'Bin 21',
  short_name: 'Bin21',
  description: 'A modern, privacy-focused pastebin with syntax highlighting, Markdown support, and client-side encryption.',
  start_url: '/',
  display: 'standalone',
  orientation: 'any',
  theme_color: '#000000',
  background_color: '#000000',
  categories: ['developer-tools', 'utilities'],
  icons: [
    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

export const Route = createFileRoute('/manifest.webmanifest')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(manifest), {
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=86400',
          },
        }),
    },
  },
})
