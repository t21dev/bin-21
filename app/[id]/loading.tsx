export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-4 animate-pulse">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <div className="h-7 w-48 rounded bg-[var(--border)]" />
            <div className="mt-2 flex gap-3">
              <div className="h-5 w-16 rounded bg-[var(--border)]" />
              <div className="h-5 w-20 rounded bg-[var(--border)]" />
              <div className="h-5 w-16 rounded bg-[var(--border)]" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 rounded-lg bg-[var(--border)]" />
            <div className="h-10 w-16 rounded-lg bg-[var(--border)]" />
          </div>
        </div>
        <div className="min-h-[400px] space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="h-4 w-full rounded bg-[var(--border)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--border)]" />
          <div className="h-4 w-4/6 rounded bg-[var(--border)]" />
          <div className="h-4 w-full rounded bg-[var(--border)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
        </div>
      </div>
    </div>
  )
}
