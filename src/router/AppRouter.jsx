import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CartDrawer from '../components/cart/CartDrawer'

import { lazy, Suspense } from 'react'
import Loader from '../components/ui/Loader'

// ── Public pages ──────────────────────────────────────────
const HomePage          = lazy(() => import('../pages/HomePage'))
const CatalogPage       = lazy(() => import('../pages/CatalogPage'))
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'))
const CartPage          = lazy(() => import('../pages/CartPage'))
const CheckoutPage      = lazy(() => import('../pages/CheckoutPage'))
const OrdersPage        = lazy(() => import('../pages/OrdersPage'))
const ProfilePage       = lazy(() => import('../pages/ProfilePage'))
const LoginPage         = lazy(() => import('../pages/LoginPage'))
const RegisterPage      = lazy(() => import('../pages/RegisterPage'))

// ── Admin pages ──────────────────────────────────────────
const AdminDashboardPage  = lazy(() => import('../pages/admin/AdminDashboardPage'))
const AdminProductsPage   = lazy(() => import('../pages/admin/AdminProductsPage'))
const AdminProductFormPage= lazy(() => import('../pages/admin/AdminProductFormPage'))
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage'))
const AdminOrdersPage     = lazy(() => import('../pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage= lazy(() => import('../pages/admin/AdminOrderDetailPage'))

export default function AppRouter() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      {/* Hide main nav on admin pages */}
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}

      <Suspense fallback={<Loader fullscreen />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>

            {/* ── Public routes ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<CatalogPage />} />
            <Route path="/shop/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Protected user routes ── */}
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders"   element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* ── Admin routes ── */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard"     element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/products"      element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
            <Route path="/admin/products/new"  element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
            <Route path="/admin/products/:id"  element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
            <Route path="/admin/categories"    element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
            <Route path="/admin/orders"        element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
            <Route path="/admin/orders/:id"    element={<AdminRoute><AdminOrderDetailPage /></AdminRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate404 />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {!isAdmin && <Footer />}
    </>
  )
}

function Navigate404() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem', paddingTop: '80px',
    }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '8rem', color: 'var(--color-accent)' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>This page does not exist.</p>
      <a href="/" style={{ color: 'var(--color-accent)', borderBottom: '1px solid currentColor' }}>Return home</a>
    </div>
  )
}
