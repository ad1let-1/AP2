import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useLogin } from '../hooks/useAuth'
import styles from './AuthPage.module.css'

/**
 * Login page with form validation and redirect-back support.
 */
export default function LoginPage() {
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const loginMutation = useLogin(redirectTo)

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6 && form.email.trim() !== 'admin@gmail.com') errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    loginMutation.mutate(form)
  }

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.panel}>
          {/* Brand */}
          <motion.div
            className={styles.brand}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className={styles.logo}>NOVUS</Link>
            <p className={styles.tagline}>Welcome back</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className={styles.form}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Input
              id="login-email"
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />
            <Input
              id="login-password"
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className={styles.forgotRow}>
              <a href="#" className={styles.forgotLink}>Forgot password?</a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loginMutation.isPending}
              id="login-submit-btn"
            >
              Sign In
            </Button>
          </motion.form>

          <motion.p
            className={styles.switchLink}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Don't have an account?{' '}
            <Link to="/register" className={styles.switchAnchor}>Create one</Link>
          </motion.p>
        </div>

        {/* Decorative side */}
        <div className={styles.deco} aria-hidden="true">
          <div className={styles.decoGradient} />
          <p className={styles.decoQuote}>"Fashion is the armor to survive the reality of everyday life."</p>
        </div>
      </div>
    </PageTransition>
  )
}
