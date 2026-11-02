import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="site-footer border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-5 text-[13px] text-[var(--text-faint)]">
        <p>
          Bin <span className="text-[var(--accent-text)]">21</span> · Simple. Private. Fast.
        </p>
        <nav className="flex items-center gap-4">
          <Link to="/fair-use" className="transition-colors hover:text-[var(--text)]">
            Fair Use
          </Link>
          <a href="https://github.com/t21dev/bin-21" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--text)]">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
