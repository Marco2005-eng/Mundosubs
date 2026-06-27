'use client'

import { useState } from 'react'
import { CartDrawer } from '@/components/CartDrawer'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export function CartDrawerWrapper() {
  const [open, setOpen] = useState(false)
  const { items } = useCartStore()

  return (
    <>
      <button 
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '8px',
          color: 'var(--text)'
        }}
        title="Carrito"
      >
        <ShoppingCart style={{ width: 22, height: 22 }} />
        {items.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'var(--hot)',
            color: 'white',
            fontSize: '9px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {items.length}
          </span>
        )}
      </button>
      {open && <CartDrawer open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
