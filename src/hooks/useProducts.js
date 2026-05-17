import { useQuery } from '@tanstack/react-query'
import {
  listProducts,
  getProductByID,
  searchProducts,
  getProductReviews,
  listCategories,
} from '../api/products.api'

export function useProductsList(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  })
}

export function useProductDetail(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductByID(id),
    enabled: !!id,
  })
}

export function useProductSearch(query) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts({ q: query }),
    enabled: !!query,
  })
}

export function useProductReviews(id) {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getProductReviews(id),
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  })
}
