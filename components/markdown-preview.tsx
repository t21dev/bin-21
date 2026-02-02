'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
