import { authInstance } from './axiosInstance'

/**
 * RegisterUser — POST /auth/register
 * @param {{ name: string, email: string, password: string }} data
 */
export const registerUser = async (data) => {
  const response = await authInstance.post('/users/register', data)
  return response.data
}

/**
 * LoginUser — POST /auth/login
 * @param {{ email: string, password: string }} data
 * @returns {{ token: string, refresh_token: string, user: object }}
 */
export const loginUser = async (data) => {
  const response = await authInstance.post('/users/login', data)
  return response.data
}

/**
 * GetMe — GET /auth/me
 * Returns current authenticated user data
 */
export const getMe = async () => {
  const response = await authInstance.get('/users/me')
  return response.data
}

/**
 * RefreshToken — POST /auth/refresh
 * @param {{ refresh_token: string }} data
 * @returns {{ token: string }}
 */
export const refreshToken = async (data) => {
  const response = await authInstance.post('/auth/refresh', data)
  return response.data
}

/**
 * Logout — POST /auth/logout
 * Invalidates token on server
 */
export const logout = async () => {
  const response = await authInstance.post('/auth/logout')
  return response.data
}

/**
 * GetUserByID — GET /users/:id
 * @param {string} id — UUID
 */
export const getUserByID = async (id) => {
  const response = await authInstance.get(`/users/${id}`)
  return response.data
}

/**
 * UpdateUser — PUT /users/:id
 * @param {string} id
 * @param {{ name?: string, email?: string }} data
 */
export const updateUser = async (id, data) => {
  const response = await authInstance.put(`/users/${id}`, data)
  return response.data
}

/**
 * DeleteUser — DELETE /users/:id
 * @param {string} id
 */
export const deleteUser = async (id) => {
  const response = await authInstance.delete(`/users/${id}`)
  return response.data
}

/**
 * ChangePassword — PUT /users/:id/password
 * @param {string} id
 * @param {{ old_password: string, new_password: string }} data
 */
export const changePassword = async (id, data) => {
  const response = await authInstance.put(`/users/${id}/password`, data)
  return response.data
}

/**
 * VerifyEmail — GET /users/verify
 * @param {string} token
 */
export const verifyEmail = async (token) => {
  const response = await authInstance.get(`/users/verify`, { params: { token } })
  return response.data
}

/**
 * ResendVerification — POST /users/resend-verification
 * @param {{ email: string }} data
 */
export const resendVerification = async (data) => {
  const response = await authInstance.post('/users/resend-verification', data)
  return response.data
}

/**
 * ListUsers — GET /users
 * @param {{ page?: number, limit?: number }} params
 */
export const listUsers = async (params = {}) => {
  const response = await authInstance.get('/users', { params })
  return response.data
}
