import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownPreviewProps {
  content: string
}

/** Rendered Markdown. The surrounding card provides the border and surface. */
export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none px-1 py-2 sm:px-2 prose-headings:text-[var(--text)] prose-headings:tracking-tight prose-p:text-[var(--text)] prose-strong:text-[var(--text)] prose-a:text-[var(--accent-text)] prose-a:no-underline hover:prose-a:underline prose-code:text-[var(--accent-text)] prose-pre:bg-[var(--surface-2)] prose-pre:border prose-pre:border-[var(--border)] prose-blockquote:border-[var(--accent)] prose-hr:border-[var(--border)] prose-th:text-[var(--text)] prose-td:text-[var(--text)] prose-li:text-[var(--text)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
