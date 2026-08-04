import { db } from '@/lib/db'
import { pastes } from '@/lib/db/schema'
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm'
import { generatePasteId } from '@/lib/id'
import { uploadContent, getContent, deleteContent } from './storage.service'
import type { CreatePasteInput, PasteWithContent, PasteMetadata } from '@/types'

// ---------------------------------------------------------------------------
// Reads and writes are deliberately separated.
//
// Rendering a paste page must never mutate, because under Cache Components a
// page body, its generateMetadata, and a prefetched shell can each render in
// their own scope. If the view-count increment lived in the read path, those
// scopes would each apply it — double-counting views and destroying
// burn-after-read pastes before the recipient ever saw them.
//
// So: read* functions are pure. recordView() is the single mutation, and the
// page calls it exactly once at request time.
// ---------------------------------------------------------------------------

function computeExpiresAt(expiresIn: string): Date | null {
  const now = new Date()
  switch (expiresIn) {
    case '10m': return new Date(now.getTime() + 10 * 60 * 1000)
    case '1h': return new Date(now.getTime() + 60 * 60 * 1000)
    case '1d': return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case '1w': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case '1M': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    default: return null
  }
}

function isExpired(expiresAt: Date | null): boolean {
  return expiresAt !== null && new Date() > expiresAt
}

export async function createPaste(
  input: CreatePasteInput,
  ipHash?: string
): Promise<{ id: string }> {
  const id = generatePasteId()
  const r2Key = `pastes/${id}`
  const sizeBytes = new TextEncoder().encode(input.content).length

  await uploadContent(r2Key, input.content)

  const expiresAt = computeExpiresAt(input.expiresIn)

  await db.insert(pastes).values({
    id,
    title: input.title || null,
    language: input.language,
    isEncrypted: input.isEncrypted,
    encryptionIv: input.encryptionIv || null,
    encryptionSalt: input.encryptionSalt || null,
    burnAfter: input.burnAfter,
    expiresAt,
    sizeBytes,
    r2Key,
    ipHash: ipHash || null,
    metadata: null,
  })

  return { id }
}

// --- Reads (pure) ----------------------------------------------------------

/**
 * Reads a paste and its content. Never mutates. Expired pastes read as absent;
 * reclaiming their storage is the janitor's job (see cleanupExpiredPastes).
 */
export async function readPaste(id: string): Promise<PasteWithContent | null> {
  const [paste] = await db.select().from(pastes).where(eq(pastes.id, id)).limit(1)

  if (!paste || isExpired(paste.expiresAt)) return null

  const content = await getContent(paste.r2Key)

  return {
    id: paste.id,
    title: paste.title,
    language: paste.language,
    isEncrypted: paste.isEncrypted,
    encryptionIv: paste.encryptionIv,
    encryptionSalt: paste.encryptionSalt,
    burnAfter: paste.burnAfter,
    expiresAt: paste.expiresAt,
    viewCount: paste.viewCount,
    sizeBytes: paste.sizeBytes,
    createdAt: paste.createdAt,
    metadata: paste.metadata,
    content,
  }
}

/** Metadata only — no R2 fetch, no mutation. Used by generateMetadata and OG images. */
export async function readPasteMetadata(id: string): Promise<PasteMetadata | null> {
  const [paste] = await db.select().from(pastes).where(eq(pastes.id, id)).limit(1)

  if (!paste || isExpired(paste.expiresAt)) return null

  return {
    id: paste.id,
    title: paste.title,
    language: paste.language,
    isEncrypted: paste.isEncrypted,
    encryptionIv: paste.encryptionIv,
    encryptionSalt: paste.encryptionSalt,
    burnAfter: paste.burnAfter,
    expiresAt: paste.expiresAt,
    viewCount: paste.viewCount,
    sizeBytes: paste.sizeBytes,
    createdAt: paste.createdAt,
    metadata: paste.metadata,
  }
}

export async function getRawContent(id: string): Promise<string | null> {
  const [paste] = await db
    .select({ r2Key: pastes.r2Key, expiresAt: pastes.expiresAt })
    .from(pastes)
    .where(eq(pastes.id, id))
    .limit(1)

  if (!paste || isExpired(paste.expiresAt)) return null

  return getContent(paste.r2Key)
}

// --- Writes ----------------------------------------------------------------

/**
 * Records exactly one view. Must only be called at request time, once per real
 * page view — never from generateMetadata, a prerender, or a prefetch.
 *
 * Burn-after-read deletes on the 2nd view: the creator's own post-create
 * redirect is view 1, the recipient is view 2.
 */
export async function recordView(id: string): Promise<void> {
  const [paste] = await db
    .select({
      r2Key: pastes.r2Key,
      burnAfter: pastes.burnAfter,
      expiresAt: pastes.expiresAt,
    })
    .from(pastes)
    .where(eq(pastes.id, id))
    .limit(1)

  if (!paste) return

  // Atomic increment; returns the post-increment value so two concurrent
  // viewers can't both read the same count and under-count the burn.
  const [updated] = await db
    .update(pastes)
    .set({ viewCount: sql`${pastes.viewCount} + 1` })
    .where(eq(pastes.id, id))
    .returning({ viewCount: pastes.viewCount })

  if (!updated) return

  if (paste.burnAfter && updated.viewCount >= 2) {
    await deletePaste(id, paste.r2Key)
  } else if (isExpired(paste.expiresAt)) {
    await deletePaste(id, paste.r2Key)
  }
}

async function deletePaste(id: string, r2Key: string): Promise<void> {
  await deleteContent(r2Key)
  await db.delete(pastes).where(eq(pastes.id, id))
}

/**
 * Reclaims storage for pastes past their expiry. Expired pastes already read as
 * absent; this is what actually removes the row and the R2 object, so it must
 * run on a schedule (see lib/janitor.ts) rather than only when someone happens
 * to visit an expired paste.
 */
export async function cleanupExpiredPastes(): Promise<number> {
  const expired = await db
    .select({ id: pastes.id, r2Key: pastes.r2Key })
    .from(pastes)
    .where(and(isNotNull(pastes.expiresAt), lt(pastes.expiresAt, new Date())))
    .limit(100)

  for (const paste of expired) {
    await deletePaste(paste.id, paste.r2Key)
  }

  return expired.length
}
