import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getMe, loginUser, registerUser, logout } from '../api/auth.api'
import { useAuthStore } from '../store/authStore'

export function useGetMe() {
  const token = useAuthStore((s) => s.token)
  
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refresh_token)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Logged in successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refresh_token)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Registered successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      toast.success('Logged out')
      window.location.href = '/login'
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data) => import('../api/auth.api').then(m => m.updateUser(user?.id, data)),
    onSuccess: (data) => {
      if (data.user) setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    },
  })
}
