export interface BotCheckResult {
  isBot: boolean
  reason?: string
}

export function detectBot(headers: Headers): BotCheckResult {
  const userAgent = headers.get('user-agent') || ''
  const acceptLanguage = headers.get('accept-language')
  const acceptEncoding = headers.get('accept-encoding')

  if (!acceptLanguage || !acceptEncoding) {
    return { isBot: true, reason: 'missing-headers' }
  }

  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python-requests/i,
    /headless/i, /phantom/i, /selenium/i,
  ]

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: 'bot-ua' }
    }
  }

  if (userAgent.length < 20) {
    return { isBot: true, reason: 'short-ua' }
  }

  return { isBot: false }
}
