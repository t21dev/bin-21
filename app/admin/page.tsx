import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import type { Metadata } from 'next'
import { isAdminEnabled, isAuthenticated } from '@/lib/admin-auth'
import { getPlatformStats } from '@/server/services/stats.service'
import { adminLogout } from '@/server/actions/admin.actions'
import { AdminLogin } from '@/components/admin/admin-login'
import { StatTile } from '@/components/admin/stat-tile'
import { LanguageBarChart } from '@/components/admin/language-bar-chart'
import { ActivityAreaChart } from '@/components/admin/activity-area-chart'
import { SizeRadialChart } from '@/components/admin/size-radial-chart'
import { formatBytes } from '@/lib/utils'

// Analytics must never be indexed or cached in a shared layer.
export const metadata: Metadata = {
  title: 'Admin - Bin 21',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminGate />
      </Suspense>
    </div>
  )
}

/**
 * Reads cookies, so it lives inside the Suspense boundary — under Cache
 * Components runtime data access outside one blocks the prerendered shell.
 */
async function AdminGate() {
  // Pin this subtree to request time. Without it, the env check below is
  // evaluated during prerender and the result is baked into a static page:
  // the gate would answer from build-time state instead of the live request.
  await connection()

  // With no ADMIN_TOKEN configured the admin area simply doesn't exist.
  if (!isAdminEnabled()) {
    notFound()
  }

  if (!(await isAuthenticated())) {
    return <AdminLogin />
  }

  return <Dashboard />
}

async function Dashboard() {
  const stats = await getPlatformStats()
  const { totals } = stats

  const encryptedPct = totals.pastes ? Math.round((totals.encrypted / totals.pastes) * 100) : 0
  const viewsPerPaste = totals.pastes ? (totals.views / totals.pastes).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold">{'[~] Platform analytics'}</h1>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            {totals.firstPasteAt
              ? `${totals.firstPasteAt.toISOString().slice(0, 10)} → ${totals.lastPasteAt?.toISOString().slice(0, 10)}`
              : 'No pastes yet'}
          </p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-xs transition-colors hover:bg-[var(--surface)]"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pastes" value={totals.pastes} hint={`${totals.titled} titled`} />
        <StatTile label="Views" value={totals.views} hint={`${viewsPerPaste} avg / paste`} />
        <StatTile label="Stored" value={formatBytes(totals.totalBytes)} hint={`${formatBytes(totals.avgBytes)} avg`} />
        <StatTile label="Largest" value={formatBytes(totals.maxBytes)} />
        <StatTile label="Encrypted" value={totals.encrypted} hint={`${encryptedPct}% of all pastes`} />
        <StatTile label="Burn after read" value={totals.burnAfter} />
        <StatTile label="With expiry" value={totals.withExpiry} />
        <StatTile
          label="Expired, not reclaimed"
          value={totals.expiredPending}
          hint={totals.expiredPending > 0 ? 'janitor has not swept yet' : 'clean'}
          tone={totals.expiredPending > 0 ? 'warn' : 'default'}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile label="Last 7 days" value={totals.createdLast7Days} hint="pastes created" />
        <StatTile label="Last 30 days" value={totals.createdLast30Days} hint="pastes created" />
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <ActivityAreaChart data={stats.byDay} />
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 lg:col-span-2">
          <LanguageBarChart data={stats.byLanguage} />
        </section>
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <SizeRadialChart data={stats.bySize} />
        </section>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-mono text-xs text-[var(--text-muted)]">{'[⬆] Most viewed'}</h2>
        <hr className="my-3 border-t border-dashed border-[var(--border)]" />
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[520px] font-mono text-xs">
            <thead className="text-[var(--text-muted)]">
              <tr className="text-left">
                <th className="pb-2 font-normal">ID</th>
                <th className="pb-2 font-normal">Title</th>
                <th className="pb-2 font-normal">Lang</th>
                <th className="pb-2 text-right font-normal">Views</th>
                <th className="pb-2 text-right font-normal">Size</th>
              </tr>
            </thead>
            <tbody>
              {stats.topViewed.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border)]">
                  <td className="py-2">
                    <a href={`/${p.id}`} className="text-primary hover:underline">
                      {p.id}
                    </a>
                  </td>
                  <td className="max-w-[220px] truncate py-2">
                    {p.isEncrypted ? <span className="text-[var(--text-muted)]">encrypted</span> : (p.title ?? '—')}
                  </td>
                  <td className="py-2 text-[var(--text-muted)]">{p.language}</td>
                  <td className="py-2 text-right tabular-nums">{p.viewCount}</td>
                  <td className="py-2 text-right tabular-nums">{formatBytes(p.sizeBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="font-mono text-[10px] text-[var(--text-muted)]">
        Generated {stats.generatedAt.toISOString()} · read live from SQLite
      </p>
    </div>
  )
}

function AdminSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-7 w-64 rounded bg-[var(--border)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-[var(--border)]" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-[var(--border)]" />
    </div>
  )
}
