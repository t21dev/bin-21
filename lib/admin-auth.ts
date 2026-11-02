import { createHash, timingSafeEqual } from 'node:crypto'
import { getCookie } from '@tanstack/react-start/server'

export const ADMIN_COOKIE = 'bin21_admin'

/**
 * The admin area only exists when ADMIN_TOKEN is set. Callers should treat a
 * false result as "route not found" rather than "forbidden", so an instance
 * without the env var doesn't advertise that an admin area is available.
 */
export function isAdminEnabled(): boolean {
  return Boolean(process.env.ADMIN_TOKEN)
}

/** Compares via fixed-length digests so neither content nor length leaks. */
export function tokenMatches(candidate: string | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN
  if (!expected || !candidate) return false

  const a = createHash('sha256').update(candidate).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/** Only valid inside a request (server function or server route). */
export function isAuthenticated(): boolean {
  if (!isAdminEnabled()) return false
  return tokenMatches(getCookie(ADMIN_COOKIE))
}
