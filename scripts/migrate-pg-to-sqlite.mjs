/**
 * One-off migration: Postgres `pastes` -> SQLite `pastes`.
 *
 * Deliberately self-contained plain JavaScript with raw SQL — no Drizzle, no
 * TypeScript, no tsx. It has to run inside the deployed container, where
 * NODE_ENV=production has pruned devDependencies and there is no TS loader.
 * Only `postgres` and `better-sqlite3` are needed, both production deps.
 *
 * Paste *content* is not touched: it stays in Cloudflare R2 and `r2_key` carries
 * over verbatim, so existing pastes keep resolving.
 *
 * Usage:
 *   DATABASE_URL=<postgres-url> DATABASE_PATH=/data/bin21.db \
 *     node scripts/migrate-pg-to-sqlite.mjs [--dry-run]
 *
 * Idempotent: re-running upserts by primary key. Safe to retry.
 */
import Database from 'better-sqlite3'
import postgres from 'postgres'

const DRY_RUN = process.argv.includes('--dry-run')
const DB_PATH = process.env.DATABASE_PATH || './.data/bin21.db'
const PG_URL = process.env.DATABASE_URL

if (!PG_URL) {
  console.error('DATABASE_URL (source Postgres) is required')
  process.exit(1)
}

/** Postgres returns Date; SQLite timestamp columns hold unix seconds. */
const toUnix = (d) => (d ? Math.floor(new Date(d).getTime() / 1000) : null)

const sql = postgres(PG_URL, { ssl: 'prefer', max: 1 })

try {
  const rows = await sql`
    select id, title, language, is_encrypted, encryption_iv, encryption_salt,
           burn_after, expires_at, view_count, size_bytes, r2_key,
           created_at, ip_hash, metadata
    from pastes
    order by created_at
  `
  console.log(`Source (Postgres): ${rows.length} rows`)

  if (DRY_RUN) {
    console.log('--dry-run: nothing written. First row mapped:')
    console.log(rows[0])
    await sql.end()
    process.exit(0)
  }

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')

  // The app creates the schema on boot. Fail loudly rather than silently
  // writing nothing if this runs before the app has ever started.
  const table = db
    .prepare("select name from sqlite_master where type='table' and name='pastes'")
    .get()
  if (!table) {
    console.error(
      `No "pastes" table in ${DB_PATH}. Start the app once so migrations run, then re-run this.`
    )
    process.exit(1)
  }

  const upsert = db.prepare(`
    insert into pastes (
      id, title, language, is_encrypted, encryption_iv, encryption_salt,
      burn_after, expires_at, view_count, size_bytes, r2_key,
      created_at, ip_hash, metadata
    ) values (
      @id, @title, @language, @is_encrypted, @encryption_iv, @encryption_salt,
      @burn_after, @expires_at, @view_count, @size_bytes, @r2_key,
      @created_at, @ip_hash, @metadata
    )
    on conflict(id) do update set
      title = excluded.title,
      language = excluded.language,
      is_encrypted = excluded.is_encrypted,
      encryption_iv = excluded.encryption_iv,
      encryption_salt = excluded.encryption_salt,
      burn_after = excluded.burn_after,
      expires_at = excluded.expires_at,
      view_count = excluded.view_count,
      size_bytes = excluded.size_bytes,
      r2_key = excluded.r2_key,
      created_at = excluded.created_at,
      ip_hash = excluded.ip_hash,
      metadata = excluded.metadata
  `)

  const run = db.transaction((items) => {
    for (const r of items) {
      upsert.run({
        id: r.id,
        title: r.title,
        language: r.language,
        // SQLite has no boolean type; Drizzle's mode:'boolean' reads 0/1.
        is_encrypted: r.is_encrypted ? 1 : 0,
        encryption_iv: r.encryption_iv,
        encryption_salt: r.encryption_salt,
        burn_after: r.burn_after ? 1 : 0,
        expires_at: toUnix(r.expires_at),
        view_count: r.view_count,
        size_bytes: r.size_bytes,
        r2_key: r.r2_key,
        created_at: toUnix(r.created_at),
        ip_hash: r.ip_hash,
        metadata: r.metadata === null ? null : JSON.stringify(r.metadata),
      })
    }
  })

  run(rows)

  const { c: total } = db.prepare('select count(*) c from pastes').get()
  console.log(`Wrote ${rows.length} rows`)
  console.log(`Target (SQLite):   ${total} rows -> ${DB_PATH}`)

  // Verify the rows most likely to expose a type-mapping bug.
  const checks = rows
    .filter((r) => r.is_encrypted || r.burn_after || r.expires_at)
    .slice(0, 15)
  console.log(`\nVerifying ${checks.length} encrypted/burn/expiring rows...`)
  let failed = 0
  const get = db.prepare('select * from pastes where id = ?')
  for (const r of checks) {
    const got = get.get(r.id)
    const ok =
      !!got &&
      got.is_encrypted === (r.is_encrypted ? 1 : 0) &&
      got.burn_after === (r.burn_after ? 1 : 0) &&
      got.view_count === r.view_count &&
      got.r2_key === r.r2_key &&
      got.expires_at === toUnix(r.expires_at)
    if (!ok) failed++
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${r.id}`)
  }

  db.close()
  await sql.end()

  if (failed > 0) {
    console.error(`\n${failed} row(s) failed verification.`)
    process.exit(1)
  }
  console.log('\nMigration complete.')
} catch (err) {
  console.error(err)
  await sql.end({ timeout: 5 }).catch(() => {})
  process.exit(1)
}
