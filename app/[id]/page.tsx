import { notFound } from 'next/navigation'
import { getPaste } from '@/server/actions/paste.actions'
import { highlightCode } from '@/lib/shiki'
import { PasteViewer } from '@/components/paste-viewer'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const result = await getPaste(id)

  if (!result.success || !result.data) {
    return { title: 'Paste Not Found - Bin 21' }
  }

  const paste = result.data
  return {
    title: `${paste.title || 'Untitled'} - Bin 21`,
    description: paste.isEncrypted
      ? 'Encrypted paste on Bin 21'
      : `${paste.language} paste on Bin 21`,
  }
}

export default async function PastePage({ params }: PageProps) {
  const { id } = await params
  const result = await getPaste(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const paste = result.data

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PasteViewer paste={paste} highlightedHtml={highlightedHtml} />
    </div>
  )
}
