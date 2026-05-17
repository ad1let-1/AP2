import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'
import styles from './QuickViewModal.module.css'

/**
 * Quick View modal — A&O-style slide-up panel showing product details
 * with size selector and add-to-cart without leaving the page.
 *
 * @param {{ product: object, isOpen: boolean, onClose: function }} props
 */
export default function QuickViewModal({ product, isOpen, onClose }) {
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedImg, setSelectedImg] = useState(0)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)

  if (!product) return null

  const images = product.images || []

  const handleAdd = () => {
    if (product.sizes?.length && !selectedSize) {
      toast.error('Please select a size')
      return
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      category: product.category,
      size: selectedSize,
    })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onClose()
      openDrawer()
    }, 800)
  }

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
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${product.name}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

            <div className={styles.layout}>
              {/* Gallery */}
              <div className={styles.gallery}>
                <div className={styles.mainImg}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImg}
                      src={images[selectedImg]}
                      alt={product.name}
                      className={styles.mainImgEl}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </AnimatePresence>
                </div>
                {images.length > 1 && (
                  <div className={styles.thumbs}>
                    {images.map((img, i) => (
                      <button
                        key={i}
                        className={`${styles.thumb} ${selectedImg === i ? styles.thumbActive : ''}`}
                        onClick={() => setSelectedImg(i)}
                        aria-label={`View image ${i + 1}`}
                      >
                        <img src={img} alt={`View ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.info}>
                <p className={styles.category}>{product.category}</p>
                <h2 className={styles.name}>{product.name}</h2>
                <div className={styles.priceRow}>
                  <span className={styles.price}>${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                <p className={styles.description}>{product.description}</p>

                {/* Size selector */}
                {product.sizes?.length > 0 && (
                  <div className={styles.sizes}>
                    <p className={styles.sizesLabel}>Select Size</p>
                    <div className={styles.sizeGrid}>
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          className={`${styles.sizeBtn} ${selectedSize === size ? styles.selectedSize : ''}`}
                          onClick={() => setSelectedSize(size)}
                          aria-pressed={selectedSize === size}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to cart */}
                <motion.button
                  className={`${styles.addBtn} ${added ? styles.addedBtn : ''}`}
                  onClick={handleAdd}
                  whileTap={{ scale: 0.97 }}
                  id={`quick-view-add-${product.id}`}
                >
                  {added ? '✓ Added to Cart' : 'Add to Cart'}
                </motion.button>

                <Link to={`/shop/${product.id}`} className={styles.fullDetailsLink} onClick={onClose}>
                  View Full Details →
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
