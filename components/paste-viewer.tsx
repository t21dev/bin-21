'use client'

import { useState, useRef } from 'react'
import { DecryptForm } from './decrypt-form'
import { MarkdownPreview } from './markdown-preview'
import { ThemeSelector } from './theme-selector'
import { highlightAction } from '@/server/actions/highlight.actions'
import { getLanguageName } from '@/lib/languages'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import type { PasteWithContent } from '@/types'
import type { ShikiThemeId } from '@/lib/shiki'

interface PasteViewerProps {
  paste: PasteWithContent
  highlightedHtml?: string
  initialTheme?: ShikiThemeId
}

export function PasteViewer({ paste, highlightedHtml, initialTheme = 'github-dark' }: PasteViewerProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareLabel, setShareLabel] = useState('Share')
  const [theme, setTheme] = useState<ShikiThemeId>(initialTheme)
  const [reHighlightedHtml, setReHighlightedHtml] = useState<string | null>(null)
  const [themeLoading, setThemeLoading] = useState(false)
  const requestId = useRef(0)

  const displayContent = decryptedContent ?? paste.content
  const needsDecryption = paste.isEncrypted && !decryptedContent
  const showThemeSelector = !needsDecryption && paste.language !== 'markdown'

  const isInitialState = theme === initialTheme && !decryptedContent
  const currentHtml = isInitialState ? (highlightedHtml ?? '') : (reHighlightedHtml ?? '')

  function fetchHighlight(code: string, lang: string, themeId: ShikiThemeId) {
    const id = ++requestId.current
    setThemeLoading(true)
    highlightAction(code, lang, themeId).then((result) => {
      if (requestId.current !== id) return
      if ('html' in result) setReHighlightedHtml(result.html)
      setThemeLoading(false)
    })
  }

  function handleThemeChange(newTheme: ShikiThemeId) {
    setTheme(newTheme)
    if (newTheme === initialTheme && !decryptedContent) return
    const code = decryptedContent ?? paste.content
    if (code && paste.language !== 'markdown') {
      fetchHighlight(code, paste.language, newTheme)
    }
  }

  function handleDecrypted(content: string) {
    setDecryptedContent(content)
    if (paste.language !== 'markdown') {
      fetchHighlight(content, paste.language, theme)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setShareLabel('Copied URL!')
    setTimeout(() => setShareLabel('Share'), 2000)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold sm:text-xl">
            {paste.title || 'Untitled Paste'}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] sm:gap-3 sm:text-sm">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {getLanguageName(paste.language)}
            </span>
            {paste.createdAt && (
              <span>{formatRelativeTime(paste.createdAt)}</span>
            )}
            <span>{formatBytes(paste.sizeBytes)}</span>
            <span className="tabular-nums">{paste.viewCount} views</span>
            {paste.burnAfter && (
              <span className="inline-flex items-center gap-1 text-warning">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 23c-3.6 0-8-3.1-8-8.5C4 9 12 1 12 1s8 8 8 14.5c0 5.4-4.4 8.5-8 8.5z"/>
                </svg>
                <span className="hidden sm:inline">Burns after reading</span>
                <span className="sm:hidden">Burns</span>
              </span>
            )}
            {paste.isEncrypted && (
              <span className="inline-flex items-center gap-1 text-accent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Encrypted
              </span>
            )}
            {paste.expiresAt && (
              <span className="text-muted">
                Expires {formatRelativeTime(paste.expiresAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 gap-2 sm:flex-none">
            <button
              onClick={handleShare}
              aria-label="Copy share URL"
              className="flex h-10 min-w-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm transition-colors hover:border-primary sm:flex-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {shareLabel}
            </button>
            <button
              onClick={handleCopy}
              disabled={needsDecryption}
              aria-label="Copy paste content"
              className="flex h-10 min-w-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <a
              href={`/${paste.id}/raw`}
              aria-label="View raw paste content"
              className="flex h-10 min-w-[44px] flex-1 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm transition-colors hover:border-primary sm:flex-none"
            >
              Raw
            </a>
          </div>
          {showThemeSelector && (
            <div className="sm:ml-auto">
              <ThemeSelector value={theme} onChange={handleThemeChange} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {needsDecryption ? (
        <DecryptForm
          encryptedContent={paste.content}
          iv={paste.encryptionIv!}
          salt={paste.encryptionSalt!}
          onDecrypted={handleDecrypted}
        />
      ) : paste.language === 'markdown' && !paste.isEncrypted ? (
        <MarkdownPreview content={displayContent} />
      ) : themeLoading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Applying theme...
          </div>
        </div>
      ) : currentHtml ? (
        <div
          className="overflow-x-auto rounded-lg border border-[var(--border)]"
          dangerouslySetInnerHTML={{ __html: currentHtml }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-sm leading-relaxed">
          <code>{displayContent}</code>
        </pre>
      )}
    </div>
  )
}
