import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  language?: string
  id?: string
}

/**
 * Plain textarea that grows with its content, so the page scrolls (and the
 * card's sticky title bar stays in view) instead of the text scrolling inside
 * a fixed box. A line-number gutter sits beside it on wider screens; on phones
 * the gutter is hidden and the text soft-wraps.
 */
export function CodeEditor({ value, onChange, placeholder = 'Paste your code here...', id = 'paste-content' }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lineCount = useMemo(() => Math.max(1, value.split('\n').length), [value])
  const gutter = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'), [lineCount])

  // Auto-size: collapse, then grow to the content height. CSS min-height keeps
  // the empty editor a comfortable size. Works in every browser, unlike
  // `field-sizing: content`.
  useLayoutEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [value])

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
        aria-hidden="true"
        className="hidden w-12 shrink-0 whitespace-pre py-4 pr-3 text-right font-mono text-[13px] leading-[1.75] text-[var(--text-faint)] opacity-70 select-none md:block"
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
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={1}
        className="min-h-[300px] w-full flex-1 resize-none overflow-y-hidden bg-transparent px-3 py-4 font-mono text-base leading-[1.75] outline-none placeholder:text-[var(--text-faint)] md:min-h-[440px] md:overflow-x-auto md:pl-0 md:text-[13px] md:whitespace-pre md:[overflow-wrap:normal]"
      />
    </div>
  )
}
