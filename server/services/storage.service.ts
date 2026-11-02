import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { ByteLRU } from '@/lib/lru'

let s3Client: S3Client | null = null

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return s3Client
}

const BUCKET = process.env.R2_BUCKET_NAME || 'bin21-pastes'

export async function uploadContent(key: string, content: string): Promise<void> {
  const client = getS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: 'text/plain; charset=utf-8',
    })
  )
}

/**
 * Recently read paste bodies. A paste's content never changes after creation,
 * so a hit is always correct; deleteContent evicts on burn/expiry. Skips an R2
 * round trip (~100-300ms) for popular pastes. Capped at 4MB of memory, and a
 * single entry over 1MB is never cached.
 */
const contentCache = new ByteLRU(4 * 1024 * 1024, 1024 * 1024)

export async function getContent(key: string): Promise<string> {
  const cached = contentCache.get(key)
  if (cached !== undefined) return cached

  const client = getS3Client()
  const response = await client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
  const body = (await response.Body?.transformToString('utf-8')) ?? ''
  contentCache.set(key, body)
  return body
}

export async function deleteContent(key: string): Promise<void> {
  contentCache.delete(key)
  const client = getS3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}
