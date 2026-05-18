import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductsList, useDeleteProduct, useCategories } from '../../hooks/useProducts'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmModal from '../../components/admin/ConfirmModal'
import toast from 'react-hot-toast'
import styles from './AdminProductsPage.module.css'

export default function AdminProductsPage() {
  const { data: productsData, isLoading, error } = useProductsList({ limit: 100 })
  const { data: categoriesData } = useCategories()
  const deleteMutation = useDeleteProduct()

  const [deleteId, setDeleteId] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const products = productsData?.products || []
  const categories = categoriesData?.categories || []

  // Create a fast map for category names
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name
    return acc
  }, {})

  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Product deleted successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to delete product')
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <AdminLayout title="Products">
      <AdminPageHeader title="Products">
        <div className={styles.headerActions}>
          <Link to="/admin/products/new" className={styles.addBtn}>
            + Add New Product
          </Link>
        </div>
      </AdminPageHeader>

      {isLoading ? (
        <div className={styles.loading}>Loading products...</div>
      ) : error ? (
        <div className={styles.error}>Error loading products: {error.message}</div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <p>No products found in the catalog.</p>
          <Link to="/admin/products/new" className={styles.addBtn}>
            Create your first product
          </Link>
        </div>
      ) : (
        <div className={styles.productsTableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = product.stock ?? 0
                let stockClass = styles.inStock
                let stockLabel = `${stock} in stock`

                if (stock === 0) {
                  stockClass = styles.outOfStock
                  stockLabel = 'Out of Stock'
                } else if (stock <= 5) {
                  stockClass = styles.lowStock
                  stockLabel = `Low Stock (${stock})`
                }

                return (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productCell}>
                        <div className={styles.productImage}>
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className={styles.productImage} />
                          ) : (
                            '📦'
                          )}
                        </div>
                        <div>
                          <div className={styles.productName}>{product.name}</div>
                          <div className={styles.productId}>ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {categoryMap[product.category_id] || product.category_id || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.price}>
                        {parseFloat(product.price).toLocaleString()} KZT
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.stockBadge} ${stockClass}`}>
                        {stockLabel}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link to={`/admin/products/${product.id}`} className={styles.actionBtn}>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product?"
        message="Are you sure you want to remove this product? This action is permanent and cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  )
}
