import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/components/ProductCard'

interface CartItem {
  product: Product
  discountPct: number
  discountId?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, discountPct: number, discountId?: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, discountPct, discountId) =>
        set((state) => {
          const exists = state.items.find((i) => i.product.id === product.id)
          if (exists) return state
          return { items: [...state.items, { product, discountPct, discountId }] }
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart' }
  )
)
