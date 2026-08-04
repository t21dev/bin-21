'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminLogin } from '@/server/actions/admin.actions'

export function AdminLogin() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!token) return
    setError('')
    startTransition(async () => {
      const result = await adminLogin(token)
      if (result.success) {
        setToken('')
        router.refresh()
      } else {
        setError(result.error || 'Login failed')
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold">{'[~] Admin'}</h1>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
          Enter the admin token to view platform analytics.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="admin-token" className="sr-only">
          Admin token
        </label>
        <input
          id="admin-token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Token"
          autoComplete="off"
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 font-mono text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-primary"
        />
        <button
          onClick={submit}
          disabled={isPending || !token}
          className="h-11 rounded-lg bg-primary px-4 font-mono text-sm font-medium text-black transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? 'Checking...' : 'Unlock'}
        </button>
      </div>

      {error && <p className="font-mono text-xs text-error">{error}</p>}
    </div>
  )
}
