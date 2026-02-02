export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        {/* Heading skeleton */}
        <div>
          <div className="h-8 w-36 rounded bg-[var(--border)]" />
          <div className="mt-2 h-4 w-64 rounded bg-[var(--border)]" />
        </div>

        {/* Title input skeleton */}
        <div className="h-10 w-full rounded-lg bg-[var(--border)]" />

        {/* Toolbar skeleton */}
        <div className="flex gap-3">
          <div className="h-10 w-40 rounded-lg bg-[var(--border)]" />
        </div>

        {/* Editor skeleton */}
        <div className="min-h-[300px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:min-h-[300px]">
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
            <div className="h-4 w-1/2 rounded bg-[var(--border)]" />
            <div className="h-4 w-5/6 rounded bg-[var(--border)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--border)]" />
          </div>
        </div>

        {/* Options row skeleton */}
        <div className="flex flex-wrap gap-4">
          <div className="h-8 w-32 rounded bg-[var(--border)]" />
          <div className="h-8 w-36 rounded bg-[var(--border)]" />
          <div className="h-8 w-20 rounded bg-[var(--border)]" />
        </div>

        {/* Submit skeleton */}
        <div className="h-11 w-32 rounded-lg bg-[var(--border)]" />
      </div>
    </div>
  )
}
