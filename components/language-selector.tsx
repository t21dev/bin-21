import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
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
        setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          selectLanguage(filtered[highlightIndex].id)
        } else if (filtered.length === 1) {
          selectLanguage(filtered[0].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
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
        className="btn w-full justify-between"
      >
        <span className="truncate">{selected?.name ?? 'Plain Text'}</span>
        <ChevronDown className={`text-[var(--text-faint)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 origin-top animate-[rise_160ms_var(--ease-out)_both] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_-12px_var(--shadow)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 transition-colors focus-within:border-[var(--accent)] [&:focus-within>svg]:text-[var(--accent-text)]">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />
            <label htmlFor="language-search" className="sr-only">Search languages</label>
            <input
              id="language-search"
              ref={inputRef}
              type="text"
              placeholder="Search 150+ languages"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlightIndex(-1) }}
              role="combobox"
              aria-expanded={open}
              aria-controls="language-listbox"
              aria-activedescendant={highlightIndex >= 0 ? `lang-${filtered[highlightIndex]?.id}` : undefined}
              autoComplete="off"
              className="h-10 w-full bg-transparent text-base outline-none placeholder:text-[var(--text-faint)] md:text-sm"
            />
          </div>
          <div
            ref={listRef}
            id="language-listbox"
            role="listbox"
            aria-label="Languages"
            className="max-h-64 overflow-y-auto overscroll-contain p-1.5"
          >
            {filtered.map((lang, index) => (
              <button
                key={lang.id}
                id={`lang-${lang.id}`}
                type="button"
                role="option"
                aria-selected={lang.id === value}
                onClick={() => selectLanguage(lang.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  index === highlightIndex ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'
                } ${lang.id === value ? 'text-[var(--accent-text)]' : ''}`}
              >
                <Check className={`h-3.5 w-3.5 shrink-0 ${lang.id === value ? 'opacity-100' : 'opacity-0'}`} />
                <span className="flex-1">{lang.name}</span>
                {lang.extension && (
                  <span className="font-mono text-xs text-[var(--text-faint)]">{lang.extension}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--text-faint)]">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
