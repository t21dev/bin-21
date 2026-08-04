import { Suspense, cache } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { readPaste, readPasteMetadata, recordView } from '@/server/services/paste.service'
import { highlightCode } from '@/lib/shiki'
import { PasteViewer } from '@/components/paste-viewer'
import { PasteSkeleton } from '@/components/paste-skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const paste = await readPasteMetadata(id)

  if (!paste) {
    return { title: 'Paste Not Found - Bin 21' }
  }

  const title = `${paste.title || 'Untitled'} - Bin 21`
  const description = paste.isEncrypted
    ? 'Encrypted paste on Bin 21'
    : `${paste.language} paste on Bin 21`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Bin 21',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// `params` is awaited inside the Suspense boundary, not here, so Next.js can
// prerender a static shell for this route even though the id is unknown.
export default function PastePage({ params }: PageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Suspense fallback={<PasteSkeleton />}>
        <Paste params={params} />
      </Suspense>
    </div>
  )
}

async function Paste({ params }: PageProps) {
  const { id } = await params
  const paste = await readPaste(id)

  if (!paste) {
    notFound()
  }

  // Server-side syntax highlighting (skip for encrypted/markdown)
  let highlightedHtml: string | undefined
  if (!paste.isEncrypted && paste.language !== 'markdown') {
    try {
      highlightedHtml = await highlightCode(paste.content, paste.language)
    } catch {
      // Fall back to plain text
    }
  }

  return (
    <>
      <PasteViewer
        // readPaste is pure, so the count excludes the view being served now.
        paste={{ ...paste, viewCount: paste.viewCount + 1 }}
        highlightedHtml={highlightedHtml}
      />
      <ViewRecorder id={id} />
    </>
  )
}

/**
 * The single place a view is recorded. `connection()` pins this to request time,
 * so it can never fire during a prerender or a link prefetch — which would
 * otherwise inflate counts and burn burn-after-read pastes prematurely.
 */
const recordViewOnce = cache(recordView)

async function ViewRecorder({ id }: { id: string }) {
  await connection()
  await recordViewOnce(id)
  return null
}
