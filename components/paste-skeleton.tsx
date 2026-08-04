/**
 * Loading shell for a paste. Shared by app/[id]/loading.tsx and the Suspense
 * fallback in app/[id]/page.tsx so the shell Next.js prerenders for unknown
 * params matches what a navigation shows.
 */
export function PasteSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-7 w-48 rounded bg-[var(--border)] sm:w-64" />
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="h-5 w-20 rounded-md bg-[var(--border)]" />
            <div className="h-5 w-16 rounded bg-[var(--border)]" />
            <div className="h-5 w-14 rounded bg-[var(--border)]" />
            <div className="h-5 w-16 rounded bg-[var(--border)]" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-[76px] rounded-lg bg-[var(--border)]" />
          <div className="h-10 w-[72px] rounded-lg bg-[var(--border)]" />
          <div className="h-10 w-[52px] rounded-lg bg-[var(--border)]" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="min-h-[300px] space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:min-h-[400px]">
        <div className="h-4 w-full rounded bg-[var(--border)]" />
        <div className="h-4 w-11/12 rounded bg-[var(--border)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--border)]" />
        <div className="h-4 w-full rounded bg-[var(--border)]" />
        <div className="h-4 w-4/6 rounded bg-[var(--border)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
        <div className="h-4 w-full rounded bg-[var(--border)]" />
        <div className="h-4 w-2/3 rounded bg-[var(--border)]" />
      </div>
    </div>
  )
}
