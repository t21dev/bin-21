import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPastePage } from '@/server/actions/paste.actions'
import { PasteViewer } from '@/components/paste-viewer'
import { PasteSkeleton } from '@/components/paste-skeleton'
import { PasteError } from '@/components/route-states'
import { absoluteUrl, ogImageMeta } from '@/lib/seo'

export const Route = createFileRoute('/$id')({
  // A preload (hover/focus on a link) must not record a view: that would count
  // views nobody made and burn burn-after-read pastes early. `preload` is true
  // only for those speculative loads.
  loader: async ({ params, preload }) => {
    const data = await getPastePage({ data: { id: params.id, record: !preload } })
    if (!data) throw notFound()
    return data
  },
  // Every real visit is a view: never serve a cached result for a navigation.
  staleTime: 0,
  gcTime: 0,
  preloadStaleTime: 0,
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: 'Paste Not Found - Bin 21' }, { name: 'robots', content: 'noindex' }] }
    }
    const { paste } = loaderData
    const title = `${paste.title || 'Untitled'} - Bin 21`
    const description = paste.isEncrypted ? 'Encrypted paste on Bin 21' : `${paste.language} paste on Bin 21`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:site_name', content: 'Bin 21' },
        { property: 'og:type', content: 'article' },
        ...ogImageMeta('og', absoluteUrl(`/${params.id}/opengraph-image`), 'Bin 21 Paste'),
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        ...ogImageMeta('twitter', absoluteUrl(`/${params.id}/twitter-image`), 'Bin 21 Paste'),
      ],
    }
  },
  pendingComponent: () => (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PasteSkeleton />
    </div>
  ),
  errorComponent: PasteError,
  component: PastePage,
})

function PastePage() {
  const { paste, highlightedHtml } = Route.useLoaderData()
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PasteViewer key={paste.id} paste={paste} highlightedHtml={highlightedHtml} />
    </div>
  )
}
