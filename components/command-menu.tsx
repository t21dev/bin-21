import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { CornerDownLeft, ExternalLink, FilePlus2, Moon, Scale, Search, Sun } from 'lucide-react'

const OPEN_EVENT = 'bin21:command-menu'

/** Opens the menu from anywhere (header buttons). */
export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

interface Command {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  run: () => void
}

/**
 * ⌘K / Ctrl+K command menu. Small on purpose: navigation and theme, the
 * things you'd otherwise reach for the mouse to do.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const openRef = useRef(false)
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    // Reset the query each time the menu opens.
    const show = () => {
      setQuery('')
      setActive(0)
      setOpen(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (openRef.current) setOpen(false)
        else show()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_EVENT, show)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_EVENT, show)
    }
  }, [])

  useEffect(() => {
    openRef.current = open
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const isDark = resolvedTheme === 'dark'
    return [
      { id: 'new', label: 'New paste', hint: 'Go', icon: <FilePlus2 />, run: () => navigate({ to: '/' }) },
      { id: 'theme', label: isDark ? 'Switch to light mode' : 'Switch to dark mode', hint: 'Theme', icon: isDark ? <Sun /> : <Moon />, run: () => setTheme(isDark ? 'light' : 'dark') },
      { id: 'fair-use', label: 'Fair use policy', hint: 'Go', icon: <Scale />, run: () => navigate({ to: '/fair-use' }) },
      { id: 'github', label: 'Source on GitHub', hint: 'Link', icon: <ExternalLink />, run: () => window.open('https://github.com/t21dev/bin-21', '_blank', 'noopener') },
    ]
  }, [navigate, resolvedTheme, setTheme])

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))

  function run(cmd: Command | undefined) {
    if (!cmd) return
    setOpen(false)
    cmd.run()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[min(18vh,140px)]" role="presentation">
      <button type="button" aria-label="Close command menu" className="absolute inset-0 animate-fade-in bg-[var(--scrim)]" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        className="card relative w-full max-w-lg origin-top animate-[rise_200ms_var(--ease-out)_both] overflow-hidden shadow-[0_24px_60px_-16px_var(--shadow)]"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % Math.max(filtered.length, 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1)) }
          else if (e.key === 'Enter') { e.preventDefault(); run(filtered[active]) }
        }}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
          <Search className="h-4 w-4 text-[var(--text-faint)]" />
          <input
            ref={inputRef}
            id="command-query"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            placeholder="Type a command"
            autoComplete="off"
            aria-label="Command"
            className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-faint)] sm:text-sm"
          />
          <span className="kbd">Esc</span>
        </div>
        <ul role="listbox" aria-label="Commands" className="max-h-72 overflow-y-auto p-1.5">
          {filtered.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors [&>svg]:h-4 [&>svg]:w-4 ${
                  i === active ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {c.icon}
                <span className="flex-1">{c.label}</span>
                {i === active ? <CornerDownLeft className="opacity-50" /> : <span className="font-mono text-xs text-[var(--text-faint)]">{c.hint}</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-[var(--text-faint)]">No matching command</li>}
        </ul>
      </div>
    </div>
  )
}
