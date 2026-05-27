'use client'

import { useState } from 'react'
import { CheckCircle, CopyCheck, FileUp, Loader2, Tag, WalletCards } from 'lucide-react'
import { PaymentMethodsPanel } from '@/components/PaymentMethodsPanel'
import { VoucherUpload } from '@/components/VoucherUpload'

type PaymentMethod = {
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

export function CheckoutPaymentFlow({
  methods,
  totalLabel,
  orderId,
  userId,
  initialDiscountPct,
}: {
  methods: PaymentMethod[]
  totalLabel: string
  orderId: string
  userId: string
  initialDiscountPct: number
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(methods[0] ?? null)
  const [currentTotalLabel, setCurrentTotalLabel] = useState(totalLabel)
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code) {
      setCouponError('Ingresa un codigo')
      return
    }

    setCouponLoading(true)
    setCouponError('')
    setCouponMessage('')

    try {
      const res = await fetch(`/api/orders/${orderId}/coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Cupon no valido')

      setCurrentTotalLabel(result.order.amountLabel)
      setCouponMessage(`${result.coupon.code}: ${result.order.discountPct}% de descuento aplicado`)
    } catch (err: any) {
      setCouponError(err.message)
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px'
      }}>
        <StepBadge icon={WalletCards} label="1. Elige como pagar" active />
        <StepBadge icon={FileUp} label="2. Sube tu comprobante" active={Boolean(selectedMethod)} />
      </div>

      <section style={{
        border: '1px solid var(--border2)',
        borderRadius: '14px',
        background: 'var(--card)',
        padding: '16px',
        display: 'grid',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag style={{ width: 20, height: 20, color: 'var(--accent2)' }} />
            <div>
              <strong style={{ color: 'var(--text)' }}>Codigo de descuento</strong>
              <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.78rem' }}>
                Puedes aplicarlo antes de elegir el metodo de pago.
              </p>
            </div>
          </div>
          {initialDiscountPct > 0 && !couponMessage && (
            <span style={{ color: 'var(--green)', fontSize: '0.78rem', fontWeight: 800 }}>
              {initialDiscountPct}% aplicado
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
          <input
            value={couponCode}
            onChange={(event) => {
              setCouponCode(event.target.value.toUpperCase())
              setCouponError('')
            }}
            className="input-dark"
            placeholder="Ej: MUNDOSUBS10"
            style={{ minWidth: 0 }}
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={couponLoading}
            style={{
              minHeight: 40,
              minWidth: 104,
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              fontWeight: 800,
              cursor: couponLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {couponLoading ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <Tag style={{ width: 16, height: 16 }} />}
            Aplicar
          </button>
        </div>
        {couponMessage && (
          <p style={{ margin: 0, color: 'var(--green)', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle style={{ width: 15, height: 15 }} />
            {couponMessage}
          </p>
        )}
        {couponError && <p style={{ margin: 0, color: '#ef4444', fontSize: '0.82rem', fontWeight: 700 }}>{couponError}</p>}
      </section>

      <PaymentMethodsPanel
        methods={methods}
        totalLabel={currentTotalLabel}
        selectedId={selectedMethod?.id ?? null}
        onSelectedChange={setSelectedMethod}
      />

      <section style={{
        border: '1px solid var(--border2)',
        borderRadius: '14px',
        background: 'var(--card)',
        padding: '16px',
        display: 'grid',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CopyCheck style={{ width: 20, height: 20, color: 'var(--green)' }} />
          <div>
            <strong style={{ color: 'var(--text)' }}>Confirma tu pago</strong>
            <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.78rem' }}>
              Paga el monto exacto, guarda la captura e ingresa el numero de operacion.
            </p>
          </div>
        </div>

        {selectedMethod ? (
          <VoucherUpload
            orderId={orderId}
            userId={userId}
            paymentMethodLabel={selectedMethod.title}
          />
        ) : (
          <div style={{
            border: '1px dashed var(--border2)',
            borderRadius: '12px',
            padding: '14px',
            color: 'var(--muted)',
            textAlign: 'center',
            fontSize: '0.85rem'
          }}>
            Selecciona un metodo de pago para continuar.
          </div>
        )}
      </section>
    </div>
  )
}

function StepBadge({
  icon: Icon,
  label,
  active,
}: {
  icon: any
  label: string
  active: boolean
}) {
  return (
    <div style={{
      minHeight: 48,
      borderRadius: '12px',
      border: `1px solid ${active ? 'rgba(124,58,237,0.35)' : 'var(--border2)'}`,
      background: active ? 'rgba(124,58,237,0.10)' : 'var(--bg2)',
      color: active ? 'var(--text)' : 'var(--muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '8px 10px',
      fontSize: '0.8rem',
      fontWeight: 800,
      textAlign: 'center'
    }}>
      <Icon style={{ width: 16, height: 16, color: active ? 'var(--accent2)' : 'var(--muted)', flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  )
}
