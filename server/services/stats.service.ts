import { db } from '@/lib/db'
import { pastes } from '@/lib/db/schema'
import { sql, desc, and, isNotNull, lt, gte } from 'drizzle-orm'

export interface PlatformTotals
{
  pastes: number
  views: number
  totalBytes: number
  avgBytes: number
  maxBytes: number
  encrypted: number
  burnAfter: number
  withExpiry: number
  expiredPending: number
  titled: number
  createdLast7Days: number
  createdLast30Days: number
  firstPasteAt: Date | null
  lastPasteAt: Date | null
}

export interface LanguageStat {
  language: string
  count: number
  views: number
  bytes: number
}

export interface DayStat {
  /** ISO date, YYYY-MM-DD */
  day: string
  count: number
}

export interface SizeBucket {
  bucket: string
  count: number
}

export interface TopPaste {
  id: string
  title: string | null
  language: string
  viewCount: number
  sizeBytes: number
  isEncrypted: boolean
  createdAt: Date
}

export interface PlatformStats {
  totals: PlatformTotals
  byLanguage: LanguageStat[]
  byDay: DayStat[]
  bySize: SizeBucket[]
  topViewed: TopPaste[]
  generatedAt: Date
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

export async function getPlatformStats(): Promise<PlatformStats> {
  const now = new Date()

  const [totalsRow] = await db
    .select({
      pastes: sql<number>`count(*)`,
      views: sql<number>`coalesce(sum(${pastes.viewCount}), 0)`,
      totalBytes: sql<number>`coalesce(sum(${pastes.sizeBytes}), 0)`,
      avgBytes: sql<number>`coalesce(cast(round(avg(${pastes.sizeBytes})) as integer), 0)`,
      maxBytes: sql<number>`coalesce(max(${pastes.sizeBytes}), 0)`,
      encrypted: sql<number>`coalesce(sum(case when ${pastes.isEncrypted} then 1 else 0 end), 0)`,
      burnAfter: sql<number>`coalesce(sum(case when ${pastes.burnAfter} then 1 else 0 end), 0)`,
      withExpiry: sql<number>`coalesce(sum(case when ${pastes.expiresAt} is not null then 1 else 0 end), 0)`,
      titled: sql<number>`coalesce(sum(case when ${pastes.title} is not null then 1 else 0 end), 0)`,
      firstPasteAt: sql<number | null>`min(${pastes.createdAt})`,
      lastPasteAt: sql<number | null>`max(${pastes.createdAt})`,
    })
    .from(pastes)

  const [{ expiredPending }] = await db
    .select({ expiredPending: sql<number>`count(*)` })
    .from(pastes)
    .where(and(isNotNull(pastes.expiresAt), lt(pastes.expiresAt, now)))

  const [{ last7 }] = await db
    .select({ last7: sql<number>`count(*)` })
    .from(pastes)
    .where(gte(pastes.createdAt, daysAgo(7)))

  const [{ last30 }] = await db
    .select({ last30: sql<number>`count(*)` })
    .from(pastes)
    .where(gte(pastes.createdAt, daysAgo(30)))

  const byLanguage = await db
    .select({
      language: pastes.language,
      count: sql<number>`count(*)`,
      views: sql<number>`coalesce(sum(${pastes.viewCount}), 0)`,
      bytes: sql<number>`coalesce(sum(${pastes.sizeBytes}), 0)`,
    })
    .from(pastes)
    .groupBy(pastes.language)
    .orderBy(desc(sql`count(*)`))

  const byDay = await db
    .select({
      day: sql<string>`date(${pastes.createdAt}, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
    .from(pastes)
    .groupBy(sql`date(${pastes.createdAt}, 'unixepoch')`)
    .orderBy(sql`date(${pastes.createdAt}, 'unixepoch')`)

  const bySize = await db
    .select({
      bucket: sql<string>`case
        when ${pastes.sizeBytes} < 1024 then '< 1 KB'
        when ${pastes.sizeBytes} < 10240 then '1-10 KB'
        when ${pastes.sizeBytes} < 102400 then '10-100 KB'
        else '> 100 KB'
      end`,
      count: sql<number>`count(*)`,
      order: sql<number>`min(${pastes.sizeBytes})`,
    })
    .from(pastes)
    .groupBy(sql`1`)
    .orderBy(sql`min(${pastes.sizeBytes})`)

  const topViewed = await db
    .select({
      id: pastes.id,
      title: pastes.title,
      language: pastes.language,
      viewCount: pastes.viewCount,
      sizeBytes: pastes.sizeBytes,
      isEncrypted: pastes.isEncrypted,
      createdAt: pastes.createdAt,
    })
    .from(pastes)
    .orderBy(desc(pastes.viewCount), desc(pastes.createdAt))
    .limit(10)

  return {
    totals: {
      pastes: Number(totalsRow?.pastes ?? 0),
      views: Number(totalsRow?.views ?? 0),
      totalBytes: Number(totalsRow?.totalBytes ?? 0),
      avgBytes: Number(totalsRow?.avgBytes ?? 0),
      maxBytes: Number(totalsRow?.maxBytes ?? 0),
      encrypted: Number(totalsRow?.encrypted ?? 0),
      burnAfter: Number(totalsRow?.burnAfter ?? 0),
      withExpiry: Number(totalsRow?.withExpiry ?? 0),
      expiredPending: Number(expiredPending ?? 0),
      titled: Number(totalsRow?.titled ?? 0),
      createdLast7Days: Number(last7 ?? 0),
      createdLast30Days: Number(last30 ?? 0),
      // min()/max() over a timestamp column come back as raw unix seconds.
      firstPasteAt: totalsRow?.firstPasteAt ? new Date(Number(totalsRow.firstPasteAt) * 1000) : null,
      lastPasteAt: totalsRow?.lastPasteAt ? new Date(Number(totalsRow.lastPasteAt) * 1000) : null,
    },
    byLanguage: byLanguage.map((r) => ({
      language: r.language,
      count: Number(r.count),
      views: Number(r.views),
      bytes: Number(r.bytes),
    })),
    byDay: byDay.map((r) => ({ day: r.day, count: Number(r.count) })),
    bySize: bySize.map((r) => ({ bucket: r.bucket, count: Number(r.count) })),
    topViewed,
    generatedAt: now,
  }
}
