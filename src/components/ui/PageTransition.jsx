import { motion } from 'framer-motion'

/** Standard page transition variants */
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const pageTransition = {
  duration: 0.35,
  ease: 'easeOut',
}

/**
 * Wrapper that applies the standard page enter/exit animation.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={`page-wrapper ${className}`}
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}
