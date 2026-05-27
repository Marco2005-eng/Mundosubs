'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import { allowedEmailDomainMessage, hasAllowedEmailDomain } from '@/lib/email-validation'

const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email invalido').max(255, 'Email muy largo').refine(hasAllowedEmailDomain, allowedEmailDomainMessage),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contrasena'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: data.name.trim(),
      }),
    })

    const result = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(result.error || 'Error al crear cuenta')
      return
    }

    window.location.href = '/auth/login?registered=1'
  }

  return (
    <div className="auth-page" style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--background)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <AuthBackground />

      <Link href="/" style={backLinkStyle}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver al sitio
      </Link>

      <div style={cardStyle}>
        <div className="auth-card-body" style={bodyStyle}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
            <Link href="/auth/login" style={inactiveTabStyle}>Iniciar sesion</Link>
            <button type="button" style={activeTabStyle}>Crear cuenta</button>
          </div>

          <h2 style={titleStyle}>Crea tu cuenta</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
            Registrate para comenzar a comprar.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <GoogleLoginButton mode="register" onError={setError} />
          </div>

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Tu nombre"
                className="input-dark"
                style={{ width: '100%' }}
                autoComplete="name"
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </div>

            <div>
              <label style={labelStyle}>Correo electronico</label>
              <input
                type="email"
                {...register('email')}
                placeholder="tu@correo.com"
                className="input-dark"
                style={{ width: '100%' }}
                autoComplete="email"
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </div>

            <div>
              <label style={labelStyle}>Contrasena</label>
              <PasswordInput
                visible={showPassword}
                toggle={() => setShowPassword((value) => !value)}
                registration={register('password')}
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
              />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </div>

            <div>
              <label style={labelStyle}>Confirmar contrasena</label>
              <PasswordInput
                visible={showConfirmPassword}
                toggle={() => setShowConfirmPassword((value) => !value)}
                registration={register('confirmPassword')}
                placeholder="Repite tu contrasena"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? <Loader2 className="animate-spin" /> : 'Crear mi cuenta'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
              Ya tienes cuenta?{' '}
              <Link href="/auth/login" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>
                Inicia sesion
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function AuthBackground() {
  return (
    <>
      <div style={{
        position: 'fixed',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        top: '-200px',
        left: '-200px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
        bottom: '-150px',
        right: '-150px',
        pointerEvents: 'none',
      }} />
    </>
  )
}

function Separator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>o con tu correo</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
    </div>
  )
}

function PasswordInput({
  visible,
  toggle,
  registration,
  placeholder,
  autoComplete,
}: {
  visible: boolean
  toggle: () => void
  registration: any
  placeholder: string
  autoComplete: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        {...registration}
        placeholder={placeholder}
        className="input-dark"
        style={{ width: '100%', paddingRight: '44px' }}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '32px',
          height: '32px',
          border: 'none',
          borderRadius: '8px',
          background: 'transparent',
          color: 'var(--muted)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
        }}
      >
        {visible ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
      </button>
    </div>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{children}</span>
}

const backLinkStyle = {
  position: 'fixed' as const,
  top: '20px',
  left: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--muted)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  zIndex: 10,
}

const cardStyle = {
  display: 'flex',
  width: '100%',
  maxWidth: '1000px',
  margin: 'auto',
  borderRadius: '16px',
  overflow: 'hidden',
  background: 'var(--card)',
  border: '1px solid var(--border2)',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  position: 'relative' as const,
  zIndex: 1,
}

const bodyStyle = {
  flex: 1,
  padding: '40px',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
}

const activeTabStyle = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: '8px',
  background: 'var(--accent)',
  color: 'white',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: '0.9rem',
}

const inactiveTabStyle = {
  ...activeTabStyle,
  background: 'transparent',
  color: 'var(--muted)',
  fontWeight: 500,
  textAlign: 'center' as const,
  textDecoration: 'none',
}

const titleStyle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: '8px',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: '6px',
  color: 'var(--text)',
}

function submitStyle(loading: boolean) {
  return {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    color: 'white',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }
}
