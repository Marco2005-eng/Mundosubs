'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Check if already logged in via the server session.
  useEffect(() => {
    if (typeof window === 'undefined') return

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        const user = data?.user
        if (user?.role === 'admin') {
          window.location.href = '/admin'
        } else if (user) {
          window.location.href = '/'
        }
      })
      .catch(() => {})
  }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    })

    const result = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(result.error || 'Credenciales incorrectas')
      return
    }

    // Guardar usuario en localStorage para acceso rápido desde el cliente
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(result.user))
    }

    const isAdmin = result.user?.role === 'admin'
    // Force navigation without refresh to avoid page reload issues
    window.location.href = isAdmin ? '/admin' : '/'
  }

  return (
    <div className="auth-page" style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--background)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs */}
      <div className="auth-card" style={{
        position: 'fixed',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        top: '-200px',
        left: '-200px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
        bottom: '-150px',
        right: '-150px',
        pointerEvents: 'none'
      }} />

      {/* Back to site */}
      <Link href="/" style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--muted)',
        textDecoration: 'none',
        fontSize: '0.9rem',
        zIndex: 10
      }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Volver al sitio
      </Link>

      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1000px',
        margin: 'auto',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Right Panel - Form */}
        <div className="auth-card-body" style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
            <button style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: 'white',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              Iniciar sesión
            </button>
            <Link href="/auth/register" style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--muted)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none'
            }}>
              Crear cuenta
            </Link>
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '8px'
          }}>
            Bienvenido de vuelta 👋
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
            Ingresa tus credenciales para continuar
          </p>

          {/* Google Button */}
          <div style={{ marginBottom: '20px' }}>
            <GoogleLoginButton mode="login" onError={setError} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>o con tu correo</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text)' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="tu@correo.com"
                className="input-dark"
                style={{ width: '100%' }}
              />
              {errors.email && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                {errors.email.message}
              </span>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text)' }}>
                Contraseña
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="input-dark"
                style={{ width: '100%' }}
              />
              {errors.password && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                {errors.password.message}
              </span>
              )}
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Iniciar sesión'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>
                Regístrate gratis
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
