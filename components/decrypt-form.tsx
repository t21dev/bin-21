'use client'

import { useState } from 'react'

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

  async function handleDecrypt() {
    if (!password) return
    setLoading(true)
    setError('')

    try {
      const encoder = new TextEncoder()

      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      )

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

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        key,
        encryptedBytes
      )

      const decoded = new TextDecoder().decode(decrypted)
      onDecrypted(decoded)
    } catch {
      setError('Incorrect password or corrupted data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <h2 className="text-lg font-semibold">This paste is encrypted</h2>
      <p className="text-sm text-[var(--text-muted)]">Enter the password to decrypt and view the content.</p>

      <div className="flex w-full max-w-sm gap-2">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-primary"
        />
        <button
          onClick={handleDecrypt}
          disabled={loading || !password}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? 'Decrypting...' : 'Decrypt'}
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
