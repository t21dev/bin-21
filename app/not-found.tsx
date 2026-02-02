'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative">
        <span className="text-[8rem] font-bold leading-none text-primary/10 sm:text-[12rem]">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary sm:h-20 sm:w-20" aria-hidden="true">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
            <line x1="9" y1="14" x2="15" y2="14" className="opacity-40" />
            <line x1="9" y1="18" x2="13" y2="18" className="opacity-40" />
          </svg>
        </div>
      </div>
      <h1 className="mt-4 text-xl font-semibold sm:text-2xl">Paste not found</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--text-muted)] sm:text-base">
        This paste doesn&apos;t exist, has expired, or was burned after reading.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-black transition-colors hover:bg-primary-hover"
        >
          Create a new paste
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex h-11 items-center justify-center rounded-lg border border-[var(--border)] px-6 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Reload page
        </button>
      </div>
    </div>
  )
}
