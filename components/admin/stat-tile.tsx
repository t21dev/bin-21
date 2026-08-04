interface StatTileProps {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warn'
}

export function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div
        className={`mt-1.5 font-mono text-2xl tracking-tighter tabular-nums ${
          tone === 'warn' ? 'text-warning' : ''
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{hint}</div>}
    </div>
  )
}
