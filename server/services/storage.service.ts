import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
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

export async function getContent(key: string): Promise<string> {
  const client = getS3Client()
  const response = await client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
  return (await response.Body?.transformToString('utf-8')) ?? ''
}

export async function deleteContent(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}
