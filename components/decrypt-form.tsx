import { useEffect, useRef, useState } from 'react'
import { KeyRound, LockKeyhole, Unlock } from 'lucide-react'

interface DecryptFormProps {
  encryptedContent: string
  iv: string
  salt: string
  onDecrypted: (content: string) => void
}

export function DecryptForm({ encryptedContent, iv, salt, onDecrypted }: DecryptFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Drop the typed password when this unmounts (navigating away), so it never
  // lingers in memory.
  useEffect(() => {
    return () => {
      setPassword('')
      setError('')
    }
  }, [])

  async function handleDecrypt() {
    if (!password) return
    setLoading(true)
    setError('')

    try {
      const encoder = new TextEncoder()
      const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])

      const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0))
      const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0))
      const encryptedBytes = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0))

      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, encryptedBytes)
      onDecrypted(new TextDecoder().decode(decrypted))
    } catch {
      setError('That password didn’t work. Check it and try again.')
      setShake((n) => n + 1)
      inputRef.current?.select()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent-text)]">
        <LockKeyhole className="h-5 w-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold">This paste is encrypted</h2>
        <p className="text-sm text-[var(--text-muted)]">Enter the password to decrypt it in your browser.</p>
      </div>
      <form
        className="flex w-full max-w-sm flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          handleDecrypt()
        }}
      >
        <label htmlFor="decrypt-password" className="sr-only">Decryption password</label>
        <div key={shake} className={`relative flex-1 ${shake ? 'animate-[shake_320ms_var(--ease-out)]' : ''}`}>
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            ref={inputRef}
            id="decrypt-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={!!error}
            className="input min-h-11 pl-9 text-base sm:text-sm"
          />
        </div>
        <button type="submit" disabled={loading || !password} className="btn btn-primary min-h-11">
          {loading ? <span className="spinner" aria-hidden="true" /> : <Unlock />}
          {loading ? 'Decrypting…' : 'Decrypt'}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </div>
  )
}
