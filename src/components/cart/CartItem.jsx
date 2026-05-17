import { motion } from 'framer-motion'
import { useCartStore } from '../../store/cartStore'
import styles from './CartItem.module.css'

/**
 * A single cart item row with quantity controls and remove button.
 *
 * @param {{ item: import('../../store/cartStore').CartItem }} props
 */
export default function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const imageUrl = item.product.images?.[0] || `https://picsum.photos/seed/${item.product.id}/200/200`

  return (
    <motion.div
      className={styles.item}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <img src={imageUrl} alt={item.product.name} className={styles.image} loading="lazy" />

      <div className={styles.details}>
        <div className={styles.top}>
          <div>
            <h4 className={styles.name}>{item.product.name}</h4>
            {item.size && <span className={styles.size}>Size: {item.size}</span>}
            <span className={styles.category}>{item.product.category_id}</span>
          </div>
          <button
            className={styles.removeBtn}
            onClick={() => removeItem(item.product.id)}
            aria-label={`Remove ${item.product.name} from cart`}
          >
            ✕
          </button>
        </div>

        <div className={styles.bottom}>
          {/* Quantity controls */}
          <div className={styles.quantityControl}>
            <button
              className={styles.qtyBtn}
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className={styles.qty}>{item.quantity}</span>
            <button
              className={styles.qtyBtn}
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <span className={styles.price}>
            ${(item.product.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
