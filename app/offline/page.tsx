'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex items-baseline gap-2">
        <span className="font-mono text-5xl font-extrabold text-foreground">
          Bin
        </span>
        <span className="font-mono text-5xl font-extrabold text-green-400">
          21
        </span>
      </div>
      <h1 className="mb-3 text-2xl font-semibold text-foreground">
        You&apos;re offline
      </h1>
      <p className="max-w-md text-muted-foreground">
        It looks like you&apos;ve lost your internet connection. Please check
        your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-lg bg-green-500/10 px-6 py-2.5 font-medium text-green-400 ring-1 ring-green-500/20 transition-colors hover:bg-green-500/20"
      >
        Try again
      </button>
    </div>
  )
}
