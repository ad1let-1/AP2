import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import styles from './StatsCard.module.css'

function useCountUp(target, duration = 1000) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current === null) return
    const start = 0
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      if (ref.current) ref.current.textContent = Math.floor(progress * target)
      if (progress < 1) requestAnimationFrame(step)
    }
    let startTime = null
    requestAnimationFrame(step)
  }, [target, duration])
  return ref
}

export default function StatsCard({ label, value, icon, trend, trendLabel, accentColor }) {
  const countRef = useCountUp(Number(value) || 0)

  const trendClass =
    trend > 0 ? styles.up : trend < 0 ? styles.down : styles.neutral
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→'

  return (
    <motion.div
      className={styles.card}
      style={{ '--accent': accentColor || '#e8ff00' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <div className={styles.label}>{label}</div>
      <div className={styles.value} ref={countRef}>0</div>
      {(trend !== undefined || trendLabel) && (
        <div className={styles.footer}>
          {trend !== undefined && (
            <span className={`${styles.trend} ${trendClass}`}>
              {trendArrow} {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && <span className={styles.trendLabel}>{trendLabel}</span>}
        </div>
      )}
    </motion.div>
  )
}
