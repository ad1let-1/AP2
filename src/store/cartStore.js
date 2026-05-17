import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, quantity }]
      isOpen: false,

      addItem: (product, quantity) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, quantity }] }
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQuantity: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return {
              items: state.items.filter((i) => i.product.id !== productId),
            }
          }
          return {
            items: state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity: qty } : i
            ),
          }
        }),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Computed properties
      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'novus-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
