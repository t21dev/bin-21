import { createServerFn } from '@tanstack/react-start'
import { highlightCode, type ShikiThemeId, SHIKI_THEMES } from '@/lib/shiki'

const VALID_THEMES = new Set<string>(SHIKI_THEMES.map((t) => t.id))

export const highlightAction = createServerFn({ method: 'POST' })
  .validator((d: { code: string; language: string; theme: string }) => d)
  .handler(async ({ data }): Promise<{ html: string } | { error: string }> => {
    const { code, language, theme } = data
    if (!code) return { error: 'No code provided' }
    if (code.length > 2_000_000) return { error: 'Content too large' }
    if (!VALID_THEMES.has(theme)) return { error: 'Invalid theme' }

    try {
      const html = await highlightCode(code, language, theme as ShikiThemeId)
      return { html }
    } catch {
      return { error: 'Highlighting failed' }
    }
  })
