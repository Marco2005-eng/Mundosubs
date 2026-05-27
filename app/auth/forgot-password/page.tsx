'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailCheck } from 'lucide-react'
import { allowedEmailDomainMessage, hasAllowedEmailDomain } from '@/lib/email-validation'

const schema = z.object({
  email: z.string().email('Email invalido').refine(hasAllowedEmailDomain, allowedEmailDomainMessage),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/password/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
    })

    const result = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(result.error || 'No se pudo enviar el correo')
      return
    }

    setSent(true)
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
        <Link href="/auth/login" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Volver a iniciar sesion
        </Link>

        <h1 style={{ color: 'var(--text)', fontSize: '1.45rem', fontWeight: 800, margin: '24px 0 8px' }}>
          Recuperar contrasena
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 22 }}>
          Escribe tu correo y te enviaremos un enlace para crear una nueva contrasena.
        </p>

        {sent ? (
          <div style={{ display: 'grid', gap: 14, textAlign: 'center', padding: '18px 0' }}>
            <MailCheck style={{ width: 42, height: 42, color: 'var(--green)', margin: '0 auto' }} />
            <strong style={{ color: 'var(--text)' }}>Revisa tu correo</strong>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, color: 'var(--text)', fontSize: '0.86rem', fontWeight: 700 }}>
              Correo electronico
              <input
                type="email"
                {...register('email')}
                className="input-dark"
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </label>
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: 0 }}>{errors.email.message}</p>}
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
              Enviar enlace
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
