'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function SetPasswordPage() {
  const [nextUrl, setNextUrl] = useState('/')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next') || '/'
    setNextUrl(next.startsWith('/') ? next : '/')
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/password/set', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const result = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(result.error || 'No se pudo crear la contraseña')
      return
    }

    window.location.href = nextUrl
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', background: '#f6f8fc', padding: '20px' }}>
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: 470,
        margin: 'auto',
        background: '#ffffff',
        border: '1px solid #d8e0ec',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 22px 48px rgba(15, 23, 42, 0.12)',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(124,58,237,0.1)',
          color: 'var(--accent)',
          marginBottom: 16,
        }}>
          <ShieldCheck style={{ width: 24, height: 24 }} />
        </div>

        <h1 style={{ color: '#0f172a', fontSize: '1.45rem', fontWeight: 850, margin: '0 0 8px' }}>
          Crea tu contraseña MUNDOSUBS
        </h1>
        <p style={{ color: '#52627a', fontSize: '0.92rem', lineHeight: 1.55, marginBottom: 22 }}>
          Entraste con Google. Crea una contraseña para que también puedas iniciar sesión con tu correo en otro dispositivo.
        </p>

        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <PasswordField
            label="Nueva contraseña"
            value={password}
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            onChange={setPassword}
          />
          <PasswordField
            label="Confirmar contraseña"
            value={confirmPassword}
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
            onChange={setConfirmPassword}
          />

          {error && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            minHeight: 44,
            border: 'none',
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: 'white',
            fontWeight: 850,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1,
          }}>
            {loading && <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />}
            Guardar y continuar
          </button>

          <Link href={nextUrl} style={{ color: '#64748b', textAlign: 'center', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 700 }}>
            Ahora no
          </Link>
        </form>
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  visible,
  onToggle,
  onChange,
}: {
  label: string
  value: string
  visible: boolean
  onToggle: () => void
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: 6, color: '#0f172a', fontSize: '0.86rem', fontWeight: 750 }}>
      {label}
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-dark"
          style={{
            width: '100%',
            paddingRight: 44,
            background: '#eef3f9',
            border: '1px solid #ccd6e4',
            color: '#0f172a',
          }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            border: 'none',
            borderRadius: 8,
            background: 'transparent',
            color: '#64748b',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          {visible ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
        </button>
      </div>
    </label>
  )
}
