'use client'

import { useRef, useCallback } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  language?: string
}

export function CodeEditor({ value, onChange, placeholder = 'Paste your code here...' }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab key inserts 2 spaces instead of changing focus
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        onChange(newValue)

        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 2
        })
      }
    },
    [value, onChange]
  )

  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors focus-within:border-primary">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        className="h-full min-h-[300px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-[var(--text-muted)]"
      />
      {value.length > 0 && (
        <div className="absolute bottom-2 right-3 text-xs text-[var(--text-muted)]">
          {new TextEncoder().encode(value).length > 1024
            ? `${(new TextEncoder().encode(value).length / 1024).toFixed(1)} KB`
            : `${new TextEncoder().encode(value).length} B`}
        </div>
      )}
    </div>
  )
}
