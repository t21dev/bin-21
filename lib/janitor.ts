import { cleanupExpiredPastes } from '@/server/services/paste.service'

const INTERVAL_MS = 15 * 60 * 1000

let started = false

/**
 * Periodically reclaims expired pastes (DB row + R2 object).
 *
 * Reads treat expired pastes as absent, but something has to actually delete
 * them — otherwise expired content lingers in R2 indefinitely, which is exactly
 * what happened before this existed.
 *
 * An in-process interval is sufficient (and needs no external cron) because the
 * Railway volume forbids replicas, so exactly one process runs this.
 */
export function startJanitor(): void {
  if (started) return

  // Deletion is destructive and reaches the shared R2 bucket, so the janitor
  // never runs from a dev machine unless explicitly opted in. Set
  // JANITOR_ENABLED=true on the server (and only there).
  const enabled = process.env.JANITOR_ENABLED === 'true'
  if (!enabled) {
    console.log('[janitor] disabled (set JANITOR_ENABLED=true to enable)')
    return
  }

  started = true

  const run = async () => {
    try {
      const n = await cleanupExpiredPastes()
      if (n > 0) console.log(`[janitor] reclaimed ${n} expired paste(s)`)
    } catch (err) {
      console.error('[janitor] cleanup failed:', err)
    }
  }

  // Give the server a moment to finish booting before the first sweep.
  setTimeout(run, 30_000).unref?.()

  setInterval(run, INTERVAL_MS).unref?.()
}
