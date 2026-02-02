import { pgTable, varchar, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'

export const pastes = pgTable('pastes', {
  id: varchar('id', { length: 12 }).primaryKey(),
  title: varchar('title', { length: 255 }),
  language: varchar('language', { length: 50 }).default('text').notNull(),
  isEncrypted: boolean('is_encrypted').default(false).notNull(),
  encryptionIv: varchar('encryption_iv', { length: 64 }),
  encryptionSalt: varchar('encryption_salt', { length: 64 }),
  burnAfter: boolean('burn_after').default(false).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  viewCount: integer('view_count').default(0).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  r2Key: varchar('r2_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ipHash: varchar('ip_hash', { length: 64 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
})

export type Paste = typeof pastes.$inferSelect
export type NewPaste = typeof pastes.$inferInsert
