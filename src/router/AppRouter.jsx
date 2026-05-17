import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './ProtectedRoute'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CartDrawer from '../components/cart/CartDrawer'

// Pages — lazy loaded for code splitting
import { lazy, Suspense } from 'react'
import Loader from '../components/ui/Loader'

const HomePage = lazy(() => import('../pages/HomePage'))
const CatalogPage = lazy(() => import('../pages/CatalogPage'))
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'))
const OrdersPage = lazy(() => import('../pages/OrdersPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))

/**
 * Main application router.
 * Defines all client-side routes with AnimatePresence for page transitions.
 */
export default function AppRouter() {
  const location = useLocation()

  return (
    <>
      <Navbar />
      <CartDrawer />

      <Suspense fallback={<Loader fullscreen />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<CatalogPage />} />
            <Route path="/shop/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate404 />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <Footer />
    </>
  )
}

function Navigate404() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        paddingTop: '80px',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '8rem', color: 'var(--color-accent)' }}>
        404
      </h1>
      <p style={{ color: 'var(--color-text-muted)' }}>This page does not exist.</p>
      <a href="/" style={{ color: 'var(--color-accent)', borderBottom: '1px solid currentColor' }}>
        Return home
      </a>
    </div>
  )
}
