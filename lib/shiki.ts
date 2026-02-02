import { createHighlighter, type Highlighter } from 'shiki'

let highlighterInstance: Highlighter | null = null

const BUNDLED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c', 'cpp',
  'csharp', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css',
  'json', 'yaml', 'toml', 'xml', 'markdown', 'sql', 'bash', 'dockerfile',
  'graphql', 'tsx', 'jsx', 'vue', 'svelte', 'scss', 'less', 'powershell',
  'r', 'julia', 'lua', 'perl', 'haskell', 'elixir', 'clojure', 'fsharp',
  'dart', 'zig', 'diff', 'ini', 'makefile', 'nginx', 'terraform',
  'prisma', 'latex', 'astro', 'mdx', 'fish', 'objective-c', 'ocaml',
  'erlang', 'groovy', 'solidity', 'bat', 'jsonc', 'postcss', 'proto',
  'nix', 'ada', 'awk', 'coffeescript', 'crystal', 'd', 'handlebars',
  'glsl', 'hlsl', 'log', 'mermaid', 'regex', 'smalltalk', 'systemverilog',
  'tcl', 'twig', 'vb', 'verilog', 'vhdl', 'viml', 'wgsl',
]

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: BUNDLED_LANGUAGES,
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

  const lang = highlighter.getLoadedLanguages().includes(language)
    ? language
    : 'text'

  return highlighter.codeToHtml(code, {
    lang,
    theme: theme === 'dark' ? 'github-dark' : 'github-light',
  })
}
