import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'pudim.dev - Dev Pudim Score Calculator'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#fef3c7',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background pudim emoji */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '-100px',
            right: '-80px',
            fontSize: '400px',
            opacity: 0.1,
          }}
        >
          🍮
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '40px',
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 120,
                fontWeight: 900,
                color: '#1f2937',
                letterSpacing: '-0.02em',
              }}
            >
              pudim.dev
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 80,
              }}
            >
              🍮
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 48,
                fontWeight: 'bold',
                color: '#d97706',
              }}
            >
              Calculate Your Dev Pudim Score
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              Gamify your GitHub stats with dessert-themed ranks
            </div>
          </div>

          {/* Ranks preview */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 'bold', color: '#f59e0b' }}>
                S+
              </div>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b7280' }}>
                Legendary Flan
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 'bold', color: '#ca8a04' }}>
                S
              </div>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b7280' }}>
                Master Pudim
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 'bold', color: '#f97316' }}>
                A
              </div>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b7280' }}>
                Tasty Pudding
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

