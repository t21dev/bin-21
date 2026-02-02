'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error/10 sm:h-24 sm:w-24">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-error sm:h-12 sm:w-12" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="mt-6 text-xl font-semibold sm:text-2xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--text-muted)] sm:text-base">
        An unexpected error occurred. Try reloading the page or go back to the homepage.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => window.location.reload()}
          className="flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-black transition-colors hover:bg-primary-hover"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Reload page
        </button>
        <button
          onClick={reset}
          className="flex h-11 items-center justify-center rounded-lg border border-[var(--border)] px-6 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-lg border border-[var(--border)] px-6 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 rounded-md bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text-muted)]">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
