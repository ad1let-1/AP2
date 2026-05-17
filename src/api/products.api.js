import { productInstance } from './axiosInstance'

/**
 * CreateProduct — POST /products
 * @param {{ name, description, price, category_id, stock, images }} data
 */
export const createProduct = async (data) => {
  const response = await productInstance.post('/products', data)
  return response.data
}

/**
 * GetProductByID — GET /products/:id
 * @param {string} id
 */
export const getProductByID = async (id) => {
  const response = await productInstance.get(`/products/${id}`)
  return response.data
}

/**
 * UpdateProduct — PUT /products/:id
 * @param {string} id
 * @param {{ name?, description?, price?, stock? }} data
 */
export const updateProduct = async (id, data) => {
  const response = await productInstance.put(`/products/${id}`, data)
  return response.data
}

/**
 * DeleteProduct — DELETE /products/:id
 * @param {string} id
 */
export const deleteProduct = async (id) => {
  const response = await productInstance.delete(`/products/${id}`)
  return response.data
}

/**
 * ListProducts — GET /products
 * @param {{ page?, limit?, category_id?, sort?, min_price?, max_price? }} params
 * @returns {{ products: [], total: number, page: number }}
 */
export const listProducts = async (params = {}) => {
  const response = await productInstance.get('/products', { params })
  return response.data
}

/**
 * SearchProducts — GET /products/search
 * @param {{ q: string, page?, limit? }} params
 */
export const searchProducts = async (params) => {
  const response = await productInstance.get('/products/search', { params })
  return response.data
}

/**
 * CreateCategory — POST /categories
 * @param {{ name: string, description?: string }} data
 */
export const createCategory = async (data) => {
  const response = await productInstance.post('/categories', data)
  return response.data
}

/**
 * GetCategory — GET /categories/:id
 * @param {string} id
 */
export const getCategory = async (id) => {
  const response = await productInstance.get(`/categories/${id}`)
  return response.data
}

/**
 * ListCategories — GET /categories
 * @returns {{ categories: [] }}
 */
export const listCategories = async () => {
  const response = await productInstance.get('/categories')
  return response.data
}

/**
 * DeleteCategory — DELETE /categories/:id
 * @param {string} id
 */
export const deleteCategory = async (id) => {
  const response = await productInstance.delete(`/categories/${id}`)
  return response.data
}

/**
 * UpdateStock — PATCH /products/:id/stock
 * @param {string} id
 * @param {{ quantity: number }} data
 */
export const updateStock = async (id, data) => {
  const response = await productInstance.patch(`/products/${id}/stock`, data)
  return response.data
}

/**
 * GetProductReviews — GET /products/:id/reviews
 * @param {string} id
 * @param {{ page?, limit? }} params
 */
export const getProductReviews = async (id, params = {}) => {
  const response = await productInstance.get(`/products/${id}/reviews`, { params })
  return response.data
}
