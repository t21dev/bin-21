'use client'

import type { TooltipContentProps } from 'recharts'

/**
 * Monospace tooltip matching Bin 21's terminal styling. The vendored Evil Charts
 * primitive doesn't ship a tooltip (its blocks each roll their own), so this is
 * the shared one for the admin charts.
 *
 * Props are Partial because Recharts injects them by cloning the element passed
 * to `content`, so the call site only supplies `unit`.
 */
type MonoTooltipProps = Partial<TooltipContentProps<number, string>> & { unit?: string }

export function MonoTooltip({ active, payload, label, unit }: MonoTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs shadow-sm">
      {label != null && <div className="text-[var(--text-muted)]">{String(label)}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: entry.color }} />
          <span className="tabular-nums">{entry.value}</span>
          {unit && <span className="text-[var(--text-muted)]">{unit}</span>}
        </div>
      ))}
    </div>
  )
}
