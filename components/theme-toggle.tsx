import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  // The theme is only known on the client; render a same-size placeholder so
  // the header doesn't shift on hydration.
  if (!mounted) {
    return <button type="button" className="btn btn-icon" aria-label="Toggle theme" />
  }

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="btn btn-icon"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span key={isDark ? 'sun' : 'moon'} className="grid animate-[rise_240ms_var(--ease-out)_both]">
        {isDark ? <Sun /> : <Moon />}
      </span>
    </button>
  )
}
