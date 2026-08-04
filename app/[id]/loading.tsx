import { PasteSkeleton } from '@/components/paste-skeleton'

export default function PasteLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PasteSkeleton />
    </div>
  )
}
