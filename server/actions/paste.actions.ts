import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { LANGUAGE_IDS } from '@/lib/languages'
import { highlightCode } from '@/lib/shiki'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'
import * as pasteService from '@/server/services/paste.service'
import type { ActionResult, PasteWithContent } from '@/types'

const createPasteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2_000_000, 'Content too large (max 2 million characters)'),
  title: z.string().max(255).optional(),
  language: z.string().default('text'),
  isEncrypted: z.boolean().default(false),
  encryptionIv: z.string().max(64).optional(),
  encryptionSalt: z.string().max(64).optional(),
  expiresIn: z.enum(['never', '10m', '1h', '1d', '1w', '1M']).default('never'),
  burnAfter: z.boolean().default(false),
  // Bot protection fields
  _honeypot: z.string().optional(),
  _timestamp: z.number().optional(),
}).refine(
  (data) => !data.isEncrypted || (data.encryptionIv && data.encryptionSalt),
  { message: 'Encryption IV and salt are required for encrypted pastes', path: ['encryptionIv'] }
)

type CreatePasteInput = z.input<typeof createPasteSchema>

export const createPaste = createServerFn({ method: 'POST' })
  // Schema validation runs inside the handler so the bot checks come first and
  // a validation failure returns an ActionResult instead of throwing.
  .validator((input: CreatePasteInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    try {
      // Bot detection: honeypot
      if (input._honeypot) {
        return { success: true, data: { id: `fake-${Date.now()}` } }
      }

      // Bot detection: time-based (min 2 seconds)
      if (input._timestamp && Date.now() - input._timestamp < 2000) {
        return { success: true, data: { id: `fake-${Date.now()}` } }
      }

      const validated = createPasteSchema.parse(input)

      if (!LANGUAGE_IDS.includes(validated.language)) {
        validated.language = 'text'
      }

      const result = await pasteService.createPaste({
        content: validated.content,
        title: validated.title,
        language: validated.language,
        isEncrypted: validated.isEncrypted,
        encryptionIv: validated.encryptionIv,
        encryptionSalt: validated.encryptionSalt,
        expiresIn: validated.expiresIn,
        burnAfter: validated.burnAfter,
      })

      return { success: true, data: result }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.issues[0]?.message ?? 'Validation failed' }
      }
      console.error('Failed to create paste:', error)
      return { success: false, error: 'Failed to create paste' }
    }
  })

export interface PastePageData {
  paste: PasteWithContent
  highlightedHtml?: string
}

/**
 * Loads a paste for its page and records the view.
 *
 * `record` is false when the router is only preloading the route (hover or
 * focus on a link). Recording on a preload would count views nobody made and
 * burn burn-after-read pastes before the recipient opened them. This is the
 * same hazard the Next.js version guarded against with connection() + cache().
 */
export const getPastePage = createServerFn({ method: 'GET' })
  .validator((d: { id: string; record: boolean }) => ({ id: String(d.id), record: d.record === true }))
  .handler(async ({ data }): Promise<PastePageData | null> => {
    const request = getRequest()

    // A document request for /<id> is charged by the request middleware
    // (src/start.ts). A client-side navigation arrives here as an RPC call
    // instead, so charge that one here: one view-budget hit per page view.
    if (new URL(request.url).pathname.startsWith('/_serverFn')) {
      const rl = checkRateLimit(getClientIP(request.headers), 'view', RATE_LIMITS.view.limit, RATE_LIMITS.view.windowMs)
      if (!rl.success) {
        throw new Error('Too many requests. Wait a minute and try again.')
      }
    }

    const paste = await pasteService.readPaste(data.id)
    if (!paste) return null

    // Server-side syntax highlighting (skip for encrypted/markdown)
    let highlightedHtml: string | undefined
    if (!paste.isEncrypted && paste.language !== 'markdown') {
      try {
        highlightedHtml = await highlightCode(paste.content, paste.language)
      } catch {
        // Fall back to plain text
      }
    }

    // Read first, then record: a burn-after-read paste is deleted by
    // recordView, and the content above has already been fetched.
    if (data.record) {
      await pasteService.recordView(data.id)
    }

    return {
      // readPaste ran before recordView, so add the view being served now.
      paste: { ...paste, viewCount: paste.viewCount + (data.record ? 1 : 0) },
      highlightedHtml,
    }
  })
