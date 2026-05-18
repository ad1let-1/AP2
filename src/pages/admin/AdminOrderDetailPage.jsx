import { useParams, useNavigate } from 'react-router-dom'
import { useOrderDetail, useUpdateOrderStatus } from '../../hooks/useOrders'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import Loader from '../../components/ui/Loader'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: order, isLoading, error } = useOrderDetail(id)
  const updateStatusMutation = useUpdateOrderStatus()

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus })
      toast.success('Order status updated successfully')
    } catch (err) {
      toast.error('Failed to update order status')
    }
  }

  return (
    <AdminLayout title={`Order Details`}>
      <AdminPageHeader title={`Order Details`} />

      <button
        onClick={() => navigate('/admin/orders')}
        style={{
          background: 'none',
          border: '1px solid #333',
          color: '#ccc',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          marginBottom: '24px',
          fontWeight: '600'
        }}
      >
        ← Back to Orders
      </button>

      {isLoading ? (
        <div style={{ display: 'flex', padding: '40px' }}><Loader size="lg" /></div>
      ) : error || !order ? (
        <div style={{ color: '#ff4d4d' }}>Error loading order details: {error?.message || 'Order not found'}</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          color: '#fff'
        }}>
          {/* Left panel: Items list */}
          <div style={{
            background: '#111',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #222'
          }}>
            <h3 style={{ borderBottom: '1px solid #222', paddingBottom: '12px', marginBottom: '20px', fontWeight: '600' }}>Order Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(order.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #222', paddingBottom: '12px' }}>
                  <img
                    src={item.image || `https://picsum.photos/seed/${item.product_id}/80/80`}
                    alt="item"
                    style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Product #{item.product_id?.slice(0, 8)}</p>
                    <p style={{ color: '#888', fontSize: '12px' }}>Qty: {item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: '700', alignSelf: 'center' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                <span>Subtotal</span>
                <span>${(order.totals?.subtotal || order.total_amount * 0.92).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                <span>Shipping</span>
                <span>${(order.totals?.shipping || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                <span>Tax (8%)</span>
                <span>${(order.totals?.tax || order.total_amount * 0.08).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', borderTop: '1px solid #222', paddingTop: '12px', marginTop: '8px' }}>
                <span>Total Amount</span>
                <span style={{ color: '#e8ff00' }}>${(order.totals?.total || order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right panel: Shipping and update status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Status Manager */}
            <div style={{
              background: '#111',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #222'
            }}>
              <h3 style={{ marginBottom: '16px', fontWeight: '600' }}>Update Status</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={(order.status || 'PENDING').toUpperCase()}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateStatusMutation.isPending}
                  style={{
                    flex: 1,
                    background: '#222',
                    color: '#fff',
                    border: '1px solid #333',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{
              background: '#111',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #222',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <h3 style={{ borderBottom: '1px solid #222', paddingBottom: '12px', marginBottom: '16px', fontWeight: '600' }}>Shipping Details</h3>
              <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
                {order.address?.firstName || 'John'} {order.address?.lastName || 'Doe'}
              </p>
              <p style={{ color: '#ccc' }}>{order.address?.street || '123 Main St, Apt 4'}</p>
              <p style={{ color: '#ccc' }}>{order.address?.city || 'New York'}, {order.address?.postalCode || '10001'}</p>
              <p style={{ color: '#ccc', marginBottom: '16px' }}>{order.address?.country || 'United States'}</p>

              <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>Contact Info</h4>
              <p style={{ color: '#ccc' }}>Email: {order.contact?.email || 'customer@example.com'}</p>
              {order.contact?.phone && <p style={{ color: '#ccc' }}>Phone: {order.contact?.phone}</p>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
