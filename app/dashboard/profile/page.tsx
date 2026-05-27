'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Phone, MapPin, Calendar, Save, Loader2, Lock, Eye, EyeOff } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  address?: string
  role: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    async function loadProfile() {
      const stored = localStorage.getItem('user')
      if (!stored) {
        router.push('/auth/login')
        return
      }

      try {
        const res = await fetch('/api/auth/profile', { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar el perfil')
        const result = await res.json()
        const userData = result.user
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setFormData({
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          address: userData.address || ''
        })
      } catch {
        const userData = JSON.parse(stored)
        setUser(userData)
        setFormData({
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          address: userData.address || ''
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()

      if (res.ok) {
        const updated = { ...user!, ...result.user }
        localStorage.setItem('user', JSON.stringify(updated))
        setUser(updated)
        setFormData({
          full_name: updated.full_name || '',
          phone: updated.phone || '',
          address: updated.address || ''
        })
        setSuccess('Perfil actualizado correctamente')
      } else {
        setError(result.error || 'Error al actualizar')
      }
    } catch (err) {
      setError('Error de conexión')
    }

    setSaving(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const result = await res.json()

      if (res.ok) {
        setSuccess('Contraseña cambiada correctamente')
        setShowPasswordForm(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setError(result.error || 'Error al cambiar contraseña')
      }
    } catch (err) {
      setError('Error de conexión')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link href="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'var(--bg3)',
          color: 'var(--muted)',
          textDecoration: 'none'
        }}>
          ←
        </Link>
        <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
          Mi Perfil
        </h1>
      </div>

      {success && (
        <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: 'var(--green)', marginBottom: '20px' }}>
          ✓ {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Foto de perfil */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--hot))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Unbounded', sans-serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'white',
            margin: '0 auto 16px'
          }}>
            {(formData.full_name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Tu foto se genera automáticamente con tu nombre
          </p>
        </div>

        {/* Datos personales */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
            Datos personales
          </h2>
          
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                <User style={{ width: '16px', height: '16px' }} />
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-dark"
                style={{ width: '100%' }}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                <Mail style={{ width: '16px', height: '16px' }} />
                Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-dark"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                <Phone style={{ width: '16px', height: '16px' }} />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-dark"
                style={{ width: '100%' }}
                placeholder="+51 999 999 999"
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                <MapPin style={{ width: '16px', height: '16px' }} />
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-dark"
                style={{ width: '100%' }}
                placeholder="Tu dirección"
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                <Calendar style={{ width: '16px', height: '16px' }} />
                Fecha de registro
              </label>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-PE') : 'No disponible'}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save style={{ width: '18px', height: '18px' }} />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock style={{ width: '20px', height: '20px' }} />
              Cambiar contraseña
            </h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                color: 'var(--text)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {showPasswordForm ? 'Cancelar' : 'Cambiar'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                  Contraseña actual
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-dark"
                    style={{ width: '100%', paddingRight: '40px' }}
                    placeholder="Tu contraseña actual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showCurrentPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                  Nueva contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-dark"
                    style={{ width: '100%', paddingRight: '40px' }}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input-dark"
                  style={{ width: '100%' }}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? <Loader2 className="animate-spin" /> : 'Cambiar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
