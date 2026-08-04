import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

const MIGRATIONS_FOLDER = './lib/db/migrations'

function createDb(): Db {
  // Railway mounts a volume at /data; locally the DB lives in .data/ (gitignored).
  // Kept as a bare relative/absolute string — passing it through path.resolve()
  // makes Turbopack trace the whole project into the server output.
  const file = process.env.DATABASE_PATH || './.data/bin21.db'

  // Local dev only: create the parent directory. On Railway the volume mount
  // already provides it.
  if (process.env.NODE_ENV !== 'production') {
    const dir = dirname(file)
    if (!existsSync(/* turbopackIgnore: true */ dir)) {
      mkdirSync(/* turbopackIgnore: true */ dir, { recursive: true })
    }
  }

  const sqlite = new Database(file)

  // WAL lets reads proceed during a write; NORMAL trades an fsync per commit for
  // throughput (safe under WAL — only an OS-level crash can lose a transaction).
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  sqlite.pragma('busy_timeout = 5000')
  sqlite.pragma('foreign_keys = ON')

  const db = drizzle(sqlite, { schema })

  // Safe to migrate on boot: the Railway volume forbids replicas, so exactly one
  // process ever owns this file.
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })

  return db
}

let _db: Db | null = null

function getDb(): Db {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

/**
 * Opens the database and applies migrations immediately.
 *
 * Called from instrumentation.ts at server startup. Without this the connection
 * is only made on the first request that touches the DB, so a freshly deployed
 * instance would have no schema on its volume until someone happened to view a
 * paste — which makes a deploy-then-import sequence impossible to reason about.
 */
export function initDb(): void {
  getDb()
}

export const db = new Proxy({} as Db, {
  get(_target, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
