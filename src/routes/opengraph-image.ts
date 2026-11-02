import { createFileRoute } from '@tanstack/react-router'
import { homeOgImage } from '@/lib/og/home-og'

export const Route = createFileRoute('/opengraph-image')({
  server: {
    handlers: {
      GET: async () => {
        const res = await homeOgImage()
        res.headers.set('Cache-Control', 'public, max-age=86400')
        return res
      },
    },
  },
})
