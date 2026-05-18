import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { useLogout } from '../../hooks/useAuth'
import styles from './Navbar.module.css'

/**
 * A&O-style minimal navigation bar.
 * Center-logo layout, clean uppercase links, transparent → frosted on scroll.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const itemCount = useCartStore((s) => s.itemCount)
  const openDrawer = useCartStore((s) => s.toggleCart)
  const logoutMutation = useLogout()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <motion.header
        className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={styles.inner}>

          {/* ── Left nav ── */}
          <nav className={styles.navLeft} aria-label="Shop categories">
            <NavLink to="/shop?category=clothing" className={styles.navLink}>Women</NavLink>
            <NavLink to="/shop?category=gadgets" className={styles.navLink}>Gadgets</NavLink>
            <NavLink to="/shop?category=tech" className={styles.navLink}>Tech</NavLink>
            <NavLink to="/shop" className={styles.navLink}>All</NavLink>
          </nav>

          {/* ── Center logo ── */}
          <Link to="/" className={styles.logo} aria-label="NOVUS — Home">
            NOVUS
          </Link>

          {/* ── Right actions ── */}
          <div className={styles.navRight}>
            {/* Search */}
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              id="navbar-search-btn"
            >
              <SearchIcon />
            </button>

            {/* Account */}
            {isAuthenticated ? (
              <div className={styles.accountMenu}>
                <button className={styles.iconBtn} id="navbar-account-btn" aria-label="Account">
                  ACCOUNT
                </button>
                <div className={styles.accountDropdown}>
                  <div className={styles.accountInfo}>
                    <span>{user?.name}</span>
                    <span className={styles.accountEmail}>{user?.email}</span>
                  </div>
                  {user?.email === 'admin@gmail.com' && (
                    <Link to="/admin/dashboard" className={styles.accountItem} style={{ color: '#e8ff00', fontWeight: '700' }}>
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/profile" className={styles.accountItem}>Profile</Link>
                  <Link to="/orders" className={styles.accountItem}>Orders</Link>
                  <button
                    className={`${styles.accountItem} ${styles.logoutItem}`}
                    onClick={() => logoutMutation.mutate()}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className={styles.navLink} id="navbar-signin-btn">
                Account
              </Link>
            )}

            {/* Cart */}
            <button
              className={styles.cartBtn}
              onClick={openDrawer}
              aria-label={`Cart — ${itemCount} items`}
              id="navbar-cart-btn"
            >
              <CartIcon />
              {itemCount > 0 && (
                <motion.span
                  className={styles.cartBadge}
                  key={itemCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                >
                  {itemCount}
                </motion.span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className={styles.hamburger}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              id="navbar-menu-btn"
            >
              <span className={`${styles.hBar} ${mobileOpen ? styles.hBar1On : ''}`} />
              <span className={`${styles.hBar} ${mobileOpen ? styles.hBar2On : ''}`} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className={styles.searchBar}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 56, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <SearchIcon />
                <input
                  autoFocus
                  className={styles.searchInput}
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="navbar-search-input"
                />
                <button type="submit" className={styles.searchSubmit} aria-label="Go">→</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className={styles.mobileNav}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            aria-label="Mobile navigation"
          >
            <div className={styles.mobileNavHeader}>
              <Link to="/" className={styles.mobileLogo} onClick={() => setMobileOpen(false)}>NOVUS</Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close" className={styles.mobileClose}>✕</button>
            </div>
            {[
              { label: 'Shop All', to: '/shop' },
              { label: 'Clothing', to: '/shop?category=clothing' },
              { label: 'Gadgets', to: '/shop?category=gadgets' },
              { label: 'Tech', to: '/shop?category=tech' },
              { label: 'Account', to: isAuthenticated ? '/profile' : '/login' },
              { label: 'Orders', to: '/orders' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className={styles.mobileNavLink}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                className={styles.mobileSignOut}
                onClick={() => { logoutMutation.mutate(); setMobileOpen(false) }}
              >
                Sign Out
              </button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}
function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
