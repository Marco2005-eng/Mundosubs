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
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: 18, height: 18 }}>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.2-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
      )}
      {mode === 'register' ? 'Registrarme con Google' : 'Continuar con Google'}
    </button>
  )
}
