import { create } from 'zustand'

/**
 * @typedef {Object} FilterState
 * @property {string} category     - Active category filter ('all' | 'clothing' | 'gadgets' | 'tech')
 * @property {string} sort         - Sort order ('newest' | 'price_asc' | 'price_desc')
 * @property {number} minPrice     - Minimum price filter
 * @property {number} maxPrice     - Maximum price filter
 * @property {number} page         - Current page number
 * @property {string} search       - Active search query
 * @property {function(string): void} setCategory
 * @property {function(string): void} setSort
 * @property {function(number, number): void} setPriceRange
 * @property {function(number): void} setPage
 * @property {function(string): void} setSearch
 * @property {function(): void} resetFilters
 * @property {function(): object} getQueryParams
 */

const DEFAULT_FILTERS = {
  category: 'all',
  sort: 'newest',
  minPrice: 0,
  maxPrice: 10000,
  page: 1,
  search: '',
}

/**
 * Zustand filter store (not persisted — URL is the source of truth for filters).
 * Manages product catalog filtering, sorting, and search state.
 *
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<FilterState>>}
 */
export const useFilterStore = create((set, get) => ({
  ...DEFAULT_FILTERS,

  /**
   * Set the active category filter.
   * @param {string} category
   */
  setCategory: (category) => set({ category, page: 1 }),

  /**
   * Set the sort order.
   * @param {string} sort
   */
  setSort: (sort) => set({ sort, page: 1 }),

  /**
   * Set the price range filter.
   * @param {number} min
   * @param {number} max
   */
  setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max, page: 1 }),

  /**
   * Set the current pagination page.
   * @param {number} page
   */
  setPage: (page) => set({ page }),

  /**
   * Set the active search query.
   * @param {string} query
   */
  setSearch: (query) => set({ search: query, page: 1 }),

  /**
   * Hydrate filter state from URL search params.
   * @param {URLSearchParams} params
   */
  hydrateFromURL: (params) => {
    set({
      category: params.get('category') || DEFAULT_FILTERS.category,
      sort: params.get('sort') || DEFAULT_FILTERS.sort,
      minPrice: Number(params.get('min')) || DEFAULT_FILTERS.minPrice,
      maxPrice: Number(params.get('max')) || DEFAULT_FILTERS.maxPrice,
      page: Number(params.get('page')) || DEFAULT_FILTERS.page,
      search: params.get('q') || DEFAULT_FILTERS.search,
    })
  },

  /** Reset all filters to defaults. */
  resetFilters: () => set({ ...DEFAULT_FILTERS }),

  /**
   * Build query params object for API calls.
   * @returns {object}
   */
  getQueryParams: () => {
    const { category, sort, minPrice, maxPrice, page, search } = get()
    return {
      ...(category !== 'all' && { category }),
      sort,
      min: minPrice,
      max: maxPrice,
      page,
      limit: 12,
      ...(search && { q: search }),
    }
  },
}))
