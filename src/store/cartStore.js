import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, quantity }]
      isOpen: false,

      addItem: (product, quantity = 1) =>
        set((state) => {
          // Normalize quantity to make sure it is a valid number
          const qty = Number(quantity) || 1
          const existingItem = state.items.find((i) => i.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: (Number(i.quantity) || 1) + qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, quantity: qty }] }
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQuantity: (productId, qty) =>
        set((state) => {
          const newQty = Number(qty) || 1
          if (newQty <= 0) {
            return {
              items: state.items.filter((i) => i.product.id !== productId),
            }
          }
          return {
            items: state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity: newQty } : i
            ),
          }
        }),

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 1),
          0
        )
      },

      getShipping: () => {
        const subtotal = get().getSubtotal()
        return subtotal > 150 || subtotal === 0 ? 0 : 15
      },

      getTotal: () => {
        return get().getSubtotal() + get().getShipping()
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      // Computed properties
      get total() {
        return get().items.reduce(
          (sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 1),
          0
        )
      },

      get itemCount() {
        return get().items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      },
    }),
    {
      name: 'novus-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
