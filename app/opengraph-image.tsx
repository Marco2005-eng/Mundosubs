import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MUNDOSUBS - Suscripciones digitales en soles peruanos'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 56%, #fff7ed 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 78,
          color: '#1e293b',
          fontFamily: 'Arial',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#7c3aed',
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          MUNDOSUBS
        </div>
        <div
          style={{
            marginTop: 32,
            maxWidth: 880,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.04,
          }}
        >
          Suscripciones digitales en soles peruanos
        </div>
        <div
          style={{
            marginTop: 28,
            maxWidth: 760,
            color: '#64748b',
            fontSize: 30,
            lineHeight: 1.35,
          }}
        >
          Streaming, juegos y software con pagos locales y soporte por WhatsApp.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 42,
          }}
        >
          {['Streaming', 'Juegos', 'Software', 'Yape / Plin'].map((item) => (
            <span
              key={item}
              style={{
                border: '1px solid #c4b5fd',
                borderRadius: 999,
                background: 'rgba(124, 58, 237, 0.1)',
                color: '#6d28d9',
                fontSize: 24,
                fontWeight: 700,
                padding: '12px 20px',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    ),
    size
  )
}
