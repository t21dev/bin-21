'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPaste } from '@/server/actions/paste.actions'
import { CodeEditor } from './code-editor'
import { LanguageSelector } from './language-selector'
import { MarkdownPreview } from './markdown-preview'
import type { ExpiresIn } from '@/types'

const EXPIRY_OPTIONS: { value: ExpiresIn; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: '10m', label: '10 min' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1M', label: '1 month' },
]

export function PasteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('text')
  const [expiresIn, setExpiresIn] = useState<ExpiresIn>('never')
  const [burnAfter, setBurnAfter] = useState(false)
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [password, setPassword] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [formLoadTime] = useState(Date.now())

  // Honeypot
  const [honeypot, setHoneypot] = useState('')

  const isMarkdown = language === 'markdown'

  // Handle Ctrl+Enter to submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && content.trim()) {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, language, title, expiresIn, burnAfter, isEncrypted, password])

  async function encryptContent(plaintext: string, pass: string) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pass),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt)),
    }
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setError('')

    startTransition(async () => {
      try {
        let finalContent = content
        let encryptionIv: string | undefined
        let encryptionSalt: string | undefined

        if (isEncrypted && password) {
          const encrypted = await encryptContent(content, password)
          finalContent = encrypted.encrypted
          encryptionIv = encrypted.iv
          encryptionSalt = encrypted.salt
        }

        const result = await createPaste({
          content: finalContent,
          title: title || undefined,
          language,
          isEncrypted: isEncrypted && !!password,
          encryptionIv,
          encryptionSalt,
          expiresIn,
          burnAfter,
          _honeypot: honeypot || undefined,
          _timestamp: formLoadTime,
        })

        if (result.success && result.data) {
          router.push(`/${result.data.id}`)
        } else {
          setError(result.error || 'Failed to create paste')
        }
      } catch {
        setError('Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-primary"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelector value={language} onChange={setLanguage} />

        {isMarkdown && content && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-md px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        )}
      </div>

      {/* Editor / Preview */}
      {showPreview && isMarkdown ? (
        <MarkdownPreview content={content} />
      ) : (
        <CodeEditor
          value={content}
          onChange={setContent}
          language={language}
          placeholder={isMarkdown ? 'Write your Markdown here...' : 'Paste your code here...'}
        />
      )}

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Expiry */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Expires:</span>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value as ExpiresIn)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm outline-none"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Burn after reading */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={burnAfter}
            onChange={(e) => setBurnAfter(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-primary"
          />
          Burn after reading
        </label>

        {/* Encrypt */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-primary"
          />
          Encrypt
        </label>
      </div>

      {/* Password field */}
      {isEncrypted && (
        <input
          type="password"
          placeholder="Encryption password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-primary"
        />
      )}

      {/* Honeypot fields */}
      <div className="absolute -left-[9999px] h-0 overflow-hidden opacity-0" aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-black transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </>
          ) : (
            'Create Paste'
          )}
        </button>
        <span className="text-xs text-[var(--text-muted)]">
          Ctrl+Enter to submit
        </span>
      </div>
    </div>
  )
}
