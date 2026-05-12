'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CartItem {
  readonly productId: string
  readonly name: string
  readonly price: number
  readonly quantity: number
}

interface CartState {
  readonly items: CartItem[]
  readonly total: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

function computeTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export const useCartStore = create<CartState>()(
  devtools(
    (set) => ({
      items: [],
      total: 0,
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId)
          const items = existing
            ? s.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i,
              )
            : [...s.items, { ...item, quantity: 1 }]
          return { items, total: computeTotal(items) }
        }),
      removeItem: (productId) =>
        set((s) => {
          const items = s.items.filter((i) => i.productId !== productId)
          return { items, total: computeTotal(items) }
        }),
      updateQuantity: (productId, quantity) =>
        set((s) => {
          const items =
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
          return { items, total: computeTotal(items) }
        }),
      clearCart: () => set({ items: [], total: 0 }),
    }),
    { name: 'CartStore' },
  ),
)
