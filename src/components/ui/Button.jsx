import { motion } from 'framer-motion'
import styles from './Button.module.css'

/**
 * Reusable animated button component.
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'primary' | 'secondary' | 'ghost' | 'danger',
 *   size?: 'sm' | 'md' | 'lg',
 *   fullWidth?: boolean,
 *   isLoading?: boolean,
 *   disabled?: boolean,
 *   onClick?: function,
 *   type?: string,
 *   className?: string,
 * }} props
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <motion.button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      disabled={disabled || isLoading}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...rest}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-label="Loading" />
      ) : (
        children
      )}
    </motion.button>
  )
}
