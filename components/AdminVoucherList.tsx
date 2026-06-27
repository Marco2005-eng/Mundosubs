'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CreditCard, Eye, Search } from 'lucide-react'
import { formatPEN } from '@/lib/utils'

function getVoucher(order: any) {
  if (Array.isArray(order.vouchers)) return order.vouchers[0] ?? null
  return order.vouchers ?? null
}

interface Order {
  id: string
  created_at: string
  amount: number
  discount_pct: number
  products: { name: string } | null
  vouchers: {
    bank: string | null
    operation_number: string | null
    uploaded_at: string | null
    file_url: string | null
  } | null
}

export function AdminVoucherList({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return orders
    return orders.filter((order) => {
      const voucher = getVoucher(order)
      const id = order.id.slice(0, 8).toLowerCase()
      const bank = (voucher?.bank ?? '').toLowerCase()
      const opNum = (voucher?.operation_number ?? '').toLowerCase()
      const productName = (order.products?.name ?? '').toLowerCase()
      return id.includes(q) || bank.includes(q) || opNum.includes(q) || productName.includes(q)
    })
  }, [orders, search])

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.4,
            width: '18px',
            height: '18px',
          }} />
          <input
            type="text"
            placeholder="Buscar por ID, banco, operación o producto..."
            className="input-dark"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      {!filtered.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
        }}>
          <CreditCard style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>
            {orders.length === 0
              ? 'No hay comprobantes pendientes'
              : 'No se encontraron resultados'}
          </p>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {orders.length === 0
              ? 'Los pedidos aparecerán aquí cuando el cliente suba su comprobante.'
              : 'Intenta con otros términos de búsqueda.'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((order) => {
            const voucher = getVoucher(order)
            return (
              <div key={order.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                gap: '18px',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(249,115,22,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CreditCard style={{ width: '22px', height: '22px', color: 'var(--hot)' }} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      marginBottom: '4px',
                    }}>
                      #{order.id.slice(0, 8)}
                    </div>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}>
                      {order.products?.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginTop: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      flexWrap: 'wrap',
                    }}>
                      <span>Banco: {voucher?.bank || '-'}</span>
                      <span>Operación: {voucher?.operation_number || '-'}</span>
                      <span>{new Date(voucher?.uploaded_at || order.created_at).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--green)',
                    }}>
                      {formatPEN(order.amount)}
                    </div>
                    {order.discount_pct > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--green)',
                        background: 'rgba(34,197,94,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        -{order.discount_pct}% OFF
                      </span>
                    )}
                  </div>
                  <Link href={`/admin/vouchers/${order.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}>
                    <Eye style={{ width: '16px', height: '16px' }} /> Revisar
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
