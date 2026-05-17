import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const getToken = () => useAuthStore.getState().token

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const authInstance = axios.create({ baseURL })
export const productInstance = axios.create({ baseURL })
export const orderInstance = axios.create({ baseURL })

const applyInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getToken()
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (import.meta.env.DEV) {
        console.error('API Error:', error.config?.url, error.response?.data)
      }

      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      } else if (error.response?.status >= 500) {
        return Promise.reject(new Error('Server error'))
      }

      return Promise.reject(error)
    }
  )
}

applyInterceptors(authInstance)
applyInterceptors(productInstance)
applyInterceptors(orderInstance)
