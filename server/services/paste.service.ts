import { db } from '@/lib/db'
import { pastes } from '@/lib/db/schema'
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm'
import { generatePasteId } from '@/lib/id'
import { uploadContent, getContent, deleteContent } from './storage.service'
import type { CreatePasteInput, PasteWithContent, PasteMetadata } from '@/types'

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

export async function getPaste(id: string): Promise<PasteWithContent | null> {
  const [paste] = await db
    .select()
    .from(pastes)
    .where(eq(pastes.id, id))
    .limit(1)

  if (!paste) return null

  // Check expiration
  if (paste.expiresAt && new Date() > paste.expiresAt) {
    await deletePaste(id, paste.r2Key)
    return null
  }

  const content = await getContent(paste.r2Key)

  // Increment view count
  await db
    .update(pastes)
    .set({ viewCount: sql`${pastes.viewCount} + 1` })
    .where(eq(pastes.id, id))

  // If burn after reading, delete after 2 views (creator redirect + recipient)
  if (paste.burnAfter && paste.viewCount + 1 >= 2) {
    await deletePaste(id, paste.r2Key)
  }

  return {
    id: paste.id,
    title: paste.title,
    language: paste.language,
    isEncrypted: paste.isEncrypted,
    encryptionIv: paste.encryptionIv,
    encryptionSalt: paste.encryptionSalt,
    burnAfter: paste.burnAfter,
    expiresAt: paste.expiresAt,
    viewCount: paste.viewCount + 1,
    sizeBytes: paste.sizeBytes,
    createdAt: paste.createdAt,
    metadata: paste.metadata,
    content,
  }
}

export async function getPasteMetadata(id: string): Promise<PasteMetadata | null> {
  const [paste] = await db
    .select()
    .from(pastes)
    .where(eq(pastes.id, id))
    .limit(1)

  if (!paste) return null

  if (paste.expiresAt && new Date() > paste.expiresAt) {
    await deletePaste(id, paste.r2Key)
    return null
  }

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

  if (!paste) return null

  if (paste.expiresAt && new Date() > paste.expiresAt) {
    return null
  }

  return getContent(paste.r2Key)
}

async function deletePaste(id: string, r2Key: string): Promise<void> {
  await deleteContent(r2Key)
  await db.delete(pastes).where(eq(pastes.id, id))
}

export async function cleanupExpiredPastes(): Promise<number> {
  const expired = await db
    .select({ id: pastes.id, r2Key: pastes.r2Key })
    .from(pastes)
    .where(
      and(
        isNotNull(pastes.expiresAt),
        lt(pastes.expiresAt, new Date())
      )
    )
    .limit(100)

  for (const paste of expired) {
    await deletePaste(paste.id, paste.r2Key)
  }

  return expired.length
}
