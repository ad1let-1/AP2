import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import ProductGrid from '../components/product/ProductGrid'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import { useProductDetail, useProductsList } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'
import styles from './ProductDetailPage.module.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

/**
 * Product detail page with image gallery, size selector, add to cart and related products.
 */
export default function ProductDetailPage() {
  const { id } = useParams()
  const { data: product, isLoading, isError } = useProductDetail(id)
  const { data: relatedData, isLoading: relatedLoading } = useProductsList({
    category: product?.category,
    limit: 4
  })
  const related = relatedData?.products || relatedData || []

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)

  const isClothing = product?.category === 'clothing'

  const handleAddToCart = () => {
    if (isClothing && !selectedSize) {
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
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className={styles.loadingWrapper}>
          <Loader size="lg" />
        </div>
      </PageTransition>
    )
  }

  if (isError || !product) {
    return (
      <PageTransition>
        <div className={styles.errorWrapper}>
          <h1 className={styles.errorTitle}>Product Not Found</h1>
          <Link to="/shop" className={styles.errorLink}>← Back to shop</Link>
        </div>
      </PageTransition>
    )
  }

  const images = product.images?.length
    ? product.images
    : [
        `https://picsum.photos/seed/${id}/600/750`,
        `https://picsum.photos/seed/${id}a/600/750`,
        `https://picsum.photos/seed/${id}b/600/750`,
      ]

  return (
    <PageTransition>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className={styles.breadcrumbCat}>
            {product.category}
          </Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* Main layout */}
        <div className={styles.layout}>
          {/* ---- Image gallery ---- */}
          <div className={styles.gallery}>
            <div className={styles.thumbnails}>
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumbnail} ${selectedImage === i ? styles.activeThumbnail : ''}`}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} />
                </button>
              ))}
            </div>

            <div className={styles.mainImage}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={product.name}
                  className={styles.productImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* ---- Product info ---- */}
          <div className={styles.info}>
            <span className={styles.category}>{product.category}</span>
            <h1 className={styles.name}>{product.name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>${product.price?.toFixed(2)}</span>
              {product.originalPrice && (
                <>
                  <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
                  <span className={styles.discount}>
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <p className={styles.description}>
              {product.description || 'Premium quality product crafted for the modern lifestyle. Designed to combine form and function seamlessly.'}
            </p>

            {/* Size selector (clothing only) */}
            {isClothing && (
              <div className={styles.sizes}>
                <div className={styles.sizeHeader}>
                  <span className={styles.sizeLabel}>Size</span>
                  <button className={styles.sizeGuide}>Size Guide</button>
                </div>
                <div className={styles.sizeGrid}>
                  {SIZES.map((size) => (
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
            <div className={styles.addToCartSection}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                id="product-add-to-cart-btn"
              >
                {added ? '✓ Added to Cart' : 'Add to Cart'}
              </Button>
            </div>

            {/* Product details */}
            <div className={styles.details}>
              {[
                { label: 'Category', value: product.category },
                { label: 'SKU', value: product.sku || `NOV-${product.id?.slice(0, 8).toUpperCase()}` },
                { label: 'Stock', value: product.stock > 0 ? `${product.stock} available` : 'Low stock' },
              ].map(({ label, value }) => (
                <div key={label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{label}</span>
                  <span className={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {(related.length > 0 || relatedLoading) && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>You may also like</h2>
            <ProductGrid
              products={related}
              isLoading={relatedLoading}
              skeletonCount={4}
              columns={4}
            />
          </section>
        )}
      </div>
    </PageTransition>
  )
}
