import { useState } from 'react'
import { useCategories, useCreateCategory, useDeleteCategory } from '../../hooks/useProducts'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import Loader from '../../components/ui/Loader'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
  const { data, isLoading, error } = useCategories()
  const createMutation = useCreateCategory()
  const deleteMutation = useDeleteCategory()
  const [newCategoryName, setNewCategoryName] = useState('')

  const categories = data?.categories || data || []

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      await createMutation.mutateAsync(newCategoryName)
      toast.success('Category created successfully')
      setNewCategoryName('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Category deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category')
    }
  }

  return (
    <AdminLayout title="Categories">
      <AdminPageHeader title="Categories Management" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        marginTop: '24px'
      }}>
        {/* Create form */}
        <div style={{
          background: '#111',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #222',
          maxWidth: '500px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontWeight: '600' }}>Create New Category</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="e.g. Outerwear"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{
                flex: 1,
                background: '#222',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '10px 14px',
                color: '#fff',
                outline: 'none',
                fontSize: '13px'
              }}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                background: '#e8ff00',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {createMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontWeight: '600' }}>Existing Categories</h3>
          {isLoading ? (
            <div style={{ display: 'flex', padding: '20px' }}><Loader /></div>
          ) : error ? (
            <div style={{ color: '#ff4d4d' }}>Error loading categories: {error.message}</div>
          ) : categories.length === 0 ? (
            <div style={{ color: '#888', fontStyle: 'italic' }}>No categories created yet.</div>
          ) : (
            <div style={{
              background: '#111',
              borderRadius: '8px',
              border: '1px solid #222',
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: '#fff',
                fontSize: '13px',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #222' }}>
                    <th style={{ padding: '14px 20px' }}>Category Name</th>
                    <th style={{ padding: '14px 20px' }}>Category ID</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700' }}>{cat.name}</td>
                      <td style={{ padding: '14px 20px', color: '#666', fontFamily: 'monospace' }}>{cat.id}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleteMutation.isPending}
                          style={{
                            background: 'none',
                            border: '1px solid #ff4d4d',
                            color: '#ff4d4d',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
