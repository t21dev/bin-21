import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

function createDb(): Database {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const client = postgres(connectionString)
  return drizzle(client, { schema })
}

let _db: Database | null = null

function getDb(): Database {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

export const db = new Proxy({} as Database, {
  get(_target, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
