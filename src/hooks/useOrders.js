import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  listOrders,
  getOrderByID,
  createOrder,
  cancelOrder,
  trackOrder,
} from '../api/orders.api'

export function useOrdersList(params = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => listOrders(params),
  })
}

export function useOrderDetail(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderByID(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order created successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create order'
      toast.error(message)
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to cancel order'
      toast.error(message)
    },
  })
}

export function useTrackOrder(id) {
  return useQuery({
    queryKey: ['trackOrder', id],
    queryFn: () => trackOrder(id),
    enabled: !!id,
    refetchInterval: 30000,
  })
}
