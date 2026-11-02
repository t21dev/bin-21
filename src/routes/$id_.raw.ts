import { createFileRoute } from '@tanstack/react-router'
import { getRawContent } from '@/server/services/paste.service'

export const Route = createFileRoute('/$id_/raw')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const content = await getRawContent(params.id)

          if (content === null) {
            return Response.json({ error: 'Paste not found' }, { status: 404 })
          }

          return new Response(content, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=300',
            },
          })
        } catch {
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
