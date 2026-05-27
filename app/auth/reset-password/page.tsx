'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function prepareRecoverySession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      const urlError = hash.get('error_description') || hash.get('error')

      if (urlError) {
        setError(decodeURIComponent(urlError).replace(/\+/g, ' '))
        setCheckingSession(false)
        return
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        window.history.replaceState(null, '', window.location.pathname)

        if (sessionError) {
          setError('El enlace expiro o no es valido. Solicita uno nuevo.')
          setCheckingSession(false)
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('El enlace expiro o no es valido. Solicita uno nuevo.')
      }
      setCheckingSession(false)
    }

    prepareRecoverySession()
  }, [supabase])

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
    const { data: userData } = await supabase.auth.getUser()
    const metadata = userData.user?.user_metadata ?? {}
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        ...metadata,
        password_set: true,
      },
    })
    setLoading(false)

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la contrasena')
      return
    }

    setSuccess(true)
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', background: '#f6f8fc', padding: '20px' }}>
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: 460,
        margin: 'auto',
        background: '#ffffff',
        border: '1px solid #d8e0ec',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 22px 48px rgba(15, 23, 42, 0.12)',
      }}>
        <h1 style={{ color: '#0f172a', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px' }}>
          Nueva contrasena
        </h1>
        <p style={{ color: '#52627a', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 22 }}>
          Crea una nueva contrasena para entrar con tu correo en cualquier dispositivo.
        </p>

        {checkingSession ? (
          <div style={{ minHeight: 160, display: 'grid', placeItems: 'center', color: '#52627a' }}>
            <Loader2 className="animate-spin" style={{ width: 24, height: 24 }} />
          </div>
        ) : success ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ color: '#16a34a', fontWeight: 800, margin: 0 }}>
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
            {error && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading || error.includes('enlace expiro')} style={{
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
              cursor: loading || error.includes('enlace expiro') ? 'not-allowed' : 'pointer',
              opacity: loading || error.includes('enlace expiro') ? 0.75 : 1,
            }}>
              {loading && <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />}
              Guardar contrasena
            </button>
            {error.includes('enlace expiro') && (
              <Link href="/auth/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.86rem', fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}>
                Solicitar un nuevo enlace
              </Link>
            )}
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
    <label style={{ display: 'grid', gap: 6, color: '#0f172a', fontSize: '0.86rem', fontWeight: 700 }}>
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
            color: '#64748b',
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
