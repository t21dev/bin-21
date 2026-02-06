import { ImageResponse } from 'next/og'
import { getPasteMetadata } from '@/server/services/paste.service'

export const runtime = 'edge'

export const alt = 'Bin 21 Paste'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paste = await getPasteMetadata(id)

  if (!paste) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            color: '#94A3B8',
            fontSize: 48,
            fontFamily: 'monospace',
          }}
        >
          Paste not found
        </div>
      ),
      { ...size }
    )
  }

  const title = paste.title || 'Untitled'
  const badges: string[] = []
  if (paste.language && paste.language !== 'plaintext') badges.push(paste.language)
  if (paste.isEncrypted) badges.push('Encrypted')
  badges.push(formatSize(paste.sizeBytes))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          backgroundColor: '#0A0A0A',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(74, 222, 128, 0.06) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(52, 211, 153, 0.06) 0%, transparent 50%)',
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: 'absolute',
            inset: 16,
            border: '2px solid rgba(74, 222, 128, 0.15)',
            borderRadius: 24,
            display: 'flex',
          }}
        />

        {/* Top: Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#F8FAFC',
              fontFamily: 'monospace',
              letterSpacing: '-0.04em',
            }}
          >
            Bin
          </span>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#4ADE80',
              fontFamily: 'monospace',
              letterSpacing: '-0.04em',
            }}
          >
            21
          </span>
        </div>

        {/* Center: Paste title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#F8FAFC',
              fontFamily: 'sans-serif',
              lineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {title.length > 60 ? title.slice(0, 57) + '...' : title}
          </span>

          {/* Badges */}
          <div
            style={{
              display: 'flex',
              gap: 16,
            }}
          >
            {badges.map((badge) => (
              <div
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                  borderRadius: 8,
                  padding: '8px 20px',
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    color: '#4ADE80',
                    fontFamily: 'monospace',
                  }}
                >
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 120,
            right: 120,
            height: 3,
            borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, #4ADE80, transparent)',
            opacity: 0.3,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
