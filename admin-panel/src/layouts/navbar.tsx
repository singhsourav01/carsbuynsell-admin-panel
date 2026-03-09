import { Bell, Search, Menu, Command } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'

export function Navbar() {
    const { user } = useAuthStore()
    const { toggleSidebar } = useUIStore()

    const initials = user?.fullName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'AD'

    return (
        <header className="h-[68px] bg-white/80 backdrop-blur-xl border-b border-card-border/80 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-xl hover:bg-surface transition-colors"
                >
                    <Menu className="w-5 h-5 text-text-secondary" />
                </button>

                {/* Search Bar */}
                <div className="relative hidden sm:block group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="pl-10 pr-20 py-2.5 bg-surface border border-transparent rounded-xl text-sm w-80 focus:bg-white focus:border-primary/20 transition-all placeholder:text-text-muted/70 font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-card-border/50 rounded-md">
                        <Command className="w-3 h-3 text-text-muted" />
                        <span className="text-[10px] text-text-muted font-semibold">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl hover:bg-surface transition-all group">
                    <Bell className="w-[18px] h-[18px] text-text-secondary group-hover:text-text-primary transition-colors" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-white" />
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-card-border" />

                {/* User */}
                <button className="flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-xl hover:bg-surface transition-all">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-hero-light flex items-center justify-center shadow-md shadow-primary/15">
                        <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold text-text-primary leading-tight">{user?.fullName || 'Admin'}</p>
                        <p className="text-[11px] text-text-muted capitalize font-medium">{user?.role || 'admin'}</p>
                    </div>
                </button>
            </div>
        </header>
    )
}
