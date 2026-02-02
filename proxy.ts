import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'

export function proxy(request: NextRequest) {
  const ip = getClientIP(request.headers)
  const path = request.nextUrl.pathname

  // Only rate limit paste creation (POST to root) and paste views
  let prefix: string
  let config: { limit: number; windowMs: number }

  if (request.method === 'POST') {
    prefix = 'create'
    config = RATE_LIMITS.create
  } else if (path.match(/^\/[a-zA-Z0-9_-]+$/)) {
    prefix = 'view'
    config = RATE_LIMITS.view
  } else {
    return NextResponse.next()
  }

  const result = checkRateLimit(ip, prefix, config.limit, config.windowMs)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())

  return response
}

export const config = {
  matcher: ['/', '/:id([a-zA-Z0-9_-]+)', '/api/:path*'],
}
