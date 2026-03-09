import { createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '@/layouts/admin-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { ProtectedRoute } from './protected-route'
import { RoleRoute } from './role-route'

import LoginPage from '@/pages/auth/login'
import DashboardPage from '@/pages/dashboard/index'
import UsersPage from '@/pages/users/index'
import ListingsPage from '@/pages/listings/index'
import AuctionsPage from '@/pages/auctions/index'
import SellRequestsPage from '@/pages/sell-requests/index'
import DealsPage from '@/pages/deals/index'
import CategoriesPage from '@/pages/categories/index'
import SubscriptionsPage from '@/pages/subscriptions/index'
import ReportsPage from '@/pages/reports/index'
import SettingsPage from '@/pages/settings/index'

export const router = createBrowserRouter([
    // Auth routes
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
        ],
    },
    // Protected admin routes
    {
        element: (
            <ProtectedRoute>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: '/', element: <DashboardPage /> },
            { path: '/users', element: <RoleRoute roles={['admin']}><UsersPage /></RoleRoute> },
            { path: '/listings', element: <ListingsPage /> },
            { path: '/auctions', element: <AuctionsPage /> },
            { path: '/sell-requests', element: <SellRequestsPage /> },
            { path: '/deals', element: <RoleRoute roles={['admin']}><DealsPage /></RoleRoute> },
            { path: '/categories', element: <RoleRoute roles={['admin']}><CategoriesPage /></RoleRoute> },
            { path: '/subscriptions', element: <RoleRoute roles={['admin']}><SubscriptionsPage /></RoleRoute> },
            { path: '/reports', element: <RoleRoute roles={['admin']}><ReportsPage /></RoleRoute> },
            { path: '/settings', element: <RoleRoute roles={['admin']}><SettingsPage /></RoleRoute> },
        ],
    },
])
