import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-lg text-[var(--text-muted)]">
        This paste doesn&apos;t exist, has expired, or was burned after reading.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-primary-hover"
      >
        Create a new paste
      </Link>
    </div>
  )
}
