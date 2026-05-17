import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../../store/cartStore'
import CartItem from './CartItem'
import styles from './CartDrawer.module.css'

/**
 * Slide-in cart drawer from the right side of the screen.
 */
export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const closeDrawer = () => { if (isOpen) toggleCart() }
  const items = useCartStore((s) => s.items)
  
  const subtotal = useCartStore((s) => s.total)
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const total = subtotal + shipping;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDrawer])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])


  const SHIPPING_THRESHOLD = 150

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div
            className={styles.drawer}
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                Cart <span className={styles.count}>({items.length})</span>
              </h2>
              <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Close cart">
                ✕
              </button>
            </div>

            {/* Items */}
            <div className={styles.items}>
              {items.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyIcon}>🛒</p>
                  <p className={styles.emptyText}>Your cart is empty</p>
                  <Link to="/shop" className={styles.shopLink} onClick={closeDrawer}>
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <CartItem key={`${item.id}-${item.size || 'default'}`} item={item} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className={styles.footer}>
                {subtotal < SHIPPING_THRESHOLD && (
                  <div className={styles.shippingProgress}>
                    <div className={styles.progressBar}>
                      <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${(subtotal / SHIPPING_THRESHOLD) * 100}%` }}
                      />
                    </div>
                    <p className={styles.progressText}>
                      ${(SHIPPING_THRESHOLD - subtotal).toFixed(2)} away from free shipping
                    </p>
                  </div>
                )}

                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.total}`}>
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className={styles.checkoutBtn}
                  onClick={closeDrawer}
                  id="cart-drawer-checkout-btn"
                >
                  Proceed to Checkout →
                </Link>
                <Link
                  to="/cart"
                  className={styles.viewCartLink}
                  onClick={closeDrawer}
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
