/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ServiceWorkerRegister } from '@/components/sw-register'
import { CommandMenu } from '@/components/command-menu'
import { RouteProgress } from '@/components/route-progress'
import { absoluteUrl, ogImageMeta } from '@/lib/seo'
import appCss from '../styles.css?url'

const TITLE = 'Bin 21 - Modern Pastebin'
const DESCRIPTION =
  'A modern, privacy-focused pastebin. Share code and text instantly with 150+ language syntax highlighting, Markdown support, and client-side encryption.'
const SHARE_DESCRIPTION =
  'Share code and text instantly with syntax highlighting, Markdown support, and client-side encryption.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'keywords', content: 'pastebin,code sharing,paste,snippet,markdown,encrypted' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Bin 21' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: SHARE_DESCRIPTION },
      { property: 'og:site_name', content: 'Bin 21' },
      { property: 'og:type', content: 'website' },
      ...ogImageMeta('og', absoluteUrl('/opengraph-image'), TITLE),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: SHARE_DESCRIPTION },
      ...ogImageMeta('twitter', absoluteUrl('/twitter-image'), TITLE),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Two theme-color tags share a name, and HeadContent de-duplicates by
            name, so these are rendered directly. */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <HeadContent />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <ThemeProvider>
      <RouteProgress />
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <CommandMenu />
      <ServiceWorkerRegister />
    </ThemeProvider>
  )
}
