import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002'
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8000'

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

export const authClient = axios.create({
    baseURL: AUTH_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Response interceptor: handle 401 → refresh or logout
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const refreshToken = useAuthStore.getState().refreshToken
            if (refreshToken) {
                try {
                    const res = await authClient.post('/auth/refresh', { refresh_token: refreshToken })
                    const newToken = res.data.access_token
                    useAuthStore.getState().setToken(newToken)
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return apiClient(originalRequest)
                } catch {
                    // Refresh failed
                }
            }
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)
