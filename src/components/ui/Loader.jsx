import { motion } from 'framer-motion'
import styles from './Loader.module.css'

/**
 * Loading indicator — either fullscreen or inline.
 *
 * @param {{ fullscreen?: boolean, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function Loader({ fullscreen = false, size = 'md' }) {
  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        <Spinner size={size} />
      </div>
    )
  }
  return <Spinner size={size} />
}

function Spinner({ size }) {
  return (
    <motion.div
      className={`${styles.spinner} ${styles[size]}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  )
}
