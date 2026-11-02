import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

/**
 * Thin progress line under the header while a route is loading. It waits
 * 150ms before appearing, so fast navigations (most of them) never flash it.
 */
export function RouteProgress() {
  // isLoading covers loaders in flight; status alone flips back too early.
  const loading = useRouterState({ select: (s) => s.isLoading || s.status === 'pending' })
  const [delayPassed, setDelayPassed] = useState(false)

  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setDelayPassed(true), 150)
    return () => {
      clearTimeout(t)
      setDelayPassed(false)
    }
  }, [loading])

  const visible = loading && delayPassed

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 h-0.5 overflow-hidden transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="h-full w-full origin-left animate-[progress_1.1s_var(--ease-in-out)_infinite] bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
    </div>
  )
}
