'use server'

import { cookies, headers } from 'next/headers'
import { ADMIN_COOKIE, isAdminEnabled, tokenMatches } from '@/lib/admin-auth'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'
import type { ActionResult } from '@/types'

export async function adminLogin(token: string): Promise<ActionResult<null>> {
  if (!isAdminEnabled()) {
    return { success: false, error: 'Not found' }
  }

  // Throttle guesses hard — 5 per 5 minutes per IP.
  const ip = getClientIP(await headers())
  const limit = RATE_LIMITS.password
  const rl = checkRateLimit(ip, 'admin-login', limit.limit, limit.windowMs)
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
    return { success: false, error: `Too many attempts. Try again in ${retryAfter}s.` }
  }

  if (!tokenMatches(token)) {
    return { success: false, error: 'Invalid token' }
  }

  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return { success: true, data: null }
}

export async function adminLogout(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}
