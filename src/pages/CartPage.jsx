import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import CartItem from '../components/cart/CartItem'
import Button from '../components/ui/Button'
import { useCartStore } from '../store/cartStore'
import styles from './CartPage.module.css'

/**
 * Full cart page with item list, order summary and checkout CTA.
 */
export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const getShipping = useCartStore((s) => s.getShipping)
  const getTotal = useCartStore((s) => s.getTotal)
  const clearCart = useCartStore((s) => s.clearCart)

  const subtotal = getSubtotal()
  const shipping = getShipping()
  const total = getTotal()
  const SHIPPING_THRESHOLD = 150

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className={styles.empty}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.emptyContent}
          >
            <span className={styles.emptyIcon}>🛒</span>
            <h1 className={styles.emptyTitle}>Your cart is empty</h1>
            <p className={styles.emptyText}>
              Looks like you haven't added anything yet.
            </p>
            <Link to="/shop">
              <Button variant="primary" size="lg">Start Shopping</Button>
            </Link>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container">
        <h1 className={styles.pageTitle}>Shopping Cart</h1>
        <p className={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</p>

        <div className={styles.layout}>
          {/* ---- Items list ---- */}
          <div className={styles.items}>
            <AnimatePresence>
              {items.map((item) => (
                <CartItem key={`${item.id}-${item.size || 'default'}`} item={item} />
              ))}
            </AnimatePresence>

            <div className={styles.itemsFooter}>
              <button
                className={styles.clearBtn}
                onClick={clearCart}
                id="cart-clear-btn"
              >
                Clear cart
              </button>
              <Link to="/shop" className={styles.continueLink}>
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* ---- Order summary ---- */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            {subtotal < SHIPPING_THRESHOLD && (
              <div className={styles.shippingBanner}>
                <div className={styles.progressBar}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${(subtotal / SHIPPING_THRESHOLD) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className={styles.progressText}>
                  Add <strong>${(SHIPPING_THRESHOLD - subtotal).toFixed(2)}</strong> more for free shipping
                </p>
              </div>
            )}

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span className={shipping === 0 ? styles.freeShipping : ''}>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Estimated Tax</span>
                <span>${(subtotal * 0.08).toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Total</span>
              <span>${(total + subtotal * 0.08).toFixed(2)}</span>
            </div>

            <Link to="/checkout" id="cart-checkout-btn">
              <Button variant="primary" size="lg" fullWidth>
                Proceed to Checkout →
              </Button>
            </Link>

            <div className={styles.paymentIcons}>
              {['VISA', 'MC', 'AMEX', 'PAYPAL'].map((p) => (
                <span key={p} className={styles.paymentIcon}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
