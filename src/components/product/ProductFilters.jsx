import { useFilterStore } from '../../store/filterStore'
import styles from './ProductFilters.module.css'

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'gadgets', label: 'Gadgets' },
  { value: 'tech', label: 'Tech' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

/**
 * Sidebar filter panel for the catalog page.
 * Reads and writes to the filter store.
 *
 * @param {{ onClose?: function }} props
 */
export default function ProductFilters({ onClose }) {
  const {
    category, sort, minPrice, maxPrice,
    setCategory, setSort, setPriceRange, resetFilters,
  } = useFilterStore()

  const handleMinPrice = (e) => setPriceRange(Number(e.target.value), maxPrice)
  const handleMaxPrice = (e) => setPriceRange(minPrice, Number(e.target.value))

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filters</h2>
        <button className={styles.resetBtn} onClick={resetFilters}>
          Reset all
        </button>
      </div>

      {/* Category */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Category</h3>
        <ul className={styles.categoryList}>
          {CATEGORIES.map(({ value, label }) => (
            <li key={value}>
              <button
                className={`${styles.categoryBtn} ${category === value ? styles.active : ''}`}
                onClick={() => setCategory(value)}
                aria-pressed={category === value}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Sort */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Sort By</h3>
        <div className={styles.sortGroup}>
          {SORT_OPTIONS.map(({ value, label }) => (
            <label key={value} className={styles.radioLabel}>
              <input
                type="radio"
                name="sort"
                value={value}
                checked={sort === value}
                onChange={() => setSort(value)}
                className={styles.radioInput}
              />
              <span className={`${styles.radioCustom} ${sort === value ? styles.radioActive : ''}`} />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* Price Range */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Price Range</h3>
        <div className={styles.priceInputs}>
          <div className={styles.priceField}>
            <label className={styles.priceLabel}>Min ($)</label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={minPrice}
              onChange={handleMinPrice}
              className={styles.priceInput}
              id="filter-min-price"
            />
          </div>
          <span className={styles.priceSep}>—</span>
          <div className={styles.priceField}>
            <label className={styles.priceLabel}>Max ($)</label>
            <input
              type="number"
              min={minPrice}
              value={maxPrice}
              onChange={handleMaxPrice}
              className={styles.priceInput}
              id="filter-max-price"
            />
          </div>
        </div>
        <p className={styles.priceDisplay}>
          ${minPrice} — ${maxPrice === 10000 ? '10,000+' : maxPrice}
        </p>
      </section>

      {onClose && (
        <button className={styles.applyBtn} onClick={onClose}>
          Apply Filters
        </button>
      )}
    </aside>
  )
}
