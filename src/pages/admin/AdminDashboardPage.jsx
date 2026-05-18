import { useProductsList, useCategories } from '../../hooks/useProducts'
import { useOrdersList } from '../../hooks/useOrders'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatsCard from '../../components/admin/StatsCard'

export default function AdminDashboardPage() {
  const { data: productsData } = useProductsList({ limit: 100 })
  const { data: categoriesData } = useCategories()
  const { data: ordersData } = useOrdersList({ limit: 100 })

  const totalProducts = productsData?.total || productsData?.products?.length || 0
  const totalCategories = categoriesData?.categories?.length || 0
  const totalOrders = ordersData?.total || ordersData?.orders?.length || 0

  // Calculate gross sales
  const grossSales = (ordersData?.orders || []).reduce((acc, order) => {
    if (order.status === 'PAID' || order.status === 'DELIVERED') {
      return acc + (order.total_amount || 0)
    }
    return acc
  }, 0)

  return (
    <AdminLayout title="Dashboard">
      <AdminPageHeader title="Dashboard Overview" />
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        marginTop: '24px'
      }}>
        <StatsCard
          label="Total Gross Sales"
          value={grossSales}
          icon="💰"
          trend={12}
          trendLabel="vs last month"
          accentColor="#2ecc71"
        />
        <StatsCard
          label="Total Orders"
          value={totalOrders}
          icon="🛒"
          trend={8}
          trendLabel="vs last week"
          accentColor="#e8ff00"
        />
        <StatsCard
          label="Catalog Products"
          value={totalProducts}
          icon="📦"
          trend={2}
          trendLabel="newly added"
          accentColor="#3498db"
        />
        <StatsCard
          label="Categories"
          value={totalCategories}
          icon="🏷️"
          accentColor="#9b59b6"
        />
      </div>

      <div style={{
        marginTop: '40px',
        background: '#111111',
        border: '1px solid #222222',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h3 style={{ color: '#ffffff', marginBottom: '16px', fontWeight: '600' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a
            href="/admin/products/new"
            style={{
              background: '#e8ff00',
              color: '#0a0a0a',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'background 0.2s'
            }}
          >
            Create New Product
          </a>
          <a
            href="/admin/products"
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            Manage Products
          </a>
          <a
            href="/"
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#888',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            Go to Shop Website
          </a>
        </div>
      </div>
    </AdminLayout>
  )
}
