import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatDate } from '@/utils/formatters'

const MOCK_DEALS = [
    { id: '1', vehicle: 'Toyota Fortuner 2021 AT', buyer: 'Amit Kumar', type: 'AUCTION', price: 3450000, status: 'WON', date: '2026-03-05T12:00:00Z' },
    { id: '2', vehicle: 'Honda City ZX 2022', buyer: 'Sneha Reddy', type: 'BUY_NOW', price: 1250000, status: 'COMPLETED', date: '2026-03-04T15:00:00Z' },
    { id: '3', vehicle: 'Hyundai Creta SX 2024', buyer: 'Vikram Singh', type: 'AUCTION', price: 1950000, status: 'PENDING_PAYMENT', date: '2026-03-04T09:00:00Z' },
    { id: '4', vehicle: 'BMW 3 Series 2020', buyer: 'Karthik Nair', type: 'AUCTION', price: 3800000, status: 'LOST', date: '2026-03-03T18:00:00Z' },
    { id: '5', vehicle: 'Maruti Swift VXI 2023', buyer: 'Deepa Menon', type: 'BUY_NOW', price: 720000, status: 'COMPLETED', date: '2026-03-02T11:00:00Z' },
    { id: '6', vehicle: 'Mercedes-Benz C-Class 2020', buyer: 'Priya Patel', type: 'AUCTION', price: 4800000, status: 'WON', date: '2026-03-01T20:00:00Z' },
]

const STATUS_TABS = ['All', 'WON', 'PENDING_PAYMENT', 'COMPLETED', 'LOST']

export default function DealsPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const filtered = MOCK_DEALS.filter((d) => {
        const matchSearch = d.vehicle.toLowerCase().includes(search.toLowerCase()) || d.buyer.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'All' || d.status === statusFilter
        return matchSearch && matchStatus
    })

    const totalRevenue = MOCK_DEALS.filter(d => d.status === 'COMPLETED').reduce((s, d) => s + d.price, 0)

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Deals</h1>
                    <p className="text-text-secondary text-sm mt-0.5">All transactions and deals</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-text-muted">Total Completed Revenue</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deals..."
                        className="w-full h-10 pl-10 pr-4 bg-card border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {STATUS_TABS.map((tab) => (
                        <button key={tab} onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === tab ? 'bg-primary text-white' : 'bg-card border border-card-border text-text-secondary hover:bg-surface'}`}>
                            {tab === 'All' ? 'All' : tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-card-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface border-b border-card-border">
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Vehicle</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Buyer</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Type</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Price</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((deal) => (
                                <tr key={deal.id} className="border-b border-card-border hover:bg-surface/50 transition-colors">
                                    <td className="px-5 py-3.5 font-semibold text-text-primary">{deal.vehicle}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{deal.buyer}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={deal.type} size="md" /></td>
                                    <td className="px-5 py-3.5 font-bold text-text-primary">{formatCurrency(deal.price)}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={deal.status} size="md" /></td>
                                    <td className="px-5 py-3.5 text-text-secondary">{formatDate(deal.date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3 bg-surface/50">
                    <p className="text-xs text-text-muted">Showing {filtered.length} of {MOCK_DEALS.length} deals</p>
                    <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-card border border-card-border"><ChevronLeft className="w-4 h-4 text-text-muted" /></button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">1</button>
                        <button className="p-1.5 rounded-lg hover:bg-card border border-card-border"><ChevronRight className="w-4 h-4 text-text-muted" /></button>
                    </div>
                </div>
            </div>
        </div>
    )
}
