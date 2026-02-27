import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || '').trim() || '/'

const api = axios.create({
  baseURL,
  timeout: 10000,
})

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
