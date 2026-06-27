import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { CheckoutPaymentFlow } from '@/components/CheckoutPaymentFlow'
import { formatPEN } from '@/lib/utils'
import { getPaymentMethods } from '@/lib/payment-methods'
import Link from 'next/link'
import { ArrowLeft, Clock, MessageCircle, ShieldCheck } from 'lucide-react'
import { buildOrderWhatsAppLink } from '@/lib/whatsapp'

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const user = await getSession()
  if (!user) redirect('/auth/login')
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, products(name, duration_days, category)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()
  if (order.status !== 'pending') redirect('/dashboard')

  const { data: existingVoucher } = await supabase
    .from('vouchers')
    .select('id, bank, operation_number, uploaded_at')
    .eq('order_id', orderId)
    .maybeSingle()

  const paymentMethods = await getPaymentMethods({ enabledOnly: true })
  const product = (order as any).products

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 16px 72px' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Volver a la tienda
        </Link>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          Pedido&nbsp;<strong style={{ color: 'var(--text)' }}>#{order.id.slice(0, 8).toUpperCase()}</strong>
        </span>
      </div>

      {/* ── Two-column layout ── */}
      <div className="co-grid">

        {/* ── LEFT: Order summary ── */}
        <aside className="co-sidebar">

          {/* Product card */}
          <div className="co-card">
            <p className="co-label">Resumen del pedido</p>

            <h2 style={{ margin: '8px 0 4px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
              {product?.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: '0.82rem' }}>
              <Clock style={{ width: 13, height: 13 }} />
              {product?.duration_days ?? 30} días de acceso
            </div>

            <div style={{ marginTop: 20, display: 'grid', gap: 10, fontSize: '0.875rem' }}>
              {order.discount_pct > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                    <span>Precio original</span>
                    <span style={{ textDecoration: 'line-through' }}>{formatPEN(order.original_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green)', fontWeight: 600 }}>
                    <span>Descuento ({order.discount_pct}%)</span>
                    <span>−{formatPEN((order.original_amount ?? order.amount) - order.amount)}</span>
                  </div>
                </>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border2)', paddingTop: 12, marginTop: 4,
              }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Total a pagar</strong>
                <strong style={{ fontSize: '1.5rem', color: 'var(--accent2)', letterSpacing: '-0.5px' }}>
                  {formatPEN(order.amount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Trust / support */}
          <div className="co-card" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck style={{ width: 18, height: 18, color: 'var(--accent2)', flexShrink: 0 }} />
              <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>Compra protegida</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Verificamos tu pago manualmente antes de activar el acceso.
              Sin comisiones extra — transferencia directa en soles.
            </p>
            <a
              href={buildOrderWhatsAppLink(orderId)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                color: 'var(--green)', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
              }}
            >
              <MessageCircle style={{ width: 14, height: 14 }} />
              Ayuda por WhatsApp
            </a>
          </div>

        </aside>

        {/* ── RIGHT: Payment flow ── */}
        <main className="co-main">
          <CheckoutPaymentFlow
            methods={paymentMethods}
            totalLabel={formatPEN(order.amount)}
            orderId={orderId}
            userId={user.id}
            initialDiscountPct={Number(order.discount_pct ?? 0)}
            existingVoucher={existingVoucher ? {
              bank: existingVoucher.bank,
              operationNumber: existingVoucher.operation_number,
              uploadedAt: existingVoucher.uploaded_at,
            } : null}
          />
        </main>
      </div>

      <style>{`
        .co-grid {
          display: grid;
          gap: 20px;
        }
        .co-sidebar { grid-column: span 1; display: grid; gap: 16px; align-content: start; order: 2; }
        .co-main    { grid-column: span 1; order: 1; }

        .co-card {
          background: var(--card);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 20px;
        }
        .co-label {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--muted);
        }

        @media (min-width: 860px) {
          .co-grid {
            grid-template-columns: 340px 1fr;
            align-items: start;
          }
          .co-sidebar { order: 1; }
          .co-main    { order: 2; }
        }
      `}</style>
    </div>
  )
}
