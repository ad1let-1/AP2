import styles from './StatusBadge.module.css'

const ORDER_STATUS = {
  pending:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  processing: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  shipped:    { label: 'Shipped',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  delivered:  { label: 'Delivered',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  cancelled:  { label: 'Cancelled',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const STOCK_STATUS = {
  instock:  { label: 'In Stock',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  low:      { label: 'Low Stock',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  outstock: { label: 'Out of Stock',color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function getStockStatus(qty) {
  if (qty === 0) return STOCK_STATUS.outstock
  if (qty <= 10) return STOCK_STATUS.low
  return STOCK_STATUS.instock
}

export default function StatusBadge({ type = 'order', status, qty }) {
  let config

  if (type === 'stock') {
    config = getStockStatus(qty ?? 0)
    const label = qty === 0
      ? 'Out of Stock'
      : qty <= 10
        ? `Low Stock (${qty})`
        : 'In Stock'
    return (
      <span
        className={styles.badge}
        style={{ color: config.color, background: config.bg }}
      >
        {label}
      </span>
    )
  }

  config = ORDER_STATUS[status] || { label: status, color: '#888', bg: 'rgba(136,136,136,0.12)' }

  return (
    <span
      className={styles.badge}
      style={{ color: config.color, background: config.bg, transition: 'all 0.25s ease' }}
    >
      {config.label}
    </span>
  )
}
