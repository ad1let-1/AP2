import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useParams } from 'react-router-dom'

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  return (
    <AdminLayout title={`Order #${id}`}>
      <AdminPageHeader title={`Order #${id}`} />
      <p style={{ color: '#888' }}>Order Detail page coming soon.</p>
    </AdminLayout>
  )
}
