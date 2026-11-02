import { ChevronDown, Palette } from 'lucide-react'
import { SHIKI_THEMES, type ShikiThemeId } from '@/lib/shiki-themes'

interface ThemeSelectorProps {
  value: ShikiThemeId
  onChange: (theme: ShikiThemeId) => void
  id?: string
  /** Stretch to the container (side panel) instead of sizing to content. */
  block?: boolean
}

/** Native select (best on phones), dressed to match. */
export function ThemeSelector({ value, onChange, id = 'theme-select', block = false }: ThemeSelectorProps) {
  return (
    <div className={`relative items-center ${block ? 'flex w-full' : 'inline-flex w-fit'}`}>
      <Palette className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-[var(--text-faint)]" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">Highlight theme</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ShikiThemeId)}
        className={`${block ? 'h-10 w-full' : 'h-8'} appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pr-7 pl-7 font-mono text-xs text-[var(--text-muted)] outline-none transition-colors hover:border-[var(--text-faint)] focus:border-[var(--accent)]`}
      >
        {SHIKI_THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--text-faint)]" aria-hidden="true" />
    </div>
  )
}
