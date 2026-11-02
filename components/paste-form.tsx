import { useState, useEffect, useTransition, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock, Code2, Eye, FileCode2, Flame, KeyRound, Lock, PencilLine, Plus, SlidersHorizontal } from 'lucide-react'
import { createPaste } from '@/server/actions/paste.actions'
import { highlightAction } from '@/server/actions/highlight.actions'
import { getLanguageName } from '@/lib/languages'
import { formatBytes } from '@/lib/utils'
import { CodeEditor } from './code-editor'
import { LanguageSelector } from './language-selector'
import { MarkdownPreview } from './markdown-preview'
import { ThemeSelector } from './theme-selector'
import { Dock, Panel, Segmented, SwitchRow } from './ui-kit'
import type { ExpiresIn } from '@/types'
import type { ShikiThemeId } from '@/lib/shiki-themes'

const EXPIRY_OPTIONS: { value: ExpiresIn; label: string; title: string }[] = [
  { value: '10m', label: '10m', title: '10 minutes' },
  { value: '1h', label: '1h', title: '1 hour' },
  { value: '1d', label: '1d', title: '1 day' },
  { value: '1w', label: '1w', title: '1 week' },
  { value: '1M', label: '1M', title: '1 month' },
  { value: 'never', label: '∞', title: 'Never' },
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

async function encryptContent(plaintext: string, pass: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(pass), 'PBKDF2', false, ['deriveKey'])

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

export function PasteForm() {
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setFocus,
    reset,
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
  const [sheetOpen, setSheetOpen] = useState(false)

  const content = watch('content')
  const language = watch('language')
  const isEncrypted = watch('isEncrypted')
  const burnAfter = watch('burnAfter')
  const expiresIn = watch('expiresIn')

  const isMarkdown = language === 'markdown'
  const lines = content ? content.split('\n').length : 0
  const bytes = content ? new TextEncoder().encode(content).length : 0

  // Clear password and errors when encrypt is unchecked
  useEffect(() => {
    if (!isEncrypted) {
      setValue('password', '')
      clearErrors('password')
    }
  }, [isEncrypted, setValue, clearErrors])

  // Ctrl/⌘+Enter submits
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch the highlighted preview when toggled on or the theme changes
  useEffect(() => {
    if (!showPreview || isMarkdown || !content.trim()) return

    let cancelled = false
    setPreviewLoading(true)

    highlightAction({ data: { code: content, language, theme: previewTheme } }).then((result) => {
      if (cancelled) return
      if ('html' in result) setPreviewHtml(result.html)
      setPreviewLoading(false)
    })

    return () => { cancelled = true }
  }, [showPreview, previewTheme, content, language, isMarkdown])

  function onSubmit(data: PasteFormValues) {
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

        const result = await createPaste({ data: {
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
        } })

        if (result.success && result.data) {
          // Clear the form (including the password) before leaving, so going
          // back never redisplays the paste or its encryption password.
          reset()
          setShowPreview(false)
          setPreviewHtml('')
          setServerError('')
          setSheetOpen(false)
          navigate({ to: '/$id', params: { id: result.data.id } })
        } else {
          setServerError(result.error || 'Failed to create paste')
        }
      } catch {
        setServerError('Something went wrong. Check your connection and try again.')
      }
    })
  }

  // Validation errors for fields that live in the sheet must be visible on phones.
  function onInvalid(errs: typeof errors) {
    if (errs.password) {
      setSheetOpen(true)
      setTimeout(() => setFocus('password'), 320)
    }
  }

  const expiryLabel = EXPIRY_OPTIONS.find((o) => o.value === expiresIn)?.label ?? '∞'
  const langLabel = getLanguageName(language)

  const createButton = (className: string) => (
    <button type="submit" disabled={isPending} className={`btn btn-primary ${className}`}>
      {isPending ? <span className="spinner" aria-hidden="true" /> : <Plus />}
      <span>{isPending ? 'Creating…' : 'Create paste'}</span>
      <span className="kbd ml-auto hidden md:inline">⌘↵</span>
    </button>
  )

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_288px] md:items-start">
      {/* ---------- Editor card ---------- */}
      <section className="card card-focus vt-card flex min-w-0 flex-col overflow-clip">
        <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 rounded-t-[14px] bg-[var(--surface)] flex items-center gap-2 border-b border-[var(--border)] py-1.5 pr-1.5 pl-3">
          <FileCode2 className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />
          <label htmlFor="paste-title" className="sr-only">Title</label>
          <input
            id="paste-title"
            type="text"
            placeholder="Untitled paste"
            {...register('title')}
            maxLength={255}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base font-medium outline-none focus-visible:outline-none placeholder:font-normal placeholder:text-[var(--text-faint)] md:text-sm"
          />
          <span className="chip hidden sm:inline-flex">{langLabel}</span>
          <div className="seg w-[5.5rem] shrink-0 [&_button]:min-h-7" role="group" aria-label="Editor mode">
            <span aria-hidden="true" className="seg-thumb" style={{ width: 'calc((100% - 6px) / 2)', transform: `translateX(${showPreview ? 100 : 0}%)` }} />
            <button type="button" aria-pressed={!showPreview} aria-label="Edit" onClick={() => setShowPreview(false)} className="grid place-items-center">
              <PencilLine className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-pressed={showPreview} aria-label="Preview" disabled={!content} onClick={() => setShowPreview(true)} className="grid place-items-center disabled:opacity-40">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {showPreview ? (
          <div className="min-h-[300px] flex-1 animate-fade-in md:min-h-[440px]">
            {isMarkdown ? (
              <div className="p-3"><MarkdownPreview content={content} /></div>
            ) : previewLoading && !previewHtml ? (
              <div className="grid gap-2.5 p-4" aria-label="Highlighting">
                {[72, 48, 86, 60, 38, 78].map((w, i) => <div key={i} className="skel h-3.5" style={{ width: `${w}%` }} />)}
              </div>
            ) : previewHtml ? (
              <div className={`transition-opacity duration-200 ${previewLoading ? 'opacity-50' : ''}`} dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <pre className="p-4 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap"><code>{content}</code></pre>
            )}
          </div>
        ) : (
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <CodeEditor
                value={field.value}
                onChange={field.onChange}
                language={language}
                placeholder={isMarkdown ? 'Write your Markdown here…' : 'Paste your code here…'}
              />
            )}
          />
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2 font-mono text-[11.5px] text-[var(--text-faint)] tabular-nums">
          <span>{content ? `${lines} ${lines === 1 ? 'line' : 'lines'} · ${formatBytes(bytes)}` : 'Empty'}</span>
          {showPreview && !isMarkdown ? (
            <ThemeSelector value={previewTheme} onChange={setPreviewTheme} />
          ) : (
            <span className="hidden md:inline">Tab indents · ⌘↵ creates</span>
          )}
        </footer>
      </section>

      {errors.content && <p role="alert" className="-mt-2 text-sm text-error md:col-start-1">{errors.content.message}</p>}

      {/* ---------- Options: side rail on desktop, bottom sheet on phones ---------- */}
      <Panel open={sheetOpen} onClose={() => setSheetOpen(false)} label="Paste options">
        <div className="grid gap-2">
          <span className="field-label"><Code2 />Language</span>
          <Controller
            name="language"
            control={control}
            render={({ field }) => <LanguageSelector value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div className="grid gap-2">
          <span className="field-label"><Clock />Expires after</span>
          <Controller
            name="expiresIn"
            control={control}
            render={({ field }) => (
              <Segmented label="Expires after" options={EXPIRY_OPTIONS} value={field.value as ExpiresIn} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="grid">
          <SwitchRow id="burn-after" checked={burnAfter} onChange={(v) => setValue('burnAfter', v)} icon={<Flame />}>
            Burn after reading
          </SwitchRow>
          <SwitchRow id="encrypt" checked={isEncrypted} onChange={(v) => setValue('isEncrypted', v)} icon={<Lock />}>
            Encrypt in browser
          </SwitchRow>
          <div className="reveal" data-open={isEncrypted}>
            <div>
              <label htmlFor="paste-password" className="sr-only">Encryption password</label>
              <div className="relative mt-3">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  id="paste-password"
                  type="password"
                  placeholder="Password"
                  {...register('password')}
                  autoComplete="new-password"
                  tabIndex={isEncrypted ? 0 : -1}
                  aria-invalid={!!errors.password}
                  className="input pl-9 text-base md:text-sm"
                />
              </div>
              {errors.password ? (
                <p role="alert" className="mt-1.5 text-xs text-error">{errors.password.message}</p>
              ) : (
                <p className="mt-1.5 text-xs text-[var(--text-faint)]">AES-256 in your browser. The password never reaches the server.</p>
              )}
            </div>
          </div>
        </div>

        {serverError && <p role="alert" className="text-sm text-error">{serverError}</p>}

        {createButton('hidden min-h-11 w-full md:inline-flex')}
      </Panel>

      {/* Honeypot: invisible to people, filled by naive bots */}
      <div className="absolute -left-[9999px] h-0 overflow-hidden opacity-0" aria-hidden="true">
        <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      {/* ---------- Phone dock: a direct child of the form so it sticks for the form's full height ---------- */}
      {serverError && <p role="alert" className="text-sm text-error md:hidden">{serverError}</p>}
      <Dock>
        <button type="button" className="btn shrink-0 font-mono text-xs text-[var(--text-muted)]" onClick={() => setSheetOpen(true)} aria-label="Paste options">
          <SlidersHorizontal />
          <span className="max-w-[6.5rem] truncate">{langLabel} · {expiryLabel}</span>
          {(isEncrypted || burnAfter) && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />}
        </button>
        {createButton('flex-1')}
      </Dock>
    </form>
  )
}
