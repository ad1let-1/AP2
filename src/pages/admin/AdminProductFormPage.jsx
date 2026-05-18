import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useProductDetail, useCreateProduct, useUpdateProduct, useCategories } from '../../hooks/useProducts'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFormInput from '../../components/admin/AdminFormInput'
import toast from 'react-hot-toast'
import styles from './AdminProductFormPage.module.css'

export default function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: product, isLoading: isLoadingProduct } = useProductDetail(id)
  const { data: categoriesData } = useCategories()
  
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const categories = categoriesData?.categories || []

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    images: '',
  })

  const [errors, setErrors] = useState({})

  // Set form data when product details are loaded in edit mode
  useEffect(() => {
    if (isEdit && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price ? product.price.toString() : '',
        category_id: product.category_id || '',
        stock: product.stock ? product.stock.toString() : '0',
        images: product.images ? product.images.join(', ') : '',
      })
    }
  }, [isEdit, product])

  // Set default category when categories are loaded
  useEffect(() => {
    if (!isEdit && categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id }))
    }
  }, [isEdit, categories, formData.category_id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number'
    }
    if (!formData.category_id) newErrors.category_id = 'Category is required'
    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock must be 0 or higher'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const parsedImages = formData.images
      ? formData.images.split(',').map((img) => img.trim()).filter(Boolean)
      : []

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category_id: formData.category_id,
      stock: parseInt(formData.stock),
      images: parsedImages,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: payload })
        toast.success('Product updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Product created successfully')
      }
      navigate('/admin/products')
    } catch (err) {
      toast.error(err.message || 'An error occurred')
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'Create Product'}>
      <AdminPageHeader title={isEdit ? `Edit: ${product?.name || ''}` : 'New Product'} />

      {isEdit && isLoadingProduct ? (
        <div className={styles.loading}>Loading product details...</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGrid}>
            <AdminFormInput
              label="Product Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="e.g. Premium Oversized Hoodie"
              className={styles.fullWidth}
            />

            <AdminFormInput
              label="Description"
              id="description"
              name="description"
              textarea
              rows={4}
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Describe the product materials, fit, care instructions..."
              className={styles.fullWidth}
            />

            <AdminFormInput
              label="Price (KZT)"
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              placeholder="e.g. 15000"
            />

            <AdminFormInput
              label="Stock Quantity"
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              error={errors.stock}
              placeholder="e.g. 50"
            />

            <div className={styles.selectGroup}>
              <label htmlFor="category_id" className={styles.label}>
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={styles.select}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className={styles.error}>{errors.category_id}</p>}
            </div>

            <AdminFormInput
              label="Image URLs (comma separated)"
              id="images"
              name="images"
              value={formData.images}
              onChange={handleChange}
              error={errors.images}
              placeholder="e.g. https://domain.com/img1.jpg, https://domain.com/img2.jpg"
              hint="Provide direct links to image files hosted online"
              className={styles.fullWidth}
            />
          </div>

          <div className={styles.actions}>
            <Link to="/admin/products" className={styles.cancelBtn}>
              Cancel
            </Link>
            <button type="submit" disabled={isMutating} className={styles.submitBtn}>
              {isMutating ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
