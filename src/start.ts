import { createMiddleware, createStart } from '@tanstack/react-start'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'

const PASTE_PATH = /^\/[a-zA-Z0-9_-]+$/

/**
 * Port of the old Next.js proxy.ts. Same limits, same paths, same headers.
 *
 * - Every POST (all mutations are POST server functions) counts against the
 *   `create` budget, as every Server Action POST did under Next.
 * - A document request for a single-segment path counts as a `view`.
 * - Client-side navigations to a paste don't hit a page URL; the paste server
 *   function charges the `view` budget for those instead (server/actions/paste.actions.ts).
 */
const rateLimitMiddleware = createMiddleware().server(async ({ request, pathname, next, handlerType }) => {
  if (pathname === '/admin' && !process.env.ADMIN_TOKEN) {
    return new Response(null, { status: 404 })
  }

  let prefix: string
  let config: { limit: number; windowMs: number }

  if (request.method === 'POST') {
    prefix = 'create'
    config = RATE_LIMITS.create
  } else if (handlerType === 'router' && pathname !== '/admin' && PASTE_PATH.test(pathname)) {
    prefix = 'view'
    config = RATE_LIMITS.view
  } else {
    return next()
  }

  const ip = getClientIP(request.headers)
  const result = checkRateLimit(ip, prefix, config.limit, config.windowMs)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    return Response.json(
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

  const res = await next()
  res.response.headers.set('X-RateLimit-Limit', result.limit.toString())
  res.response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  res.response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return res
})

export const startInstance = createStart(() => ({
  requestMiddleware: [rateLimitMiddleware],
}))
