import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import ProductGrid from '../components/product/ProductGrid'
import { useProductsList } from '../hooks/useProducts'
import styles from './HomePage.module.css'

/* ─── Editorial hero images ─────────────────────────────── */
const HERO_IMAGE = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=85'

/* ─── Category cards ────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'clothing',
    label: 'Clothing',
    sub: 'Seasonal Collection',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
  },
  {
    id: 'gadgets',
    label: 'Gadgets',
    sub: 'Everyday Carry',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80',
  },
  {
    id: 'tech',
    label: 'Tech',
    sub: 'Next-Gen Hardware',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  },
]

const MARQUEE_TEXT = 'CLOTHING — GADGETS — TECH — FREE SHIPPING OVER $150 — NEW ARRIVALS — '

/**
 * Redesigned HomePage matching A&O's editorial aesthetic:
 * full-bleed hero, clean product grid, category showcase.
 */
export default function HomePage() {
  const { data, isLoading } = useProductsList({ limit: 8 })
  const products = data?.products || (Array.isArray(data) ? data : [])

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  return (
    <PageTransition>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className={styles.hero} ref={heroRef} aria-label="Hero">
        {/* Parallax background */}
        <motion.div className={styles.heroBgWrapper} style={{ y: heroY }}>
          <img
            src={HERO_IMAGE}
            alt="NOVUS — New Collection 2026"
            className={styles.heroBg}
            fetchpriority="high"
          />
          <div className={styles.heroBgOverlay} />
        </motion.div>

        {/* Text */}
        <div className={styles.heroContent}>
          <motion.span
            className={styles.heroEyebrow}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            New Collection — 2026
          </motion.span>

          <motion.h1
            className={styles.heroHeadline}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            The New<br />Essentials
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          >
            <Link to="/shop" className={styles.heroCta} id="hero-shop-btn">
              Shop the Collection
            </Link>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className={styles.scrollCue}
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <span className={styles.scrollLine} />
        </motion.div>
      </section>

      {/* ═══════════════ MARQUEE ═══════════════ */}
      <div className={styles.marqueeBar} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {Array(8).fill(MARQUEE_TEXT).map((t, i) => (
            <span key={i} className={styles.marqueeItem}>{t}</span>
          ))}
        </div>
      </div>

      {/* ═══════════════ LATEST ARRIVALS ═══════════════ */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <motion.h2
              className={styles.sectionTitle}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Latest Arrivals
            </motion.h2>
            <Link to="/shop" className={styles.sectionViewAll} id="home-view-all-btn">
              View All
            </Link>
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            skeletonCount={8}
            columns={4}
          />
        </div>
      </section>

      {/* ═══════════════ CATEGORY SHOWCASE ═══════════════ */}
      <section className={styles.categoriesSection}>
        <div className="container">
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            Shop by Category
          </motion.h2>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  to={`/shop?category=${cat.id}`}
                  className={styles.categoryCard}
                  id={`home-category-${cat.id}`}
                >
                  <div className={styles.categoryImgWrap}>
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className={styles.categoryImg}
                    />
                    <div className={styles.categoryImgOverlay} />
                  </div>
                  <div className={styles.categoryLabel}>
                    <span className={styles.categorySub}>{cat.sub}</span>
                    <span className={styles.categoryName}>{cat.label}</span>
                    <span className={styles.categoryArrow}>→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ EDITORIAL BANNER ═══════════════ */}
      <section className={styles.editorialBanner}>
        <div className={styles.editorialBgWrap}>
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80"
            alt="Editorial"
            className={styles.editorialBgImg}
            loading="lazy"
          />
          <div className={styles.editorialOverlay} />
        </div>
        <div className={styles.editorialContent}>
          <motion.p
            className={styles.editorialEyebrow}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            The Edit
          </motion.p>
          <motion.h2
            className={styles.editorialTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Free Shipping<br />on Orders $150+
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Link to="/shop" className={styles.editorialCta} id="editorial-banner-btn">
              Shop Now
            </Link>
          </motion.div>
        </div>
      </section>

    </PageTransition>
  )
}
