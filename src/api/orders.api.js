import { orderInstance } from './axiosInstance'

/**
 * CreateOrder — POST /orders
 * @param {{ user_id, items: [{product_id, quantity}], address }} data
 */
export const createOrder = async (data) => {
  const response = await orderInstance.post('/orders', data)
  return response.data
}

/**
 * GetOrderByID — GET /orders/:id
 * @param {string} id
 */
export const getOrderByID = async (id) => {
  const response = await orderInstance.get(`/orders/${id}`)
  return response.data
}

/**
 * ListOrders — GET /orders
 * Returns order history for authenticated user
 * @param {{ page?, limit?, status? }} params
 */
export const listOrders = async (params = {}) => {
  const response = await orderInstance.get('/orders', { params })
  return response.data
}

/**
 * CancelOrder — POST /orders/:id/cancel
 * @param {string} id
 */
export const cancelOrder = async (id) => {
  const response = await orderInstance.post(`/orders/${id}/cancel`)
  return response.data
}

/**
 * CreatePayment — POST /payments
 * @param {{ order_id: string, method: string }} data
 * @returns {{ payment_id, payment_url }}
 */
export const createPayment = async (data) => {
  const response = await orderInstance.post('/payments', data)
  return response.data
}

/**
 * GetPaymentStatus — GET /payments/:payment_id
 * @param {string} paymentId
 * @returns {{ status: 'pending'|'paid'|'failed' }}
 */
export const getPaymentStatus = async (paymentId) => {
  const response = await orderInstance.get(`/payments/${paymentId}`)
  return response.data
}

/**
 * UpdateOrderStatus — PATCH /orders/:id/status
 * @param {string} id
 * @param {{ status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled' }} data
 */
export const updateOrderStatus = async (id, data) => {
  const response = await orderInstance.patch(`/orders/${id}/status`, data)
  return response.data
}

/**
 * TrackOrder — GET /orders/:id/track
 * @param {string} id
 * @returns {{ location, status, estimated_delivery }}
 */
export const trackOrder = async (id) => {
  const response = await orderInstance.get(`/orders/${id}/track`)
  return response.data
}

/**
 * ApplyDiscount — POST /orders/:id/discount
 * @param {string} id
 * @param {{ promo_code: string }} data
 * @returns {{ discount_amount, new_total }}
 */
export const applyDiscount = async (id, data) => {
  const response = await orderInstance.post(`/orders/${id}/discount`, data)
  return response.data
}

/**
 * CalculateTotal — POST /orders/calculate
 * @param {{ items: [{product_id, quantity}], promo_code? }} data
 * @returns {{ subtotal, discount, delivery, total }}
 */
export const calculateTotal = async (data) => {
  const response = await orderInstance.post('/orders/calculate', data)
  return response.data
}

/**
 * AddItemToOrder — POST /orders/:id/items
 * @param {string} orderId
 * @param {{ product_id: string, quantity: number, price: number }} item
 */
export const addItemToOrder = async (orderId, item) => {
  const response = await orderInstance.post(`/orders/${orderId}/items`, item)
  return response.data
}

/**
 * RemoveItemFromOrder — DELETE /orders/:id/items/:productId
 * @param {string} orderId
 * @param {string} productId
 */
export const removeItemFromOrder = async (orderId, productId) => {
  const response = await orderInstance.delete(`/orders/${orderId}/items/${productId}`)
  return response.data
}
