import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/utils/cn'

export function AdminLayout() {
    const { sidebarCollapsed } = useUIStore()

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div
                className={cn(
                    'transition-all duration-300 min-h-screen',
                    sidebarCollapsed ? 'ml-[76px]' : 'ml-[264px]'
                )}
            >
                <Navbar />
                <main className="p-6 lg:p-7">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
