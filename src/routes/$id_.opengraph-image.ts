import { createFileRoute } from '@tanstack/react-router'
import { pasteOgImage } from '@/lib/og/paste-og'

export const Route = createFileRoute('/$id_/opengraph-image')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const res = await pasteOgImage(params.id)
        res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
        return res
      },
    },
  },
})
