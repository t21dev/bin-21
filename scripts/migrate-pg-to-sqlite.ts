/**
 * One-off migration: Postgres `pastes` -> SQLite `pastes`.
 *
 * Paste *content* is not touched — it stays in Cloudflare R2, and `r2_key`
 * carries over verbatim so existing pastes keep resolving.
 *
 * Usage:
 *   DATABASE_URL=<postgres-url> DATABASE_PATH=./.data/bin21.db \
 *     npx tsx scripts/migrate-pg-to-sqlite.ts [--dry-run]
 *
 * Idempotent: re-running replaces rows by primary key rather than duplicating.
 */
import postgres from 'postgres'
import { eq, sql as raw } from 'drizzle-orm'
import { db } from '../lib/db'
import { pastes, type NewPaste } from '../lib/db/schema'

const DRY_RUN = process.argv.includes('--dry-run')

interface PgRow {
  id: string
  title: string | null
  language: string
  is_encrypted: boolean
  encryption_iv: string | null
  encryption_salt: string | null
  burn_after: boolean
  expires_at: Date | null
  view_count: number
  size_bytes: number
  r2_key: string
  created_at: Date
  ip_hash: string | null
  metadata: Record<string, unknown> | null
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL (source Postgres) is required')

  const sql = postgres(url, { ssl: 'prefer', max: 1 })

  const rows = await sql<PgRow[]>`
    select id, title, language, is_encrypted, encryption_iv, encryption_salt,
           burn_after, expires_at, view_count, size_bytes, r2_key,
           created_at, ip_hash, metadata
    from pastes
    order by created_at
  `

  console.log(`Source (Postgres): ${rows.length} rows`)

  // Drizzle's `mode: 'timestamp'` columns accept Date objects and persist unix
  // seconds, so the pg driver's Date values pass straight through.
  const mapped: NewPaste[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    language: r.language,
    isEncrypted: r.is_encrypted,
    encryptionIv: r.encryption_iv,
    encryptionSalt: r.encryption_salt,
    burnAfter: r.burn_after,
    expiresAt: r.expires_at,
    viewCount: r.view_count,
    sizeBytes: r.size_bytes,
    r2Key: r.r2_key,
    createdAt: r.created_at,
    ipHash: r.ip_hash,
    metadata: r.metadata,
  }))

  if (DRY_RUN) {
    console.log('--dry-run: nothing written. First 3 mapped rows:')
    console.log(JSON.stringify(mapped.slice(0, 3), null, 2))
    await sql.end()
    return
  }

  for (const row of mapped) {
    await db.insert(pastes).values(row).onConflictDoUpdate({ target: pastes.id, set: row })
  }

  const [{ count }] = await db.select({ count: raw<number>`count(*)` }).from(pastes)

  console.log(`Wrote ${mapped.length} rows`)
  console.log(`Target (SQLite):   ${count} rows`)
  console.log(count === rows.length ? 'Row counts match.' : `WARNING: counts differ.`)

  // Spot-check the rows most likely to expose a type-mapping bug.
  const checks = mapped.filter((m) => m.isEncrypted || m.burnAfter || m.expiresAt).slice(0, 15)
  console.log(`\nSpot-checking ${checks.length} encrypted/burn/expiring rows...`)
  for (const c of checks) {
    const [got] = await db.select().from(pastes).where(eq(pastes.id, c.id)).limit(1)
    const ok =
      got.isEncrypted === c.isEncrypted &&
      got.burnAfter === c.burnAfter &&
      got.viewCount === c.viewCount &&
      got.r2Key === c.r2Key &&
      (c.expiresAt instanceof Date
        ? Math.abs(+got.expiresAt! - +c.expiresAt) < 1000
        : got.expiresAt === null)
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${c.id}`)
    if (!ok) process.exitCode = 1
  }

  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
