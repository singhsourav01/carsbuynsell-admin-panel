import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, Car, Zap, ClipboardList,
    Handshake, FolderOpen, CreditCard, BarChart3,
    Settings, LogOut, ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'moderator'] },
    { path: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    { path: '/listings', icon: Car, label: 'Listings', roles: ['admin', 'moderator'] },
    { path: '/auctions', icon: Zap, label: 'Auctions', roles: ['admin', 'moderator'] },
    { path: '/sell-requests', icon: ClipboardList, label: 'Sell Requests', roles: ['admin', 'moderator'] },
    { path: '/deals', icon: Handshake, label: 'Deals', roles: ['admin'] },
    { path: '/categories', icon: FolderOpen, label: 'Categories', roles: ['admin'] },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions', roles: ['admin'] },
    { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
]

export function Sidebar() {
    const { user, logout } = useAuthStore()
    const { sidebarCollapsed, toggleSidebar } = useUIStore()
    const location = useLocation()

    const filteredItems = NAV_ITEMS.filter(
        (item) => user && item.roles.includes(user.role)
    )

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-screen bg-navy flex flex-col transition-all duration-300 z-50',
                sidebarCollapsed ? 'w-[76px]' : 'w-[264px]'
            )}
        >
            {/* Gradient accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-hero-light to-indigo-400" />

            {/* Logo */}
            <div className={cn('flex items-center gap-3 h-[68px] border-b border-white/[0.06]', sidebarCollapsed ? 'px-4 justify-center' : 'px-5')}>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-hero-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                    <Car className="w-5 h-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-white font-bold text-[17px] leading-tight tracking-tight">CarsbuyNsell</h1>
                        <p className="text-white/30 text-[11px] font-medium leading-tight">Admin Panel by Raj Motors</p>
                    </div>
                )}
            </div>

            {/* Navigation Label */}
            {!sidebarCollapsed && (
                <div className="px-5 pt-5 pb-2">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Navigation</p>
                </div>
            )}

            {/* Nav Items */}
            <nav className={cn('flex-1 overflow-y-auto space-y-0.5', sidebarCollapsed ? 'px-2 pt-4' : 'px-3')}>
                {filteredItems.map((item, idx) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path))

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative',
                                sidebarCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5',
                                isActive
                                    ? 'bg-gradient-to-r from-primary to-hero-light text-white shadow-lg shadow-primary/20'
                                    : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                            )}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200', isActive ? 'text-white' : 'group-hover:scale-110')} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                            {isActive && !sidebarCollapsed && (
                                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" />
                            )}

                            {/* Tooltip for collapsed */}
                            {sidebarCollapsed && (
                                <div className="absolute left-full ml-3 px-3 py-1.5 bg-navy-light text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-white/10">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    )
                })}
            </nav>

            {/* User & Actions */}
            <div className={cn('border-t border-white/[0.06]', sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-3')}>
                {/* User display */}
                {!sidebarCollapsed && user && (
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-white/[0.03] rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-hero-light flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[11px] font-bold">
                                {user.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs font-semibold truncate">{user.fullName}</p>
                            <p className="text-white/30 text-[10px] capitalize">{user.role}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={logout}
                    className={cn(
                        'flex items-center gap-3 rounded-xl text-[13px] font-semibold text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08] w-full transition-all duration-200',
                        sidebarCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5'
                    )}
                    title={sidebarCollapsed ? 'Sign Out' : undefined}
                >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    {!sidebarCollapsed && <span>Sign Out</span>}
                </button>

                <button
                    onClick={toggleSidebar}
                    className={cn(
                        'flex items-center justify-center w-full py-2 mt-1 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all'
                    )}
                >
                    {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </aside>
    )
}
