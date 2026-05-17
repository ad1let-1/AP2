import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import styles from './ProductGrid.module.css'

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

/**
 * Animated product grid with staggered entrance.
 *
 * @param {{
 *   products: object[],
 *   isLoading?: boolean,
 *   skeletonCount?: number,
 *   columns?: number,
 * }} props
 */
export default function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 8,
  columns = 4,
}) {
  if (isLoading) {
    return (
      <div className={styles.grid} style={{ '--cols': columns }}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCard key={i} skeleton />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyIcon}>🔍</p>
        <h3 className={styles.emptyTitle}>No products found</h3>
        <p className={styles.emptyText}>Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <motion.div
      className={styles.grid}
      style={{ '--cols': columns }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  )
}
