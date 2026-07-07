'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Tag } from 'lucide-react'
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
  existingVoucher,
}: {
  methods: PaymentMethod[]
  totalLabel: string
  orderId: string
  userId: string
  initialDiscountPct: number
  existingVoucher: {
    bank: string | null
    operationNumber: string | null
    uploadedAt: string | null
  } | null
}) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(methods[0] ?? null)
  const [currentTotalLabel, setCurrentTotalLabel] = useState(totalLabel)
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code) { setCouponError('Ingresa un código'); return }

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
      if (!res.ok) throw new Error(result.error || 'Cupón no válido')

      setCurrentTotalLabel(result.order.amountLabel)
      setCouponMessage(`${result.coupon.code}: ${result.order.discountPct}% de descuento aplicado`)
      router.refresh()
    } catch (err: any) {
      setCouponError(err.message)
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Step 1: Method ── */}
      <section className="co-card">
        <StepHeader n={1} title="Elige cómo pagar" />
        <div style={{ marginTop: 16 }}>
          <PaymentMethodsPanel
            methods={methods}
            totalLabel={currentTotalLabel}
            selectedId={selectedMethod?.id ?? null}
            onSelectedChange={setSelectedMethod}
          />
        </div>
      </section>

      {/* ── Coupon (always visible) ── */}
      <section className="co-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag style={{ width: 15, height: 15, color: 'var(--accent2)', flexShrink: 0 }} />
          <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Cupón de descuento</strong>
          {(initialDiscountPct > 0 || couponMessage) && (
            <span style={{
              marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 700,
              color: 'var(--green)', background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)', borderRadius: 999,
              padding: '2px 10px',
            }}>
              {couponMessage ? 'Aplicado ✓' : `${initialDiscountPct}% activo`}
            </span>
          )}
        </div>

        {!couponMessage ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <input
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                placeholder="Ej: MUNDOSUBS10"
                style={{
                  height: 40, borderRadius: 8, padding: '0 12px',
                  background: 'var(--bg2)',
                  border: `1px solid ${couponError ? '#ef4444' : 'var(--border2)'}`,
                  color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading}
                style={{
                  height: 40, padding: '0 18px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--accent2)', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: couponLoading ? 0.7 : 1,
                }}
              >
                {couponLoading
                  ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                  : 'Aplicar'}
              </button>
            </div>
            {couponError && (
              <p style={{ margin: 0, color: '#ef4444', fontSize: '0.76rem' }}>{couponError}</p>
            )}
            <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--muted)' }}>
              Si tienes un código de descuento, aplícalo antes de transferir.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: '0.84rem', fontWeight: 700 }}>
            <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {couponMessage}
          </div>
        )}
      </section>

      {/* ── Step 2: Upload voucher ── */}
      <section className="co-card">
        <StepHeader n={2} title="Sube tu comprobante de pago" />
        <p style={{ margin: '4px 0 16px', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Realiza la transferencia por el monto exacto y adjunta la captura o constancia.
        </p>

        {selectedMethod ? (
          <VoucherUpload
            orderId={orderId}
            userId={userId}
            paymentMethodLabel={selectedMethod.title}
            existingVoucher={existingVoucher}
          />
        ) : (
          <div style={{
            padding: 20, borderRadius: 10, textAlign: 'center',
            border: '1px dashed var(--border2)', color: 'var(--muted)', fontSize: '0.85rem',
          }}>
            Selecciona un método de pago arriba para continuar.
          </div>
        )}
      </section>


    </div>
  )
}

/* ── Step header ── */
function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'var(--accent2)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.78rem', fontWeight: 900,
      }}>
        {n}
      </div>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{title}</h3>
    </div>
  )
}
