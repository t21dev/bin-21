import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
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
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
