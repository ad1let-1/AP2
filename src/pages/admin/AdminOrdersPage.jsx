import { useState } from 'react'
import { useOrdersList, useUpdateOrderStatus } from '../../hooks/useOrders'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import Loader from '../../components/ui/Loader'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_COLORS = {
  PENDING:    { bg: '#ffe58f', text: '#d46b08' },
  PROCESSING: { bg: '#91d5ff', text: '#096dd9' },
  SHIPPED:    { bg: '#d9f7be', text: '#389e0d' },
  DELIVERED:  { bg: '#f9f0ff', text: '#531dab' },
  CANCELLED:  { bg: '#ffccc7', text: '#cf1322' },
}

export default function AdminOrdersPage() {
  const { data, isLoading, error } = useOrdersList({ limit: 100 })
  const updateStatusMutation = useUpdateOrderStatus()
  const [filterStatus, setFilterStatus] = useState('ALL')

  const orders = data?.orders || data || []

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus })
    } catch (err) {
      toast.error('Failed to update order status')
    }
  }

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => (o.status || 'PENDING').toUpperCase() === filterStatus)

  return (
    <AdminLayout title="Orders">
      <AdminPageHeader title="Orders Management" />

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        background: '#111',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #222'
      }}>
        <span style={{ color: '#888', alignSelf: 'center', fontSize: '13px', marginRight: '8px' }}>Filter by Status:</span>
        {['ALL', ...STATUS_OPTIONS].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              background: filterStatus === status ? '#e8ff00' : '#222',
              color: filterStatus === status ? '#000' : '#ccc',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '4px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader size="lg" /></div>
      ) : error ? (
        <div style={{ color: '#ff4d4d', padding: '20px' }}>Failed to load orders: {error.message}</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '60px', background: '#111', borderRadius: '8px', border: '1px solid #222' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📦</span>
          No orders found matching the criteria.
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          background: '#111',
          borderRadius: '8px',
          border: '1px solid #222'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            color: '#fff',
            fontSize: '13px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222', background: '#0a0a0a' }}>
                <th style={{ padding: '16px' }}>Order ID</th>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Customer Email</th>
                <th style={{ padding: '16px' }}>Items</th>
                <th style={{ padding: '16px' }}>Total</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const currentStatus = (order.status || 'PENDING').toUpperCase()
                const statusStyle = STATUS_COLORS[currentStatus] || STATUS_COLORS.PENDING

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: '700', color: '#e8ff00' }}>
                      #{order.id?.slice(0, 12).toUpperCase()}
                    </td>
                    <td style={{ padding: '16px', color: '#888' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', color: '#ccc' }}>
                      {order.contact?.email || 'customer@example.com'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(order.items || []).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.image || `https://picsum.photos/seed/${item.product_id}/40/40`}
                            alt="item"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                              border: '1px solid #333'
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#fff' }}>
                      ${(order.totals?.total || order.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '11px',
                        textTransform: 'uppercase'
                      }}>
                        {currentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updateStatusMutation.isPending}
                        style={{
                          background: '#222',
                          color: '#fff',
                          border: '1px solid #333',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          outline: 'none',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
