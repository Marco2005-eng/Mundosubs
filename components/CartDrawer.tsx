'use client'

import { useRouter } from 'next/navigation'
import { formatPEN, applyDiscount } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { Trash2, ShoppingCart, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, clearCart } = useCartStore()
  const router = useRouter()
  const { toast } = useToast()
  const [mounted] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  const total = items.reduce(
    (sum, item) => sum + applyDiscount(item.product.price, item.discountPct),
    0
  )

  async function handleCheckout(item: (typeof items)[0]) {
    const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
    
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: item.product.id,
      }),
    })

    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Error al crear pedido' })
      return
    }

    const { orderId } = await res.json()
    removeItem(item.product.id)
    onClose()
    router.push(`/checkout/${orderId}`)
  }

  async function handleCheckoutAll() {
    setCheckingOut(true)
    const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
    
    if (!userData) {
      router.push('/auth/login')
      return
    }

    if (items.length === 0) {
      setCheckingOut(false)
      return
    }

    // Create orders for all items
    const orderIds: string[] = []
    for (const item of items) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.product.id,
        }),
      })

      if (res.ok) {
        const { orderId } = await res.json()
        orderIds.push(orderId)
      }
    }

    if (orderIds.length > 0) {
      clearCart()
      onClose()
      // Guardar orderIds para mostrarlos
      router.push(`/checkout/multiple?orders=${orderIds.join(',')}`)
    }
    setCheckingOut(false)
  }

  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: open ? 0 : '-400px',
    width: '100%',
    maxWidth: '380px',
    height: '100vh',
    background: 'var(--card)',
    borderLeft: '1px solid var(--border2)',
    zIndex: 200,
    transition: 'right 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 150,
          }}
        />
      )}
      
      {/* Drawer */}
      <div className="cart-drawer" style={drawerStyle}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart style={{ color: 'var(--accent2)' }} />
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text)'
            }}>
              Carrito
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ShoppingCart style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ color: 'var(--muted)' }}>Tu carrito está vacío</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item) => {
                const finalPrice = applyDiscount(item.product.price, item.discountPct)
                return (
                  <div key={item.product.id} style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border2)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text)',
                        marginBottom: '4px'
                      }}>
                        {item.product.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>
                        {item.product.duration_days} días
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: "'Unbounded', sans-serif",
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--green)'
                        }}>
                          S/{finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        onClick={() => handleCheckout(item)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'rgba(34,197,94,0.15)',
                          color: 'var(--green)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Comprar
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid var(--border2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Total estimado ({items.length} servicios)</span>
              <span style={{
                fontFamily: "'Unbounded', sans-serif",
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--green)'
              }}>
                S/{total.toFixed(2)}
              </span>
            </div>

            {/* Checkout All Button */}
            <button
              onClick={handleCheckoutAll}
              disabled={checkingOut}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: checkingOut ? 'not-allowed' : 'pointer',
                opacity: checkingOut ? 0.7 : 1,
                marginBottom: '10px'
              }}
            >
              {checkingOut ? 'Procesando...' : `Pagar todos (${items.length})`}
            </button>

            <button
              onClick={clearCart}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border2)',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  )
}
