import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../../store/cartStore'
import QuickViewModal from '../ui/QuickViewModal'
import toast from 'react-hot-toast'
import styles from './ProductCard.module.css'

/**
 * Product card inspired by A&O editorial aesthetic.
 * White card background, hover Quick View overlay, wishlist toggle.
 *
 * @param {{ product: object, skeleton?: boolean }} props
 */
export default function ProductCard({ product, skeleton = false }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)

  if (skeleton) return <SkeletonCard />

  const primaryImage = product.images?.[0] || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80`
  const secondaryImage = product.images?.[1] || primaryImage

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // If clothing with sizes, open Quick View
    if (product.sizes?.length) {
      setQuickViewOpen(true)
      return
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      category: product.category,
    })
    toast.success(`Added to cart`)
    openDrawer()
  }

  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  return (
    <>
      <motion.article
        className={styles.card}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Link to={`/shop/${product.id}`} className={styles.imageLink} tabIndex={-1}>
          <div className={styles.imageWrapper}>
            {/* Primary → secondary image swap on hover */}
            <motion.img
              src={primaryImage}
              alt={product.name}
              className={`${styles.image} ${styles.imagePrimary}`}
              animate={{ opacity: isHovered ? 0 : 1 }}
              transition={{ duration: 0.35 }}
              loading="lazy"
            />
            <motion.img
              src={secondaryImage}
              alt={`${product.name} — alternate view`}
              className={`${styles.image} ${styles.imageSecondary}`}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              loading="lazy"
            />

            {/* Tags */}
            <div className={styles.tags}>
              {product.tags?.includes('new') && (
                <span className={styles.tagNew}>NEW</span>
              )}
              {discountPct && (
                <span className={styles.tagSale}>−{discountPct}%</span>
              )}
            </div>

            {/* Wishlist */}
            <motion.button
              className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
              onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted) }}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              whileTap={{ scale: 0.85 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered || isWishlisted ? 1 : 0 }}
            >
              <HeartIcon filled={isWishlisted} />
            </motion.button>

            {/* Quick View overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className={styles.quickViewOverlay}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className={styles.quickViewBtn}
                    onClick={handleQuickAdd}
                    id={`quick-view-${product.id}`}
                  >
                    {product.sizes?.length ? 'Quick View' : 'Add to Cart'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>

        {/* Product info */}
        <div className={styles.info}>
          <Link to={`/shop/${product.id}`} className={styles.infoLink}>
            <p className={styles.category}>{product.category}</p>
            <h3 className={styles.name}>{product.name}</h3>
            <div className={styles.priceRow}>
              <span className={styles.price}>${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
              )}
            </div>
          </Link>
        </div>
      </motion.article>

      {/* Quick view modal */}
      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  )
}

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={`${styles.imageWrapper} ${styles.skeletonImage}`} />
      <div className={styles.info}>
        <div className={styles.skeletonLine} style={{ width: '40%', height: '11px', marginBottom: '8px' }} />
        <div className={styles.skeletonLine} style={{ width: '75%', height: '14px', marginBottom: '10px' }} />
        <div className={styles.skeletonLine} style={{ width: '30%', height: '13px' }} />
      </div>
    </div>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
