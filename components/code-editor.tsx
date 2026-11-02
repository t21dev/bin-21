import { useCallback, useMemo, useRef } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  language?: string
  id?: string
}

/**
 * Plain textarea with a line-number gutter on wider screens. The gutter is a
 * separate column kept in sync with the textarea's scroll position; on phones
 * it is hidden and the text soft-wraps instead.
 */
export function CodeEditor({ value, onChange, placeholder = 'Paste your code here...', id = 'paste-content' }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lineCount = useMemo(() => Math.max(1, value.split('\n').length), [value])
  const gutter = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'), [lineCount])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab inserts 2 spaces instead of moving focus
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const next = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end)
        onChange(next)
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 2
        })
      }
    },
    [onChange]
  )

  return (
    <div className="relative flex min-h-[300px] flex-1 md:min-h-[440px]">
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="hidden w-12 shrink-0 overflow-hidden whitespace-pre py-4 pr-3 text-right font-mono text-[13px] leading-[1.75] text-[var(--text-faint)] opacity-70 select-none md:block"
      >
        {gutter}
      </div>
      <label htmlFor={id} className="sr-only">Paste content</label>
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
        }}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="min-h-[300px] w-full flex-1 resize-none bg-transparent px-3 py-4 focus-visible:outline-none max-md:[field-sizing:content] font-mono text-base leading-[1.75] outline-none placeholder:text-[var(--text-faint)] md:min-h-[440px] md:resize-y md:pl-0 md:text-[13px] md:whitespace-pre md:[overflow-wrap:normal]"
      />
    </div>
  )
}
