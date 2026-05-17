import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <AdminPageHeader title="Dashboard Overview" />
      <div style={{ color: '#888' }}>
        <p>Admin Dashboard coming soon. This is a placeholder.</p>
      </div>
    </AdminLayout>
  )
}
