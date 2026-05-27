'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  amount: number
  original_amount: number
  status: string
  products: { name: string; category: string } | null
}

export default function MultiCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const ordersParam = searchParams.get('orders') ?? ''
  const orderIds = useMemo(
    () => ordersParam.split(',').map((id) => id.trim()).filter(Boolean),
    [ordersParam]
  )

  useEffect(() => {
    if (orderIds.length === 0) {
      router.push('/')
      return
    }

    let cancelled = false

    async function fetchOrders() {
      setLoading(true)
      setError('')

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('id, amount, original_amount, status, products(name, category)')
        .in('id', orderIds)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (ordersError) {
        setError('No pudimos cargar tus pedidos. Vuelve al catalogo e intenta nuevamente.')
        setOrders([])
      } else {
        setOrders((data || []) as unknown as Order[])
      }

      setLoading(false)
    }

    fetchOrders()

    return () => {
      cancelled = true
    }
  }, [orderIds, router, supabase])

  const total = orders.reduce((sum, order) => sum + parseFloat(String(order.amount)), 0)
  const totalOriginal = orders.reduce((sum, order) => sum + parseFloat(String(order.original_amount)), 0)
  const savings = totalOriginal - total

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--accent)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Volver al catalogo
        </Link>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '24px', marginTop: '24px' }}>
          <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link href="/" style={{
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
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </Link>
        <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
          Resumen de compra
        </h1>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <ShoppingCart style={{ color: 'var(--accent2)', width: 24, height: 24 }} />
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
            {orders.length} servicio{orders.length > 1 ? 's' : ''}
          </span>
        </div>

        {orders.map((order) => (
          <div key={order.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 0',
            borderBottom: '1px solid var(--border2)'
          }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                {order.products?.name || 'Servicio'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                {order.products?.category || 'Producto digital'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)' }}>
                S/{parseFloat(String(order.amount)).toFixed(2)}
              </p>
              {Number(order.original_amount) !== Number(order.amount) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'line-through' }}>
                  S/{parseFloat(String(order.original_amount)).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid var(--border2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--muted)' }}>Subtotal</span>
            <span style={{ color: 'var(--text)' }}>S/{totalOriginal.toFixed(2)}</span>
          </div>
          {savings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--green)' }}>Descuento</span>
              <span style={{ color: 'var(--green)' }}>-S/{savings.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span style={{ fontFamily: "'Unbounded', sans-serif", color: 'var(--green)' }}>
              S/{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FileText style={{ color: 'var(--accent2)', width: 24, height: 24 }} />
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
            Completar pagos
          </span>
        </div>

        <p style={{ color: 'var(--muted)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Abre cada pedido para aplicar un cupon, elegir el metodo de pago y subir su comprobante.
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/checkout/${order.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border2)',
                background: 'var(--bg2)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>{order.products?.name || 'Servicio'}</span>
              <span style={{ color: 'var(--accent)' }}>Pagar</span>
            </Link>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--muted)', fontSize: '0.85rem' }}>
        Dudas? Escribenos por WhatsApp
      </p>
    </div>
  )
}
