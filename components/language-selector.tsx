'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { LANGUAGES } from '@/lib/languages'

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
        setHighlightIndex(-1)
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  const selectLanguage = useCallback(
    (langId: string) => {
      onChange(langId)
      setOpen(false)
      setSearch('')
      setHighlightIndex(-1)
    },
    [onChange]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          selectLanguage(filtered[highlightIndex].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setSearch('')
        setHighlightIndex(-1)
        break
    }
  }

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${selected?.name ?? 'Plain Text'}`}
        className="flex h-10 min-w-[44px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm transition-colors hover:border-primary"
      >
        <span className="text-[var(--text-muted)]">Language:</span>
        <span className="font-medium">{selected?.name ?? 'Plain Text'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg animate-fade-in">
          <div className="border-b border-[var(--border)] p-2">
            <label htmlFor="language-search" className="sr-only">Search languages</label>
            <input
              id="language-search"
              ref={inputRef}
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlightIndex(-1) }}
              role="combobox"
              aria-expanded={open}
              aria-controls="language-listbox"
              aria-activedescendant={highlightIndex >= 0 ? `lang-${filtered[highlightIndex]?.id}` : undefined}
              autoComplete="off"
              className="w-full rounded-md bg-[var(--bg)] px-3 py-1.5 text-sm outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div
            ref={listRef}
            id="language-listbox"
            role="listbox"
            aria-label="Languages"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filtered.map((lang, index) => (
              <button
                key={lang.id}
                id={`lang-${lang.id}`}
                type="button"
                role="option"
                aria-selected={lang.id === value}
                onClick={() => selectLanguage(lang.id)}
                className={`flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  lang.id === value
                    ? 'bg-primary/10 text-primary'
                    : index === highlightIndex
                    ? 'bg-[var(--bg)]'
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
