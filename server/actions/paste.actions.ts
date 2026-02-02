'use server'

import { z } from 'zod'
import { LANGUAGE_IDS } from '@/lib/languages'
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

export async function createPaste(
  input: z.infer<typeof createPasteSchema>
): Promise<ActionResult<{ id: string }>> {
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

    // Validate language is supported
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
}

export async function getPaste(id: string): Promise<ActionResult<PasteWithContent>> {
  try {
    const paste = await pasteService.getPaste(id)
    if (!paste) {
      return { success: false, error: 'Paste not found' }
    }
    return { success: true, data: paste }
  } catch (error) {
    console.error('Failed to get paste:', error)
    return { success: false, error: 'Failed to retrieve paste' }
  }
}
