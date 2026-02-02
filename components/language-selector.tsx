'use client'

import { useState, useRef, useEffect } from 'react'
import { LANGUAGES } from '@/lib/languages'

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = LANGUAGES.find((l) => l.id === value)

  const filtered = search
    ? LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.id.toLowerCase().includes(search.toLowerCase())
      )
    : LANGUAGES

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm transition-colors hover:border-primary"
      >
        <span className="text-[var(--text-muted)]">Language:</span>
        <span className="font-medium">{selected?.name ?? 'Plain Text'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg animate-fade-in">
          <div className="border-b border-[var(--border)] p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md bg-[var(--bg)] px-3 py-1.5 text-sm outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  onChange(lang.id)
                  setOpen(false)
                  setSearch('')
                }}
                className={`flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  lang.id === value
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-[var(--bg)]'
                }`}
              >
                <span className="flex-1">{lang.name}</span>
                {lang.extension && (
                  <span className="text-xs text-[var(--text-muted)]">{lang.extension}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--text-muted)]">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
