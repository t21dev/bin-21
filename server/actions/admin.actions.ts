import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getRequest, setCookie } from '@tanstack/react-start/server'
import { ADMIN_COOKIE, isAdminEnabled, isAuthenticated, tokenMatches } from '@/lib/admin-auth'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'
import { getPlatformStats, type PlatformStats } from '@/server/services/stats.service'
import type { ActionResult } from '@/types'

export const adminLogin = createServerFn({ method: 'POST' })
  .validator((token: string) => String(token))
  .handler(async ({ data: token }): Promise<ActionResult<null>> => {
    if (!isAdminEnabled()) {
      return { success: false, error: 'Not found' }
    }

    // Throttle guesses hard: 5 per 5 minutes per IP.
    const ip = getClientIP(getRequest().headers)
    const limit = RATE_LIMITS.password
    const rl = checkRateLimit(ip, 'admin-login', limit.limit, limit.windowMs)
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
      return { success: false, error: `Too many attempts. Try again in ${retryAfter}s.` }
    }

    if (!tokenMatches(token)) {
      return { success: false, error: 'Invalid token' }
    }

    setCookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    return { success: true, data: null }
  })

export const adminLogout = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(ADMIN_COOKIE, { path: '/' })
})

export type AdminState =
  | { enabled: false }
  | { enabled: true; authenticated: false }
  | { enabled: true; authenticated: true; stats: PlatformStats }

/** Evaluated per request; nothing here is cached. */
export const getAdminState = createServerFn({ method: 'GET' }).handler(async (): Promise<AdminState> => {
  if (!isAdminEnabled()) return { enabled: false }
  if (!isAuthenticated()) return { enabled: true, authenticated: false }
  return { enabled: true, authenticated: true, stats: await getPlatformStats() }
})
