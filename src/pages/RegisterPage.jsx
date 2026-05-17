import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useRegister } from '../hooks/useAuth'
import styles from './AuthPage.module.css'

/**
 * Register page with full form validation.
 */
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})

  const registerMutation = useRegister()

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match'
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
    registerMutation.mutate({ name: form.name, email: form.email, password: form.password })
  }

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.panel}>
          <motion.div
            className={styles.brand}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className={styles.logo}>NOVUS</Link>
            <p className={styles.tagline}>Create your account</p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className={styles.form}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Input
              id="register-name"
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              autoComplete="name"
              autoFocus
            />
            <Input
              id="register-email"
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              id="register-password"
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              id="register-confirm-password"
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <p className={styles.termsNote}>
              By creating an account, you agree to our{' '}
              <a href="#" className={styles.forgotLink}>Terms of Service</a> and{' '}
              <a href="#" className={styles.forgotLink}>Privacy Policy</a>.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={registerMutation.isPending}
              id="register-submit-btn"
            >
              Create Account
            </Button>
          </motion.form>

          <motion.p
            className={styles.switchLink}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Already have an account?{' '}
            <Link to="/login" className={styles.switchAnchor}>Sign in</Link>
          </motion.p>
        </div>

        <div className={styles.deco} aria-hidden="true">
          <div className={styles.decoGradient} />
          <p className={styles.decoQuote}>"Style is a way to say who you are without having to speak."</p>
        </div>
      </div>
    </PageTransition>
  )
}
