'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/password/reset', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const result = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(result.error || 'No se pudo actualizar la contrasena')
      return
    }

    setSuccess(true)
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', background: 'var(--background)', padding: '20px' }}>
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: 460,
        margin: 'auto',
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
      }}>
        <h1 style={{ color: 'var(--text)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px' }}>
          Nueva contrasena
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 22 }}>
          Crea una nueva contrasena para entrar con tu correo en cualquier dispositivo.
        </p>

        {success ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ color: 'var(--green)', fontWeight: 800, margin: 0 }}>
              Tu contrasena fue actualizada.
            </p>
            <Link href="/auth/login" style={{
              minHeight: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}>
              Iniciar sesion
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <PasswordField
              label="Nueva contrasena"
              value={password}
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirmar contrasena"
              value={confirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              minHeight: 44,
              border: 'none',
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}>
              {loading && <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />}
              Guardar contrasena
            </button>
          </form>
        )}
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
  autoComplete,
}: {
  label: string
  value: string
  visible: boolean
  onToggle: () => void
  onChange: (value: string) => void
  autoComplete: string
}) {
  return (
    <label style={{ display: 'grid', gap: 6, color: 'var(--text)', fontSize: '0.86rem', fontWeight: 700 }}>
      {label}
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-dark"
          style={{ width: '100%', paddingRight: 44 }}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
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
            color: 'var(--muted)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {visible ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
        </button>
      </div>
    </label>
  )
}
