import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Bin 21 - Modern Pastebin'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 96,
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
                fontSize: 96,
                fontWeight: 800,
                color: '#4ADE80',
                fontFamily: 'monospace',
                letterSpacing: '-0.04em',
              }}
            >
              21
            </span>
          </div>

          {/* Tagline */}
          <span
            style={{
              fontSize: 32,
              color: '#94A3B8',
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            Simple. Private. Fast.
          </span>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 16,
            }}
          >
            {['Syntax Highlighting', 'Encryption', 'Markdown'].map((feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                  borderRadius: 8,
                  padding: '8px 20px',
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    color: '#4ADE80',
                    fontFamily: 'monospace',
                  }}
                >
                  {feature}
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
    {
      ...size,
    }
  )
}
