import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { token, isLoading } = useAuthStore()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!token) return <Navigate to="/login" replace />
    return <>{children}</>
}
