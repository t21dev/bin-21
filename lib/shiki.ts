import { createHighlighter, type Highlighter } from 'shiki'

let highlighterInstance: Highlighter | null = null

const CORE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown',
  'bash', 'sql', 'tsx', 'jsx',
]

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: CORE_LANGUAGES,
    })
  }
  return highlighterInstance
}

export async function highlightCode(
  code: string,
  language: string,
  theme: 'dark' | 'light' = 'dark'
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

  return highlighter.codeToHtml(code, {
    lang,
    theme: theme === 'dark' ? 'github-dark' : 'github-light',
  })
}
