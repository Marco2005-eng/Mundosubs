'use client'

import { useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle,
  Copy,
  CreditCard,
  ExternalLink,
  Landmark,
  QrCode,
  Smartphone,
} from 'lucide-react'

interface PaymentMethod {
  id: 'bank_transfer' | 'yape' | 'plin'
  title: string
  description: string | null
  enabled: boolean
  holder: string | null
  phone: string | null
  bank_name: string | null
  account_number: string | null
  cci: string | null
  instructions: string | null
  qr_url?: string | null
  qr_error?: string | null
}

const META = {
  bank_transfer: {
    icon: Landmark,
    color: 'var(--accent2)',
    bg: 'rgba(124,58,237,0.10)',
    helper: 'Transferencia directa desde tu app bancaria.',
  },
  yape: {
    icon: Smartphone,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    helper: 'Paga escaneando el QR o usando el numero.',
  },
  plin: {
    icon: QrCode,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    helper: 'Paga con Plin y guarda la captura de la operacion.',
  },
}

export function PaymentMethodsPanel({
  methods,
  totalLabel,
  selectedId: controlledSelectedId,
  onSelectedChange,
}: {
  methods: PaymentMethod[]
  totalLabel: string
  selectedId?: PaymentMethod['id'] | null
  onSelectedChange?: (method: PaymentMethod) => void
}) {
  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState<PaymentMethod['id'] | null>(methods[0]?.id ?? null)
  const [copied, setCopied] = useState('')
  const selectedId = controlledSelectedId ?? uncontrolledSelectedId

  const selected = useMemo(
    () => methods.find((method) => method.id === selectedId) ?? methods[0],
    [methods, selectedId]
  )

  function selectMethod(method: PaymentMethod) {
    setUncontrolledSelectedId(method.id)
    onSelectedChange?.(method)
  }

  async function copyValue(label: string, value?: string | null) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1800)
  }

  if (!methods.length) {
    return (
      <div style={{
        border: '1px solid rgba(249,115,22,0.28)',
        background: 'rgba(249,115,22,0.08)',
        borderRadius: '12px',
        padding: '16px',
        color: 'var(--muted)',
        fontSize: '0.9rem'
      }}>
        No hay metodos de pago activos. Contacta a soporte por WhatsApp.
      </div>
    )
  }

  const meta = META[selected.id]
  const Icon = meta.icon

  return (
    <section style={{
      border: '1px solid var(--border2)',
      borderRadius: '14px',
      background: 'var(--card)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard style={{ width: 20, height: 20, color: 'var(--accent2)' }} />
          <div>
            <strong style={{ color: 'var(--text)' }}>Metodo de pago</strong>
            <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.78rem' }}>
              Elige una opcion y paga el monto exacto.
            </p>
          </div>
        </div>
        <div style={{
          padding: '8px 12px',
          borderRadius: '10px',
          background: 'rgba(34,197,94,0.1)',
          color: 'var(--green)',
          fontWeight: 900,
          fontFamily: "'Unbounded', sans-serif",
        }}>
          {totalLabel}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'grid', gap: '14px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))`,
          gap: '8px'
        }}>
          {methods.map((method) => {
            const itemMeta = META[method.id]
            const MethodIcon = itemMeta.icon
            const active = selected.id === method.id

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => selectMethod(method)}
                style={{
                  minHeight: 82,
                  borderRadius: '12px',
                  border: active ? `2px solid ${itemMeta.color}` : '1px solid var(--border2)',
                  background: active ? itemMeta.bg : 'var(--bg2)',
                  color: active ? 'var(--text)' : 'var(--muted)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  gap: '6px',
                  padding: '10px 6px',
                  textAlign: 'center'
                }}
              >
                <MethodIcon style={{ width: 22, height: 22, color: itemMeta.color }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{method.title}</span>
              </button>
            )
          })}
        </div>

        <div style={{
          border: '1px solid var(--border2)',
          borderRadius: '14px',
          background: 'var(--bg2)',
          padding: '16px',
          display: 'grid',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: meta.bg,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <Icon style={{ width: 22, height: 22, color: meta.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem', fontWeight: 900 }}>
                {selected.title}
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.45 }}>
                {selected.description || meta.helper}
              </p>
            </div>
            <CheckCircle style={{ width: 20, height: 20, color: 'var(--green)' }} />
          </div>

          {selected.id !== 'bank_transfer' && !selected.qr_url && (
            <div style={{
              border: '1px dashed rgba(249,115,22,0.35)',
              borderRadius: '14px',
              background: 'rgba(249,115,22,0.08)',
              padding: '16px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '0.84rem',
              lineHeight: 1.5
            }}>
              <QrCode style={{ width: 38, height: 38, color: 'var(--hot)', margin: '0 auto 8px' }} />
              <strong style={{ color: 'var(--text)' }}>QR no disponible</strong>
              <br />
              Usa el numero para pagar o avisa al admin para subir el QR de {selected.title}.
              {selected.qr_error && (
                <span style={{ display: 'block', marginTop: 6, color: '#ef4444', fontSize: '0.75rem' }}>
                  {selected.qr_error}
                </span>
              )}
            </div>
          )}

          {selected.qr_url && (
            <div style={{
              border: '1px solid var(--border2)',
              borderRadius: '14px',
              background: 'var(--card)',
              padding: '14px',
              display: 'grid',
              gap: '12px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 'min(100%, 280px)',
                  aspectRatio: '1 / 1',
                  margin: '0 auto',
                  borderRadius: '16px',
                  padding: '10px',
                  background: 'white',
                  border: '1px solid var(--border2)',
                  boxShadow: '0 18px 50px rgba(0,0,0,0.18)'
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.qr_url}
                    alt={`QR ${selected.title}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 10,
                      objectFit: 'contain',
                      background: 'white'
                    }}
                  />
                </div>
                <p style={{
                  margin: '12px auto 0',
                  maxWidth: 360,
                  color: 'var(--muted)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--text)' }}>Escanea este QR desde {selected.title}</strong>
                  <br />
                  Ingresa el monto exacto {totalLabel} y guarda la captura del pago.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px'
              }}>
                <a
                  href={selected.qr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minHeight: 40,
                    borderRadius: '10px',
                    border: '1px solid var(--border2)',
                    background: 'var(--bg3)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ExternalLink style={{ width: 16, height: 16 }} />
                  Abrir QR
                </a>
                <button
                  type="button"
                  onClick={() => copyValue('QR', selected.qr_url)}
                  style={{
                    minHeight: 40,
                    borderRadius: '10px',
                    border: '1px solid var(--border2)',
                    background: copied === 'QR' ? 'rgba(34,197,94,0.12)' : 'var(--bg3)',
                    color: copied === 'QR' ? 'var(--green)' : 'var(--text)',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {copied === 'QR' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                  Copiar link
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '8px' }}>
            {selected.holder && (
              <CopyRow label="Titular" value={selected.holder} copied={copied} onCopy={copyValue} />
            )}
            {selected.phone && (
              <CopyRow label="Numero" value={selected.phone} copied={copied} onCopy={copyValue} />
            )}
            {selected.bank_name && (
              <CopyRow label="Banco" value={selected.bank_name} copied={copied} onCopy={copyValue} />
            )}
            {selected.account_number && (
              <CopyRow label="Cuenta" value={selected.account_number} copied={copied} onCopy={copyValue} />
            )}
            {selected.cci && (
              <CopyRow label="CCI" value={selected.cci} copied={copied} onCopy={copyValue} />
            )}
          </div>

          {selected.instructions && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              borderTop: '1px solid var(--border2)',
              paddingTop: '12px',
              color: 'var(--muted)',
              fontSize: '0.82rem',
              lineHeight: 1.45
            }}>
              <Building2 style={{ width: 16, height: 16, color: 'var(--hot)', flexShrink: 0, marginTop: 2 }} />
              <span>{selected.instructions}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: string
  onCopy: (label: string, value: string) => void
}) {
  const isCopied = copied === label

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '86px 1fr auto',
      gap: '10px',
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: '10px',
      background: 'var(--card)',
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
        {value}
      </strong>
      <button
        type="button"
        onClick={() => onCopy(label, value)}
        style={{
          width: 34,
          height: 34,
          borderRadius: '8px',
          border: '1px solid var(--border2)',
          background: isCopied ? 'rgba(34,197,94,0.12)' : 'var(--bg3)',
          color: isCopied ? 'var(--green)' : 'var(--muted)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center'
        }}
        title={`Copiar ${label}`}
      >
        {isCopied ? <CheckCircle style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
      </button>
    </div>
  )
}
