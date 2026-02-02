export type ExpiresIn = 'never' | '10m' | '1h' | '1d' | '1w' | '1M'

export interface CreatePasteInput {
  content: string
  title?: string
  language: string
  isEncrypted: boolean
  encryptionIv?: string
  encryptionSalt?: string
  expiresIn: ExpiresIn
  burnAfter: boolean
}

export interface PasteMetadata {
  id: string
  title: string | null
  language: string
  isEncrypted: boolean
  encryptionIv: string | null
  encryptionSalt: string | null
  burnAfter: boolean
  expiresAt: Date | null
  viewCount: number
  sizeBytes: number
  createdAt: Date
  metadata: Record<string, unknown> | null
}

export interface PasteWithContent extends PasteMetadata {
  content: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
