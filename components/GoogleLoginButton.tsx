'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface GoogleLoginButtonProps {
  mode: 'login' | 'register'
  onError: (message: string) => void
}

export function GoogleLoginButton({ mode, onError }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  function continueWithGoogle() {
    setLoading(true)
    onError('')

    try {
      const next = mode === 'register' ? '/' : window.location.search.includes('next=')
        ? new URLSearchParams(window.location.search).get('next') || '/'
        : '/'

      window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`
    } catch {
      setLoading(false)
      onError('No se pudo abrir Google. Intenta nuevamente.')
    }
  }

  return (
    <button
      type="button"
      onClick={continueWithGoogle}
      disabled={loading}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '11px 14px',
        border: '1px solid var(--border2)',
        borderRadius: '8px',
        background: 'var(--card)',
        color: 'var(--text)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '0.92rem',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        opacity: loading ? 0.75 : 1,
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
      ) : (
        <span aria-hidden="true" style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'inline-grid',
          placeItems: 'center',
          background: '#fff',
          color: '#111827',
          fontWeight: 900,
          fontSize: 13,
          lineHeight: 1,
        }}>
          G
        </span>
      )}
      {mode === 'register' ? 'Registrarme con Google' : 'Continuar con Google'}
    </button>
  )
}
