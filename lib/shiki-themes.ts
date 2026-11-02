// Client-safe: the list of highlight themes, with no Shiki or Node imports.
export const SHIKI_THEMES = [
  { id: 'github-dark', name: 'GitHub Dark' },
  { id: 'github-light', name: 'GitHub Light' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'one-dark-pro', name: 'One Dark Pro' },
  { id: 'nord', name: 'Nord' },
] as const

export type ShikiThemeId = (typeof SHIKI_THEMES)[number]['id']
