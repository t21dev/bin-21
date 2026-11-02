import { createFileRoute } from '@tanstack/react-router'
import { PasteForm } from '@/components/paste-form'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-lg font-semibold tracking-tight md:text-xl">New paste</h1>
        <p className="text-[13px] text-[var(--text-faint)]">
          No account. Encrypted in your browser if you want it.
        </p>
      </div>
      <PasteForm />
    </div>
  )
}
