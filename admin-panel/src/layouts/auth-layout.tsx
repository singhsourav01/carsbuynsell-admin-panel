import { Outlet } from 'react-router-dom'
import { Car, Shield, TrendingUp, Users } from 'lucide-react'

export function AuthLayout() {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel — Brand showcase */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#162240] to-[#0c1629]" />

                {/* Decorative shapes */}
                <div className="absolute top-[-10%] right-[-15%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-hero-light/8 rounded-full blur-3xl" />
                <div className="absolute top-[40%] left-[30%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-2xl animate-float" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-hero-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white text-xl font-bold tracking-tight">CarsbuyNsell</h1>
                            <p className="text-white/40 text-xs font-medium">Admin Panel by Raj Motors</p>
                        </div>
                    </div>

                    {/* Hero text */}
                    <div className="max-w-md">
                        <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                            Manage your<br />
                            <span className="bg-gradient-to-r from-primary-200 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                                automotive platform
                            </span>
                            <br />with confidence.
                        </h2>
                        <p className="text-white/50 mt-4 text-base leading-relaxed">
                            Complete control over your vehicle marketplace — users, listings, auctions, and deals, all in one powerful dashboard.
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-3 mt-8">
                            {[
                                { icon: Users, label: 'User Management' },
                                { icon: TrendingUp, label: 'Live Analytics' },
                                { icon: Shield, label: 'Role-Based Access' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium">
                                    <Icon className="w-3.5 h-3.5 text-primary-200" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4">
                        <p className="text-white/30 text-xs">© 2026 Raj Motors — Driving Deals, Funding Dreams</p>
                    </div>
                </div>
            </div>

            {/* Right Panel — Login form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background relative">
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'radial-gradient(circle, #3D5BD9 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="w-full max-w-[420px] relative z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8 animate-fade-in-up">
                        <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <Car className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">CarsbuyNsell Admin</h1>
                        <p className="text-text-secondary text-sm mt-1">Driving Deals, Funding Dreams — Raj Motors</p>
                    </div>

                    <div className="hidden lg:block mb-8 animate-fade-in-up">
                        <p className="text-text-muted text-sm font-medium">Welcome back</p>
                        <h2 className="text-2xl font-bold text-text-primary mt-1">Sign in to your account</h2>
                    </div>

                    <Outlet />
                </div>
            </div>
        </div>
    )
}
