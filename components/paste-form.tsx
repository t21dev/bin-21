'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createPaste } from '@/server/actions/paste.actions'
import { highlightAction } from '@/server/actions/highlight.actions'
import { CodeEditor } from './code-editor'
import { LanguageSelector } from './language-selector'
import { MarkdownPreview } from './markdown-preview'
import { ThemeSelector } from './theme-selector'
import type { ExpiresIn } from '@/types'
import type { ShikiThemeId } from '@/lib/shiki'

const EXPIRY_OPTIONS: { value: ExpiresIn; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: '10m', label: '10 min' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1M', label: '1 month' },
]

const pasteFormSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2_000_000, 'Content too large (max 2 million characters)'),
  title: z.string().max(255),
  language: z.string(),
  expiresIn: z.enum(['never', '10m', '1h', '1d', '1w', '1M']),
  burnAfter: z.boolean(),
  isEncrypted: z.boolean(),
  password: z.string(),
}).refine(
  (data) => !data.isEncrypted || data.password.length > 0,
  { message: 'Password is required when encryption is enabled', path: ['password'] }
)

type PasteFormValues = z.input<typeof pasteFormSchema>

export function PasteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<PasteFormValues>({
    resolver: zodResolver(pasteFormSchema),
    defaultValues: {
      content: '',
      title: '',
      language: 'text',
      expiresIn: 'never',
      burnAfter: false,
      isEncrypted: false,
      password: '',
    },
  })

  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<ShikiThemeId>('github-dark')
  const [serverError, setServerError] = useState('')
  const [formLoadTime] = useState(() => Date.now())
  const [honeypot, setHoneypot] = useState('')

  const content = watch('content')
  const language = watch('language')
  const isEncrypted = watch('isEncrypted')

  const isMarkdown = language === 'markdown'

  // Clear password and errors when encrypt is unchecked
  useEffect(() => {
    if (!isEncrypted) {
      setValue('password', '')
      clearErrors('password')
    }
  }, [isEncrypted, setValue, clearErrors])

  // Handle Ctrl+Enter to submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch preview when toggled on or theme changes
  useEffect(() => {
    if (!showPreview || isMarkdown || !content.trim()) return

    let cancelled = false
    setPreviewLoading(true)

    highlightAction(content, language, previewTheme).then((result) => {
      if (cancelled) return
      if ('html' in result) {
        setPreviewHtml(result.html)
      }
      setPreviewLoading(false)
    })

    return () => { cancelled = true }
  }, [showPreview, previewTheme, content, language, isMarkdown])

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

  async function onSubmit(data: PasteFormValues) {
    setServerError('')

    startTransition(async () => {
      try {
        let finalContent = data.content
        let encryptionIv: string | undefined
        let encryptionSalt: string | undefined

        if (data.isEncrypted && data.password) {
          const encrypted = await encryptContent(data.content, data.password)
          finalContent = encrypted.encrypted
          encryptionIv = encrypted.iv
          encryptionSalt = encrypted.salt
        }

        const result = await createPaste({
          content: finalContent,
          title: data.title || undefined,
          language: data.language,
          isEncrypted: data.isEncrypted,
          encryptionIv,
          encryptionSalt,
          expiresIn: data.expiresIn,
          burnAfter: data.burnAfter,
          _honeypot: honeypot || undefined,
          _timestamp: formLoadTime,
        })

        if (result.success && result.data) {
          router.push(`/${result.data.id}`)
        } else {
          setServerError(result.error || 'Failed to create paste')
        }
      } catch {
        setServerError('Something went wrong')
      }
    })
  }

  function handleTogglePreview() {
    setShowPreview(!showPreview)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <label htmlFor="paste-title" className="sr-only">Title</label>
      <input
        id="paste-title"
        type="text"
        placeholder="Title (optional)"
        {...register('title')}
        maxLength={255}
        autoComplete="off"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-primary"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <LanguageSelector value={field.value} onChange={field.onChange} />
          )}
        />

        {content && (
          <button
            type="button"
            onClick={handleTogglePreview}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              showPreview
                ? 'bg-primary/10 text-primary'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 inline-block" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        )}

        {showPreview && !isMarkdown && (
          <div className="ml-auto">
            <ThemeSelector value={previewTheme} onChange={setPreviewTheme} />
          </div>
        )}
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        isMarkdown ? (
          <MarkdownPreview content={content} />
        ) : previewLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Highlighting...
            </div>
          </div>
        ) : previewHtml ? (
          <div
            className="overflow-x-auto rounded-lg border border-[var(--border)]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        ) : (
          <pre className="min-h-[300px] overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-sm leading-relaxed">
            <code>{content}</code>
          </pre>
        )
      ) : (
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <CodeEditor
              value={field.value}
              onChange={field.onChange}
              language={language}
              placeholder={isMarkdown ? 'Write your Markdown here...' : 'Paste your code here...'}
            />
          )}
        />
      )}

      {/* Content error */}
      {errors.content && (
        <p className="text-sm text-error">{errors.content.message}</p>
      )}

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Expiry */}
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="paste-expiry" className="text-[var(--text-muted)]">Expires:</label>
          <select
            id="paste-expiry"
            {...register('expiresIn')}
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
            {...register('burnAfter')}
            className="h-4 w-4 rounded border-[var(--border)] accent-primary"
          />
          Burn after reading
        </label>

        {/* Encrypt */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register('isEncrypted')}
            className="h-4 w-4 rounded border-[var(--border)] accent-primary"
          />
          Encrypt
        </label>
      </div>

      {/* Password field */}
      {isEncrypted && (
        <div>
          <label htmlFor="paste-password" className="sr-only">Encryption password</label>
          <input
            id="paste-password"
            type="password"
            placeholder="Encryption password"
            {...register('password')}
            autoComplete="new-password"
            className={`w-full max-w-xs rounded-lg border bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-primary ${
              errors.password ? 'border-error' : 'border-[var(--border)]'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-error">{errors.password.message}</p>
          )}
        </div>
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

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-error">{serverError}</p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-black transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
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
    </form>
  )
}
