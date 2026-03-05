import axios from 'axios'
import { clearAuthSession, getAuthToken } from '@/auth'

const baseURL = (import.meta.env.VITE_API_URL || '').trim() || '/'

const api = axios.create({
  baseURL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401
    const requestUrl = error.config?.url || ''
    const isLoginRequest = requestUrl.includes('/api/auth/login')

    if (isUnauthorized && !isLoginRequest) {
      clearAuthSession()

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        window.location.href = `/login?redirect=${redirect}`
      }
    }

    return Promise.reject(error)
  },
)

// Auth
export const loginAdmin = (data) => api.post('/api/auth/login', data)
export const logoutAdmin = () => api.post('/api/auth/logout')
export const getAuthMe = () => api.get('/api/auth/me')

// Stats
export const getStats = () => api.get('/api/stats')

// Users
export const getUsers = (params) => api.get('/api/users', { params })
export const searchUsers = (q) => api.get('/api/users/search', { params: { q } })
export const getUser = (userId) => api.get(`/api/users/${userId}`)

// Posts
export const getPosts = (params) => api.get('/api/posts', { params })
export const getPost = (postId) => api.get(`/api/posts/${postId}`)
export const updatePost = (postId, data) => api.put(`/api/posts/${postId}`, data)
export const deletePost = (postId) => api.delete(`/api/posts/${postId}`)

// Ratings
export const getRatings = (params) => api.get('/api/ratings', { params })
export const getUserRatings = (userId) => api.get(`/api/ratings/user/${userId}`)

// Drivers
export const getDrivers = (params) => api.get('/api/drivers', { params })
export const getDriver = (userId) => api.get(`/api/drivers/${userId}`)
export const createDriver = (data) => api.post('/api/drivers', data)
export const updateDriver = (userId, data) => api.put(`/api/drivers/${userId}`, data)
export const deleteDriver = (userId) => api.delete(`/api/drivers/${userId}`)

export default api
