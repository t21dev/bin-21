'use server'

import { highlightCode, type ShikiThemeId, SHIKI_THEMES } from '@/lib/shiki'

const VALID_THEMES = new Set(SHIKI_THEMES.map((t) => t.id))

export async function highlightAction(
  code: string,
  language: string,
  theme: string
): Promise<{ html: string } | { error: string }> {
  if (!code) return { error: 'No code provided' }
  if (code.length > 2_000_000) return { error: 'Content too large' }
  if (!VALID_THEMES.has(theme as ShikiThemeId)) return { error: 'Invalid theme' }

  try {
    const html = await highlightCode(code, language, theme as ShikiThemeId)
    return { html }
  } catch {
    return { error: 'Highlighting failed' }
  }
}
