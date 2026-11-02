// Absolute URLs for <head> tags. The base is fixed at build time (see
// vite.config.ts) so server and client render identical tags.
const APP_URL = (import.meta.env.NEXT_PUBLIC_APP_URL as string).replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** og:image / twitter:image tag group, matching what Next's metadata routes emitted. */
export function ogImageMeta(kind: 'og' | 'twitter', url: string, alt: string) {
  if (kind === 'og') {
    return [
      { property: 'og:image', content: url },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: alt },
    ]
  }
  return [
    { name: 'twitter:image', content: url },
    { name: 'twitter:image:alt', content: alt },
    { name: 'twitter:image:type', content: 'image/png' },
    { name: 'twitter:image:width', content: '1200' },
    { name: 'twitter:image:height', content: '630' },
  ]
}
