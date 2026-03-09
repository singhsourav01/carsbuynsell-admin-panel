import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

interface RoleRouteProps {
    children: React.ReactNode
    roles: string[]
}

export function RoleRoute({ children, roles }: RoleRouteProps) {
    const { user } = useAuthStore()

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
