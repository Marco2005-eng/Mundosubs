'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Settings, Phone, Mail, Building } from 'lucide-react'

type SettingKey = 'whatsapp_number' | 'business_name' | 'contact_email'
const SETTINGS_KEYS: SettingKey[] = ['whatsapp_number', 'business_name', 'contact_email']

const LABELS: Record<SettingKey, string> = {
  whatsapp_number: 'Número de WhatsApp',
  business_name: 'Nombre del negocio',
  contact_email: 'Email de contacto',
}

const ICONS: Record<SettingKey, any> = {
  whatsapp_number: Phone,
  business_name: Building,
  contact_email: Mail,
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<SettingKey, string>>({
    whatsapp_number: '',
    business_name: '',
    contact_email: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('settings')
      .select('key, value')
      .in('key', [...SETTINGS_KEYS])
      .then(({ data }) => {
        if (!data) return
        const map = Object.fromEntries(data.map((r) => [r.key, r.value])) as Record<SettingKey, string>
        setValues((prev) => ({ ...prev, ...map }))
      })
  }, [])

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    for (const [key, value] of Object.entries(values)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ padding: '40px 5%', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{
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
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </Link>
          <div>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text)'
            }}>
              Configuración
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Ajustes generales del sitio
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings style={{ width: '18px', height: '18px' }} /> Configuración general
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {SETTINGS_KEYS.map((key) => {
            const Icon = ICONS[key]
            return (
              <div key={key}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>
                  <Icon style={{ width: '16px', height: '16px', color: 'var(--muted)' }} />
                  {LABELS[key]}
                </label>
                <input
                  type={key === 'contact_email' ? 'email' : 'text'}
                  value={values[key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="input-dark"
                  style={{ width: '100%', maxWidth: '400px' }}
                  placeholder={key === 'whatsapp_number' ? '51900000000' : ''}
                />
              </div>
            )
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px',
            padding: '12px 24px',
            borderRadius: '8px',
            background: saved ? 'var(--green)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? <Loader2 className="animate-spin" /> : saved ? '✓ Guardado' : <><Save style={{ width: '16px', height: '16px' }} /> Guardar cambios</>}
        </button>
      </div>

      {/* Help Text */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(124,58,237,0.1)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: '8px'
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          💡 <strong>Nota:</strong> El número de WhatsApp se usa para el botón de soporte. Asegúrate de incluir el código de país (ej: 51 para Perú).
        </p>
      </div>
    </div>
  )
}