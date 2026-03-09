import { Users, Car, Zap, IndianRupee, ClipboardList, Handshake, TrendingUp, ShoppingCart, ArrowUpRight, CalendarDays } from 'lucide-react'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const revenueData = [
    { month: 'Jan', revenue: 1200000 }, { month: 'Feb', revenue: 1800000 },
    { month: 'Mar', revenue: 2400000 }, { month: 'Apr', revenue: 1900000 },
    { month: 'May', revenue: 3100000 }, { month: 'Jun', revenue: 2700000 },
]

const listingsByType = [
    { name: 'Auction', value: 45 }, { name: 'Buy Now', value: 55 },
]
const PIE_COLORS = ['#EF4444', '#10B981']

const dealsByStatus = [
    { status: 'Won', count: 28 }, { status: 'Pending', count: 12 },
    { status: 'Done', count: 45 }, { status: 'Lost', count: 8 },
]

const recentActivity = [
    { id: '1', user: 'Rahul Sharma', action: 'submitted a sell request', vehicle: 'Honda City ZX 2022', time: '2026-03-05T15:30:00Z', status: 'PENDING_ADMIN_REVIEW' },
    { id: '2', user: 'Priya Patel', action: 'registered an account', vehicle: '', time: '2026-03-05T14:15:00Z', status: 'PENDING_APPROVAL' },
    { id: '3', user: 'Amit Kumar', action: 'won auction for', vehicle: 'Toyota Fortuner 2021', time: '2026-03-05T12:00:00Z', status: 'WON' },
    { id: '4', user: 'Sneha Reddy', action: 'placed a bid on', vehicle: 'BMW 3 Series 2020', time: '2026-03-05T11:30:00Z', status: 'ACTIVE' },
    { id: '5', user: 'Vikram Singh', action: 'completed payment for', vehicle: 'Hyundai Creta 2023', time: '2026-03-05T10:00:00Z', status: 'COMPLETED' },
]

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
]

export default function DashboardPage() {
    return (
        <div className="space-y-7">
            {/* Page Header */}
            <div className="flex items-end justify-between animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <h1 className="text-[26px] font-extrabold text-text-primary tracking-tight">Dashboard</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Here's what's happening with your platform today.</p>
                </div>
                <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-card-border rounded-xl text-sm font-semibold text-text-secondary hover:text-primary hover:border-primary/30 transition-all premium-card">
                    <TrendingUp className="w-4 h-4" />
                    View Reports
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users" value="1,234" icon={Users} trend={{ value: '+12% this month', positive: true }} className="animate-fade-in-up stagger-1" />
                <StatCard title="Active Listings" value="456" icon={Car} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: '+8%', positive: true }} className="animate-fade-in-up stagger-2" />
                <StatCard title="Live Auctions" value="12" icon={Zap} iconColor="text-red-500" iconBg="bg-red-50" subtitle="3 ending today" className="animate-fade-in-up stagger-3" />
                <StatCard title="Monthly Revenue" value={formatCurrency(3100000)} icon={IndianRupee} iconColor="text-amber-600" iconBg="bg-amber-50" trend={{ value: '+23%', positive: true }} className="animate-fade-in-up stagger-4" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Pending Approvals" value="18" icon={ClipboardList} iconColor="text-amber-600" iconBg="bg-amber-50" className="animate-fade-in-up stagger-5" />
                <StatCard title="Deals This Week" value="34" icon={Handshake} iconColor="text-blue-600" iconBg="bg-blue-50" className="animate-fade-in-up stagger-6" />
                <StatCard title="Sell Requests" value="7" icon={ShoppingCart} iconColor="text-violet-600" iconBg="bg-violet-50" subtitle="pending review" className="animate-fade-in-up stagger-7" />
                <StatCard title="Conversion Rate" value="68%" icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: '+5%', positive: true }} className="animate-fade-in-up stagger-8" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-card-border p-6 premium-card animate-fade-in-up stagger-3">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">Revenue Trend</h3>
                            <p className="text-xs text-text-muted mt-0.5">Monthly revenue performance</p>
                        </div>
                        <span className="px-3 py-1 bg-success-light text-emerald-700 text-[11px] font-bold rounded-full">↑ 23% vs last quarter</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={revenueData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3D5BD9" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3D5BD9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} tickFormatter={(v) => `₹${v / 100000}L`} axisLine={false} tickLine={false} />
                            <Tooltip
                                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                                contentStyle={{ borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, fontWeight: 600 }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#3D5BD9" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: '#fff', stroke: '#3D5BD9', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#3D5BD9', strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie */}
                <div className="bg-white rounded-2xl border border-card-border p-6 premium-card animate-fade-in-up stagger-4">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-text-primary">Listings by Type</h3>
                        <p className="text-xs text-text-muted mt-0.5">Auction vs Buy Now distribution</p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={listingsByType} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                dataKey="value" strokeWidth={0}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {listingsByType.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13, fontWeight: 600 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-5 mt-3">
                        {listingsByType.map((item, i) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                {item.name} ({item.value})
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Bar Chart */}
                <div className="bg-white rounded-2xl border border-card-border p-6 premium-card animate-fade-in-up stagger-5">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-text-primary">Deals by Status</h3>
                        <p className="text-xs text-text-muted mt-0.5">Current deal distribution</p>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={dealsByStatus} barCategoryGap="22%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13, fontWeight: 600 }} />
                            <Bar dataKey="count" fill="#3D5BD9" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-card-border p-6 premium-card animate-fade-in-up stagger-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">Recent Activity</h3>
                            <p className="text-xs text-text-muted mt-0.5">Latest platform events</p>
                        </div>
                        <button className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">View all →</button>
                    </div>
                    <div className="space-y-2.5">
                        {recentActivity.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-surface/60 hover:bg-surface transition-colors group">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    <span className="text-white text-[11px] font-bold">{item.user.split(' ').map(n => n[0]).join('')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-text-primary truncate">
                                        <span className="font-bold">{item.user}</span>{' '}
                                        <span className="text-text-secondary font-medium">{item.action}</span>{' '}
                                        {item.vehicle && <span className="font-bold">{item.vehicle}</span>}
                                    </p>
                                    <p className="text-[11px] text-text-muted font-medium">{formatRelativeTime(item.time)}</p>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
