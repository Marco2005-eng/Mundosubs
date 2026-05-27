'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react'

interface AccessRow {
  id: string
  login_url: string | null
  account_email: string | null
  account_password: string | null
  profile_name: string | null
  profile_pin: string | null
  login_code: string | null
  notes: string | null
  subscriptions?: {
    expires_at: string | null
  } | null
  products?: {
    name: string
    category: string
  } | null
}

export function AccessDetailsList({ items }: { items: AccessRow[] }) {
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState('')

  async function copy(label: string, value?: string | null) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1600)
  }

  if (!items.length) {
    return null
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      {items.map((item) => {
        const secretVisible = visibleSecrets[item.id] ?? false

        return (
          <section key={item.id} style={{
            background: 'var(--card)',
            border: '1px solid var(--border2)',
            borderRadius: '12px',
            padding: '18px',
            display: 'grid',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '10px',
                  background: 'rgba(34,197,94,0.12)',
                  color: 'var(--green)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>
                    {item.products?.name || 'Servicio activado'}
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    Activo hasta {item.subscriptions?.expires_at ? new Date(item.subscriptions.expires_at).toLocaleDateString('es-PE') : 'fecha no disponible'}
                  </p>
                </div>
              </div>
              {item.login_url && (
                <a
                  href={item.login_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border2)',
                    color: 'var(--text)',
                    background: 'var(--bg3)',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </a>
              )}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <AccessField label="Usuario" value={item.account_email} copied={copied} onCopy={copy} />
              <AccessField
                label="Contrasena"
                value={item.account_password}
                copied={copied}
                onCopy={copy}
                hidden={!secretVisible}
                action={
                  <button
                    type="button"
                    onClick={() => setVisibleSecrets((current) => ({ ...current, [item.id]: !secretVisible }))}
                    style={iconButtonStyle}
                    title={secretVisible ? 'Ocultar' : 'Mostrar'}
                  >
                    {secretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <AccessField label="Perfil" value={item.profile_name} copied={copied} onCopy={copy} />
              <AccessField label="PIN" value={item.profile_pin} copied={copied} onCopy={copy} hidden={!secretVisible} />
              <AccessField label="Cod. inicio" value={item.login_code} copied={copied} onCopy={copy} hidden={!secretVisible} />
            </div>

            {item.notes && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--bg2)',
                color: 'var(--muted)',
                fontSize: '0.84rem',
                lineHeight: 1.45
              }}>
                <KeyRound className="h-4 w-4" style={{ color: 'var(--accent2)', flexShrink: 0, marginTop: 2 }} />
                <span>{item.notes}</span>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function AccessField({
  label,
  value,
  copied,
  onCopy,
  hidden,
  action,
}: {
  label: string
  value?: string | null
  copied: string
  onCopy: (label: string, value?: string | null) => void
  hidden?: boolean
  action?: React.ReactNode
}) {
  if (!value) return null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '96px 1fr auto auto',
      gap: '8px',
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: '10px',
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      minWidth: 0
    }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700 }}>{label}</span>
      <strong style={{
        color: 'var(--text)',
        fontSize: '0.86rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {hidden ? '••••••••' : value}
      </strong>
      {action}
      <button
        type="button"
        onClick={() => onCopy(label, value)}
        style={iconButtonStyle}
        title={`Copiar ${label}`}
      >
        {copied === label ? 'OK' : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '8px',
  border: '1px solid var(--border2)',
  background: 'var(--bg3)',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  fontSize: '0.68rem',
  fontWeight: 800,
}
