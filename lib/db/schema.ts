import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const pastes = sqliteTable(
  'pastes',
  {
    id: text('id').primaryKey(),
    title: text('title'),
    language: text('language').default('text').notNull(),
    isEncrypted: integer('is_encrypted', { mode: 'boolean' }).default(false).notNull(),
    encryptionIv: text('encryption_iv'),
    encryptionSalt: text('encryption_salt'),
    burnAfter: integer('burn_after', { mode: 'boolean' }).default(false).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    viewCount: integer('view_count').default(0).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    r2Key: text('r2_key').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    ipHash: text('ip_hash'),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (table) => [index('pastes_expires_at_idx').on(table.expiresAt)]
)

export type Paste = typeof pastes.$inferSelect
export type NewPaste = typeof pastes.$inferInsert
