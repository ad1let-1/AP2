import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listProducts,
  getProductByID,
  searchProducts,
  getProductReviews,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
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

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name) => import('../api/products.api').then(m => m.createCategory({ name })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => import('../api/products.api').then(m => m.deleteCategory(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
