const LINE_WIDTHS = [62, 38, 0, 74, 55, 81, 46, 0, 68, 35, 57, 72, 28]

/**
 * Loading shell for a paste, shaped like the real page (card + side rail, KPI
 * strip on phones) so nothing shifts when the content arrives.
 */
export function PasteSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_288px] md:items-start" aria-busy="true" aria-label="Loading paste">
      <div className="card vt-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3">
          <div className="skel h-4 w-4 rounded" />
          <div className="skel h-3.5 w-40" />
          <div className="skel ml-auto h-5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-3 border-b border-[var(--border)] md:hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`grid gap-1.5 px-3 py-2.5 ${i ? 'border-l border-[var(--border)]' : ''}`}>
              <div className="skel h-2.5 w-10" />
              <div className="skel h-3.5 w-8" />
            </div>
          ))}
        </div>
        <div className="grid gap-[0.9rem] px-4 py-5">
          {LINE_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skel h-2.5 w-5 opacity-60" />
              {w ? <div className="skel h-3" style={{ width: `${w}%` }} /> : null}
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-[var(--border)] px-3 py-2.5">
          <div className="skel h-2.5 w-24" />
          <div className="skel h-2.5 w-20" />
        </div>
      </div>

      <div className="hidden gap-5 md:grid">
        <div className="grid gap-2">
          <div className="skel h-3 w-20" />
          <div className="skel h-10 rounded-[10px]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="skel h-14 rounded-[10px]" />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="skel h-16 rounded-[10px]" />)}
        </div>
        <div className="skel h-11 rounded-[10px]" />
      </div>
    </div>
  )
}
