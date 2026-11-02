import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Clock, Database, Download, Eye, FileCode2, FileText, Flame, Link2, Lock, Plus, Share2 } from 'lucide-react'
import { DecryptForm } from './decrypt-form'
import { MarkdownPreview } from './markdown-preview'
import { ThemeSelector } from './theme-selector'
import { CopyButton, Dock, Panel } from './ui-kit'
import { highlightAction } from '@/server/actions/highlight.actions'
import { getLanguageName, getLanguageExtension } from '@/lib/languages'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import { absoluteUrl } from '@/lib/seo'
import type { PasteWithContent } from '@/types'
import type { ShikiThemeId } from '@/lib/shiki-themes'

interface PasteViewerProps {
  paste: PasteWithContent
  highlightedHtml?: string
  initialTheme?: ShikiThemeId
}

function expiresShort(date: Date | null): string {
  if (!date) return 'Never'
  const ms = date.getTime() - Date.now()
  if (ms <= 0) return 'Now'
  const m = Math.round(ms / 60000)
  if (m < 60) return `${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h`
  return `${Math.round(h / 24)} d`
}

export function PasteViewer({ paste, highlightedHtml, initialTheme = 'github-dark' }: PasteViewerProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [theme, setTheme] = useState<ShikiThemeId>(initialTheme)
  const [reHighlightedHtml, setReHighlightedHtml] = useState<string | null>(null)
  const [themeLoading, setThemeLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [shared, setShared] = useState(false)
  const requestId = useRef(0)
  const navigate = useNavigate()

  // N starts a new paste (when not typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey || el.closest('input, textarea, select, [contenteditable]')) return
      navigate({ to: '/' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  // Drop decrypted plaintext when leaving the page, so it never lingers.
  useEffect(() => {
    return () => {
      setDecryptedContent(null)
      setReHighlightedHtml(null)
    }
  }, [])

  const displayContent = decryptedContent ?? paste.content
  const needsDecryption = paste.isEncrypted && !decryptedContent
  const isMarkdown = paste.language === 'markdown'
  const showThemeSelector = !needsDecryption && !isMarkdown
  const lines = needsDecryption ? null : displayContent.split('\n').length

  const isInitialState = theme === initialTheme && !decryptedContent
  const currentHtml = isInitialState ? (highlightedHtml ?? '') : (reHighlightedHtml ?? '')

  function fetchHighlight(code: string, lang: string, themeId: ShikiThemeId) {
    const id = ++requestId.current
    setThemeLoading(true)
    highlightAction({ data: { code, language: lang, theme: themeId } }).then((result) => {
      if (requestId.current !== id) return
      if ('html' in result) setReHighlightedHtml(result.html)
      setThemeLoading(false)
    })
  }

  function handleThemeChange(newTheme: ShikiThemeId) {
    setTheme(newTheme)
    if (newTheme === initialTheme && !decryptedContent) return
    const code = decryptedContent ?? paste.content
    if (code && !isMarkdown) fetchHighlight(code, paste.language, newTheme)
  }

  function handleDecrypted(content: string) {
    setDecryptedContent(content)
    if (!isMarkdown) fetchHighlight(content, paste.language, theme)
  }

  function handleDownload() {
    const slug =
      (paste.title || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || paste.id

    const blob = new Blob([displayContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slug}${getLanguageExtension(paste.language)}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: paste.title || 'Untitled Paste', url })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    await navigator.clipboard.writeText(url)
    setShared(true)
    setTimeout(() => setShared(false), 1400)
  }

  // Same on server and client, so hydration matches.
  const shareUrl = absoluteUrl(`/${paste.id}`).replace(/^https?:\/\//, '')
  const stats = [
    { icon: <Eye />, label: 'Views', value: String(paste.viewCount) },
    { icon: <Clock />, label: 'Expires', value: expiresShort(paste.expiresAt) },
    { icon: <Database />, label: 'Size', value: formatBytes(paste.sizeBytes) },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_288px] md:items-start">
      {/* ---------- Content card ---------- */}
      <section className="card vt-card flex min-w-0 flex-col overflow-clip">
        <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 rounded-t-[14px] bg-[var(--surface)] flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
          <FileCode2 className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{paste.title || 'Untitled paste'}</h1>
          {paste.isEncrypted && <span className="chip"><Lock />Encrypted</span>}
          {paste.burnAfter && <span className="chip chip-warn"><Flame /><span className="hidden sm:inline">Burns after reading</span></span>}
          <span className="chip chip-accent">{getLanguageName(paste.language)}</span>
        </header>

        {/* KPI strip: phones only (the side panel carries these on desktop) */}
        <div className="grid grid-cols-3 border-b border-[var(--border)] md:hidden">
          {stats.map((s, i) => (
            <div key={s.label} className={`grid gap-px px-3 py-2 ${i > 0 ? 'border-l border-[var(--border)]' : ''}`}>
              <small className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)] [&>svg]:h-3 [&>svg]:w-3">{s.icon}{s.label}</small>
              <b className="truncate text-sm font-medium tabular-nums">{s.value}</b>
            </div>
          ))}
        </div>

        <div className="relative flex min-h-[260px] flex-1 flex-col">
          {needsDecryption ? (
            <DecryptForm encryptedContent={paste.content} iv={paste.encryptionIv!} salt={paste.encryptionSalt!} onDecrypted={handleDecrypted} />
          ) : isMarkdown ? (
            <div className="p-3 sm:p-4"><MarkdownPreview content={displayContent} /></div>
          ) : currentHtml ? (
            <div className={`animate-fade-in transition-opacity duration-200 ${themeLoading ? 'opacity-50' : ''}`} dangerouslySetInnerHTML={{ __html: currentHtml }} />
          ) : themeLoading ? (
            <div className="grid gap-2.5 p-4" aria-label="Highlighting">
              {[72, 48, 86, 60, 38, 78].map((w, i) => <div key={i} className="skel h-3.5" style={{ width: `${w}%` }} />)}
            </div>
          ) : (
            <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.75] max-md:whitespace-pre-wrap"><code>{displayContent}</code></pre>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2 font-mono text-[11.5px] text-[var(--text-faint)] tabular-nums">
          <span>{lines !== null ? `${lines} ${lines === 1 ? 'line' : 'lines'} · ` : ''}{formatBytes(paste.sizeBytes)}</span>
          <span>Created {formatRelativeTime(paste.createdAt)}</span>
        </footer>
      </section>

      {/* ---------- Side panel (desktop) / share sheet (phones) ---------- */}
      <Panel open={sheetOpen} onClose={() => setSheetOpen(false)} label="Paste details">
        <div className="grid gap-2">
          <span className="field-label"><Link2 />Share link</span>
          <div className="flex overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
            <code className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-xs text-[var(--text-muted)]">{shareUrl}</code>
            <CopyButton
              label="Copy share link"
              text={() => window.location.href}
              className="grid w-11 place-items-center border-l border-[var(--border)] bg-[var(--accent-wash)] text-[var(--accent-text)] transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
            />
          </div>
        </div>

        <div className="hidden grid-cols-3 gap-2 md:grid">
          {stats.map((s) => (
            <div key={s.label} className="grid min-w-0 gap-0.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2">
              <small className="flex items-center gap-1 text-[11px] text-[var(--text-faint)] [&>svg]:h-3 [&>svg]:w-3">{s.icon}{s.label}</small>
              <b className="truncate text-[15px] font-medium tabular-nums">{s.value}</b>
            </div>
          ))}
        </div>

        {showThemeSelector && (
          <div className="grid gap-2">
            <span className="field-label">Highlight theme</span>
            <ThemeSelector id="viewer-theme" block value={theme} onChange={handleThemeChange} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <a href={`/${paste.id}/raw`} className="btn h-auto flex-col gap-1 py-2.5 text-xs text-[var(--text-muted)] [&>svg]:text-[var(--text)]" aria-label="View raw paste content">
            <FileText />Raw
          </a>
          <CopyButton label="Copy paste content" text={() => displayContent} disabled={needsDecryption} className="btn h-auto flex-col gap-1 py-2.5 text-xs text-[var(--text-muted)]">
            Copy
          </CopyButton>
          <button type="button" onClick={handleDownload} disabled={needsDecryption} className="btn h-auto flex-col gap-1 py-2.5 text-xs text-[var(--text-muted)] [&>svg]:text-[var(--text)]" aria-label="Download paste content">
            <Download />Download
          </button>
        </div>

        {paste.burnAfter && (
          <p className="flex items-start gap-2 rounded-[10px] border border-dashed border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--text-muted)]">
            <Flame className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
            This paste is deleted after it has been opened once more. Share the link with one person.
          </p>
        )}

        <button type="button" onClick={handleShare} className="btn min-h-11 w-full md:hidden" data-done={shared}>
          <Share2 />{shared ? 'Link copied' : 'Share via…'}
        </button>

        <Link to="/" className="btn btn-primary hidden min-h-11 w-full md:inline-flex">
          <Plus />New paste<span className="kbd ml-auto">N</span>
        </Link>
      </Panel>

      {/* ---------- Phone dock ---------- */}
      <Dock>
        <CopyButton label="Copy paste content" text={() => displayContent} disabled={needsDecryption} className="btn btn-icon" />
        <a href={`/${paste.id}/raw`} className="btn btn-icon" aria-label="View raw paste content"><FileText /></a>
        <button type="button" onClick={handleDownload} disabled={needsDecryption} className="btn btn-icon" aria-label="Download paste content"><Download /></button>
        <button type="button" onClick={() => setSheetOpen(true)} className="btn flex-1" aria-label="Share and details">
          <Share2 />Share
        </button>
        <Link to="/" className="btn btn-primary flex-1"><Plus />New</Link>
      </Dock>
    </div>
  )
}
