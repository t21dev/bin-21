import { PasteForm } from '@/components/paste-form'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Paste</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Share code and text instantly. No account required.
        </p>
      </div>
      <PasteForm />
    </div>
  )
}
