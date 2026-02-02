import { createHighlighter, type Highlighter } from 'shiki'

let highlighterInstance: Highlighter | null = null

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

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ALL_THEME_IDS,
      langs: CORE_LANGUAGES,
    })
  }
  return highlighterInstance
}

export async function highlightCode(
  code: string,
  language: string,
  theme: ShikiThemeId = 'github-dark'
): Promise<string> {
  const highlighter = await getHighlighter()

  // Load language on demand if not already loaded
  if (!highlighter.getLoadedLanguages().includes(language)) {
    try {
      await highlighter.loadLanguage(language as Parameters<typeof highlighter.loadLanguage>[0])
    } catch {
      // Language not available, fall back to text
    }
  }

  const lang = highlighter.getLoadedLanguages().includes(language)
    ? language
    : 'text'

  return highlighter.codeToHtml(code, { lang, theme })
}
