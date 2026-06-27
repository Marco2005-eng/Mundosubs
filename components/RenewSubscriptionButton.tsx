'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'

export function RenewSubscriptionButton({ subscriptionId, label = 'Renovar' }: {
  subscriptionId: string
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function renew() {
    setLoading(true)
    setError('')

    const res = await fetch(`/api/subscriptions/${subscriptionId}/renew`, {
      method: 'POST',
    })
    const result = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok || !result.orderId) {
      setError(result.error || 'No se pudo crear la renovación')
      return
    }

    router.push(`/checkout/${result.orderId}`)
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <button
        type="button"
        onClick={renew}
        disabled={loading}
        style={{
          minHeight: 38,
          border: 'none',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {loading ? 'Creando...' : label}
      </button>
      {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: 0 }}>{error}</p>}
    </div>
  )
}
