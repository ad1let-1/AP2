import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const getStorageValue = (key, defaultValue) => {
  try {
    const item = localStorage.getItem('novus-auth-storage')
    if (item) {
      const parsed = JSON.parse(item)
      if (parsed?.state && parsed.state[key] !== undefined) {
        return parsed.state[key]
      }
    }
  } catch {}
  return defaultValue
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: getStorageValue('user', null),
      token: getStorageValue('token', null),
      refreshToken: getStorageValue('refreshToken', null),
      isAuthenticated: getStorageValue('isAuthenticated', false),

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),

      clearAuth: () => {
        // Clear local storage key just to be absolutely sure
        try {
          localStorage.removeItem('novus-auth-storage')
        } catch {}
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'novus-auth-storage',
    }
  )
)
