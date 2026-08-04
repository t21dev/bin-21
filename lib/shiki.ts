import { createHighlighter, type Highlighter } from 'shiki'

const CORE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown',
  'bash', 'sql', 'tsx', 'jsx',
]

export const SHIKI_THEMES = [
  { id: 'github-dark', name: 'GitHub Dark' },
  { id: 'github-light', name: 'GitHub Light' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'one-dark-pro', name: 'One Dark Pro' },
  { id: 'nord', name: 'Nord' },
] as const

export type ShikiThemeId = (typeof SHIKI_THEMES)[number]['id']

const ALL_THEME_IDS = SHIKI_THEMES.map((t) => t.id)

/**
 * Upper bound on languages kept resident.
 *
 * Grammars are large and Shiki never evicts them, so an unbounded highlighter
 * grows with the variety of languages ever pasted: measured at ~146MB RSS fresh
 * and ~265MB once ~100 grammars had accumulated. Past this cap we dispose the
 * highlighter and start over from the core set, trading a rare rebuild for a
 * bounded footprint.
 *
 * Loading one language can pull in several more (embedded grammars), so this
 * counts everything actually resident, not just explicit requests.
 */
const MAX_RESIDENT_LANGUAGES = 32

// Cache the promise, not the instance, so concurrent callers share one build
// instead of each creating a highlighter.
let highlighterPromise: Promise<Highlighter> | null = null

function build(): Promise<Highlighter> {
  return createHighlighter({ themes: ALL_THEME_IDS, langs: CORE_LANGUAGES })
}

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = build()
  }
  return highlighterPromise
}

async function recycleIfOversized(highlighter: Highlighter): Promise<Highlighter> {
  if (highlighter.getLoadedLanguages().length <= MAX_RESIDENT_LANGUAGES) {
    return highlighter
  }

  highlighter.dispose()
  highlighterPromise = build()
  return highlighterPromise
}

export async function highlightCode(
  code: string,
  language: string,
  theme: ShikiThemeId = 'github-dark'
): Promise<string> {
  let highlighter = await getHighlighter()

  // Load language on demand if not already loaded
  if (!highlighter.getLoadedLanguages().includes(language)) {
    try {
      await highlighter.loadLanguage(language as Parameters<typeof highlighter.loadLanguage>[0])
    } catch {
      // Language not available, fall back to text
    }
  }

  const lang = highlighter.getLoadedLanguages().includes(language) ? language : 'text'
  const html = highlighter.codeToHtml(code, { lang, theme })

  // Recycle after rendering so this request still uses the grammar it loaded.
  highlighter = await recycleIfOversized(highlighter)

  return html
}
