import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', to: '/admin/dashboard' },
  { icon: '📦', label: 'Products',  to: '/admin/products' },
  { icon: '🏷️',  label: 'Categories', to: '/admin/categories' },
  { icon: '🛒', label: 'Orders',    to: '/admin/orders' },
]

export default function AdminLayout({ children, title = 'Admin' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const initial = user?.name?.[0]?.toUpperCase() || 'A'

  const handleExit = () => {
    navigate('/')
    setSidebarOpen(false)
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarLogo}>
          <Link to="/admin/dashboard" className={styles.logoText} onClick={closeSidebar}>
            DRIP ADMIN
          </Link>
          <div className={styles.logoSub}>Control Panel</div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={closeSidebar}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{initial}</div>
            <div>
              <div className={styles.userName}>{user?.name || 'Admin'}</div>
              <div className={styles.userEmail}>{user?.email || ''}</div>
            </div>
          </div>
          <button className={styles.exitBtn} onClick={handleExit}>
            ← Exit Admin
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.hamburger}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <span className={styles.pageTitle}>{title}</span>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.notifBtn} aria-label="Notifications">
              🔔
              <span className={styles.notifBadge}>!</span>
            </button>
            <div className={styles.topAvatar}>{initial}</div>
            <span className={styles.topAvatarName}>{user?.name || 'Admin'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
