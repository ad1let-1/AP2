import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import ProductGrid from '../components/product/ProductGrid'
import ProductFilters from '../components/product/ProductFilters'
import { useProducts } from '../hooks/useProducts'
import { useFilterStore } from '../store/filterStore'
import styles from './CatalogPage.module.css'

const SORT_LABELS = {
  newest: 'Newest',
  price_asc: 'Price ↑',
  price_desc: 'Price ↓',
}

/**
 * Catalog/Shop page with sidebar filters, sorting, URL-synced state and pagination.
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const {
    category, sort, minPrice, maxPrice, page,
    setPage, hydrateFromURL, getQueryParams,
  } = useFilterStore()

  // Hydrate filters from URL on mount
  useEffect(() => {
    hydrateFromURL(searchParams)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync filter store → URL
  useEffect(() => {
    const params = {}
    if (category !== 'all') params.category = category
    if (sort !== 'newest') params.sort = sort
    if (minPrice > 0) params.min = String(minPrice)
    if (maxPrice < 10000) params.max = String(maxPrice)
    if (page > 1) params.page = String(page)
    const q = searchParams.get('q')
    if (q) params.q = q

    setSearchParams(params, { replace: true })
  }, [category, sort, minPrice, maxPrice, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const queryParams = getQueryParams()
  const { data, isLoading, isFetching } = useProducts(queryParams)

  const products = data?.products || data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const activeSearch = searchParams.get('q') || ''

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className="container">
          {/* ---- Page header ---- */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>
                {activeSearch ? `"${activeSearch}"` : category === 'all' ? 'All Products' : category}
              </h1>
              {!isLoading && (
                <p className={styles.resultCount}>
                  {total} {total === 1 ? 'product' : 'products'}
                  {isFetching && ' · Updating...'}
                </p>
              )}
            </div>

            <div className={styles.headerControls}>
              {/* Mobile filter trigger */}
              <button
                className={styles.filterToggle}
                onClick={() => setMobileFiltersOpen(true)}
                id="catalog-filter-btn"
              >
                <FilterIcon /> Filters
              </button>

              {/* Sort selector */}
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => useFilterStore.getState().setSort(e.target.value)}
                id="catalog-sort-select"
                aria-label="Sort products"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* ---- Layout ---- */}
          <div className={styles.layout}>
            {/* Sidebar (desktop) */}
            <div className={styles.sidebar}>
              <ProductFilters />
            </div>

            {/* Products area */}
            <div className={styles.content}>
              <ProductGrid
                products={products}
                isLoading={isLoading}
                skeletonCount={12}
                columns={3}
              />

              {/* Pagination */}
              {totalPages > 1 && !isLoading && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    id="catalog-prev-page-btn"
                  >
                    ← Prev
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`${styles.pageNumBtn} ${p === page ? styles.activePage : ''}`}
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    id="catalog-next-page-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Mobile filter drawer ---- */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              className={styles.mobileBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              className={styles.mobileFilterDrawer}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className={styles.mobileFilterHeader}>
                <h2>Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">✕</button>
              </div>
              <div className={styles.mobileFilterContent}>
                <ProductFilters onClose={() => setMobileFiltersOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
    </svg>
  )
}
