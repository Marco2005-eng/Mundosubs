'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Landmark, QrCode, Smartphone } from 'lucide-react'

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

const ICONS: Record<string, React.ElementType> = {
  bank_transfer: Landmark,
  yape: Smartphone,
  plin: QrCode,
}

export function PaymentMethodsPanel({
  methods,
  totalLabel,
  selectedId: controlledId,
  onSelectedChange,
}: {
  methods: PaymentMethod[]
  totalLabel: string
  selectedId?: PaymentMethod['id'] | null
  onSelectedChange?: (method: PaymentMethod) => void
}) {
  const [localId, setLocalId] = useState<PaymentMethod['id'] | null>(methods[0]?.id ?? null)
  const [copied, setCopied] = useState('')

  const selectedId = controlledId ?? localId
  const selected = useMemo(
    () => methods.find((m) => m.id === selectedId) ?? methods[0],
    [methods, selectedId]
  )

  function select(method: PaymentMethod) {
    setLocalId(method.id)
    onSelectedChange?.(method)
  }

  async function copy(label: string, value?: string | null) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1800)
  }

  if (!methods.length) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
      No hay métodos de pago disponibles. Contacta a soporte.
    </p>
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Method tabs ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${methods.length}, minmax(0,1fr))`,
        gap: 8,
        padding: 4,
        background: 'var(--bg2)',
        borderRadius: 12,
        border: '1px solid var(--border2)',
      }}>
        {methods.map((m) => {
          const Icon = ICONS[m.id] ?? Landmark
          const active = selected?.id === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => select(m)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                height: 40, borderRadius: 9, cursor: 'pointer',
                border: active ? '1px solid var(--border2)' : '1px solid transparent',
                background: active ? 'var(--card)' : 'transparent',
                boxShadow: active ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                color: active ? 'var(--text)' : 'var(--muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.86rem',
                transition: 'all 0.15s',
              }}
            >
              <Icon style={{ width: 15, height: 15, color: active ? 'var(--accent2)' : 'var(--muted)', flexShrink: 0 }} />
              {m.title}
            </button>
          )
        })}
      </div>

      {/* ── Selected method details ── */}
      {selected && (
        <div style={{ display: 'grid', gap: 10 }}>

          {/* QR image */}
          {selected.qr_url && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: 16, borderRadius: 12,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
            }}>
              <div style={{
                width: 'min(100%, 200px)', aspectRatio: '1',
                borderRadius: 12, padding: 10, background: '#fff',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.qr_url}
                  alt={`QR ${selected.title}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center' }}>
                Escanea con tu app de <strong style={{ color: 'var(--text)' }}>{selected.title}</strong>
              </p>
            </div>
          )}

          {/* Data rows */}
          {[
            { label: 'Titular',          value: selected.holder },
            { label: 'Número móvil',     value: selected.phone },
            { label: 'Banco',            value: selected.bank_name },
            { label: 'N° de cuenta',     value: selected.account_number },
            { label: 'CCI interbancario',value: selected.cci },
          ]
            .filter((r) => r.value)
            .map(({ label, value }) => (
              <DataRow key={label} label={label} value={value!} copied={copied} onCopy={copy} />
            ))}

          {/* Instructions */}
          {selected.instructions && (
            <p style={{
              margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.55,
              paddingTop: 6, borderTop: '1px solid var(--border2)',
            }}>
              {selected.instructions}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Reusable data row ── */
function DataRow({
  label, value, copied, onCopy,
}: {
  label: string
  value: string
  copied: string
  onCopy: (label: string, value: string) => void
}) {
  const done = copied === label
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: 'var(--bg2)', border: '1px solid var(--border2)',
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)' }}>{label}</p>
        <p style={{
          margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(label, value)}
        style={{
          flexShrink: 0, height: 30, padding: '0 10px', borderRadius: 7, cursor: 'pointer',
          border: '1px solid var(--border2)',
          background: done ? 'rgba(34,197,94,0.1)' : 'var(--card)',
          color: done ? 'var(--green)' : 'var(--muted)',
          fontWeight: 600, fontSize: '0.75rem',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          transition: 'all 0.15s',
        }}
      >
        {done
          ? <><Check style={{ width: 12, height: 12 }} />Copiado</>
          : <><Copy style={{ width: 12, height: 12 }} />Copiar</>}
      </button>
    </div>
  )
}
