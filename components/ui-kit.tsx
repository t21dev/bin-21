import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

/** Segmented control with a sliding thumb. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode; title?: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="seg" role="group" aria-label={label}>
      <span
        aria-hidden="true"
        className="seg-thumb"
        style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          aria-label={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** A full-width row that toggles; the whole row is the hit target. */
export function SwitchRow({
  checked,
  onChange,
  icon,
  children,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  icon: ReactNode
  children: ReactNode
  id?: string
}) {
  return (
    <button id={id} type="button" role="switch" aria-checked={checked} className="switch-row" onClick={() => onChange(!checked)}>
      <span className="label">
        {icon}
        {children}
      </span>
      <span className="switch" aria-hidden="true" />
    </button>
  )
}

/** Copies text; the icon turns into a check for 1.4s. Silent success, no toast. */
export function CopyButton({
  text,
  className = 'btn',
  label,
  children,
  disabled,
}: {
  text: () => string
  className?: string
  label: string
  children?: ReactNode
  disabled?: boolean
}) {
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      data-done={done}
      disabled={disabled}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text())
          setDone(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setDone(false), 1400)
        } catch {
          // Clipboard refused (insecure context or permissions): nothing to undo.
        }
      }}
    >
      <span className="swap" aria-hidden="true">
        <Copy />
        <Check />
      </span>
      {children}
    </button>
  )
}

/**
 * Inspector panel: a sticky side rail from md up, a bottom sheet below md.
 * `open` only matters on phones.
 */
export function Panel({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <button
        type="button"
        aria-label="Close options"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[var(--scrim)] transition-opacity duration-300 md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        aria-label={label}
        className={`vt-panel fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--border)] bg-[var(--surface)] px-4 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-[0_-20px_40px_-20px_var(--shadow)] transition-transform duration-300 ease-[var(--ease-out)]
          md:sticky md:top-20 md:z-auto md:col-start-2 md:row-span-4 md:row-start-1 md:max-h-none md:translate-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none
          ${open ? 'translate-y-0' : 'translate-y-[102%]'}`}
      >
        <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-9 rounded-full bg-[var(--surface-3)] md:hidden" />
        <div className="grid gap-5">{children}</div>
      </aside>
    </>
  )
}

/**
 * Action bar pinned to the bottom of the screen on phones, clear of the home
 * indicator. While one is on screen, the footer gets matching bottom padding
 * (see `.site-footer` in styles.css) so the end of the page stays reachable.
 */
export function Dock({ children }: { children: ReactNode }) {
  return (
    <div data-dock="" className="fixed inset-x-0 bottom-0 z-30 flex animate-[rise_320ms_var(--ease-out)_both] gap-2 border-t border-[var(--border)] bg-[color-mix(in_oklch,var(--bg)_84%,transparent)] pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md backdrop-saturate-150 md:hidden [&_.btn]:min-h-12 [&_.btn]:rounded-xl [&_.btn-icon]:w-12">
      {children}
    </div>
  )
}
