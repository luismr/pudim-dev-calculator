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
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Only the pudim icon - large and centered */}
        <div
          style={{
            display: 'flex',
            fontSize: '800px',
            lineHeight: 1,
          }}
        >
          🍮
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

