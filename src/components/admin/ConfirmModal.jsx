import { motion, AnimatePresence } from 'framer-motion'
import styles from './ConfirmModal.module.css'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  isLoading = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className={styles.iconWrap}>⚠️</div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
