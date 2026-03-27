import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
    id: string
    fullName: string
    email: string
    phone: string
    role: 'admin' | 'moderator'
}

interface AuthState {
    user: AdminUser | null
    token: string | null
    refreshToken: string | null
    isLoading: boolean
    setToken: (token: string) => void
    login: (token: string, user: AdminUser, refreshToken?: string) => void
    logout: () => void
    setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: true,
            setToken: (token) => set({ token }),
            login: (token, user, refreshToken) =>
                set({ token, user, refreshToken: refreshToken || null, isLoading: false }),
            logout: () =>
                set({ user: null, token: null, refreshToken: null, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'carsbuynsell-admin-auth',
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false)
            },
        }
    )
)
