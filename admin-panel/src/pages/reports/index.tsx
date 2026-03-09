import { formatCurrency } from '@/utils/formatters'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { Download } from 'lucide-react'

const userGrowth = [
    { month: 'Oct', users: 320 }, { month: 'Nov', users: 480 },
    { month: 'Dec', users: 620 }, { month: 'Jan', users: 780 },
    { month: 'Feb', users: 950 }, { month: 'Mar', users: 1234 },
]

const listingsData = [
    { month: 'Oct', created: 40, sold: 28 }, { month: 'Nov', created: 55, sold: 35 },
    { month: 'Dec', created: 62, sold: 48 }, { month: 'Jan', created: 48, sold: 38 },
    { month: 'Feb', created: 72, sold: 55 }, { month: 'Mar', created: 80, sold: 60 },
]

const categoryData = [
    { name: 'Sedan', value: 45 }, { name: 'SUV', value: 32 },
    { name: 'Hatchback', value: 28 }, { name: 'Luxury', value: 15 },
    { name: 'Sports', value: 8 }, { name: 'Electric', value: 12 },
]
const CAT_COLORS = ['#3D5BD9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

const auctionPerformance = [
    { month: 'Oct', auctions: 12, avgBids: 6 }, { month: 'Nov', auctions: 18, avgBids: 8 },
    { month: 'Dec', auctions: 22, avgBids: 10 }, { month: 'Jan', auctions: 15, avgBids: 7 },
    { month: 'Feb', auctions: 25, avgBids: 12 }, { month: 'Mar', auctions: 30, avgBids: 14 },
]

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Platform performance insights</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* User Growth */}
                <div className="bg-card rounded-2xl border border-card-border p-5">
                    <h3 className="text-base font-bold text-text-primary mb-4">User Growth</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF4" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                            <Area type="monotone" dataKey="users" stroke="#3D5BD9" fill="#3D5BD9" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Listings Created vs Sold */}
                <div className="bg-card rounded-2xl border border-card-border p-5">
                    <h3 className="text-base font-bold text-text-primary mb-4">Listings: Created vs Sold</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={listingsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF4" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                            <Bar dataKey="created" fill="#3D5BD9" radius={[4, 4, 0, 0]} name="Created" />
                            <Bar dataKey="sold" fill="#10B981" radius={[4, 4, 0, 0]} name="Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Categories */}
                <div className="bg-card rounded-2xl border border-card-border p-5">
                    <h3 className="text-base font-bold text-text-primary mb-4">Top Categories</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Auction Performance */}
                <div className="bg-card rounded-2xl border border-card-border p-5">
                    <h3 className="text-base font-bold text-text-primary mb-4">Auction Performance</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={auctionPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF4" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                            <Line type="monotone" dataKey="auctions" stroke="#3D5BD9" strokeWidth={2} name="Auctions" />
                            <Line type="monotone" dataKey="avgBids" stroke="#F59E0B" strokeWidth={2} name="Avg Bids" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
