import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import Loader from '../components/ui/Loader'

/**
 * AdminRoute — guards all /admin/* routes.
 * Reads JWT payload to check role === "admin".
 * Redirects unauthenticated → /login
 * Redirects non-admin → / with access denied toast
 */
function getJwtPayload(token) {
  try {
    if (!token) return null
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export default function AdminRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore()

  // Still hydrating from localStorage
  if (token === undefined) {
    return <Loader fullscreen />
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  const payload = getJwtPayload(token)
  const role = payload?.role || payload?.Role || payload?.authorities

  if (role !== 'admin') {
    toast.error('Access denied — Admin only')
    return <Navigate to="/" replace />
  }

  return children
}
