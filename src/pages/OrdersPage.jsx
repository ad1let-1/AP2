import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import Loader from '../components/ui/Loader'
import { useOrdersList } from '../hooks/useOrders'
import styles from './OrdersPage.module.css'

const STATUS_COLORS = {
  pending:    { bg: '#fff3e0', text: '#e65100' },
  processing: { bg: '#e3f2fd', text: '#1565c0' },
  shipped:    { bg: '#e8f5e9', text: '#2e7d32' },
  delivered:  { bg: '#f3e5f5', text: '#6a1b9a' },
  cancelled:  { bg: '#ffebee', text: '#c62828' },
}

/**
 * Orders history page listing all user orders.
 */
export default function OrdersPage() {
  const { data, isLoading, isError } = useOrdersList()
  const orders = data?.orders || data || []

  return (
    <PageTransition>
      <div className="container">
        <h1 className={styles.pageTitle}>My Orders</h1>

        {isLoading && (
          <div className={styles.loaderWrapper}><Loader size="lg" /></div>
        )}

        {isError && (
          <div className={styles.error}>
            <p>Failed to load orders. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <motion.div
            className={styles.empty}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className={styles.emptyIcon}>📦</span>
            <h2 className={styles.emptyTitle}>No orders yet</h2>
            <p className={styles.emptyText}>Your order history will appear here.</p>
            <Link to="/shop" className={styles.shopLink}>Start Shopping →</Link>
          </motion.div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className={styles.ordersList}>
            {orders.map((order, i) => {
              const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              return (
                <motion.div
                  key={order.id}
                  className={styles.orderCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className={styles.orderHeader}>
                    <div>
                      <p className={styles.orderId}>Order #{order.id?.slice(0, 12)?.toUpperCase()}</p>
                      <p className={styles.orderDate}>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })
                          : 'Unknown date'}
                      </p>
                    </div>
                    <div className={styles.orderHeaderRight}>
                      <span
                        className={styles.statusBadge}
                        style={{ background: statusStyle.bg, color: statusStyle.text }}
                      >
                        {order.status || 'Pending'}
                      </span>
                      <span className={styles.orderTotal}>
                        ${order.totals?.total?.toFixed(2) || order.total?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className={styles.orderItems}>
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className={styles.orderItem}>
                        <img
                          src={item.image || `https://picsum.photos/seed/${item.productId}/60/60`}
                          alt={item.name || 'Product'}
                          className={styles.itemImg}
                        />
                        {idx === 2 && order.items.length > 3 && (
                          <span className={styles.moreItems}>+{order.items.length - 3}</span>
                        )}
                      </div>
                    ))}
                    <div className={styles.orderItemsInfo}>
                      <p className={styles.itemsCount}>
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
