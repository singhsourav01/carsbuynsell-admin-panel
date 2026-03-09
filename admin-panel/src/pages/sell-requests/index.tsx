import { useState } from 'react'
import { Search, Check, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatDate } from '@/utils/formatters'

const MOCK_REQUESTS = [
    { id: '1', title: 'Honda City ZX 2022', seller: 'Rahul Sharma', category: 'Sedan', listingType: 'BUY_NOW', basePrice: 1250000, status: 'PENDING_ADMIN_REVIEW', createdAt: '2026-03-04T10:00:00Z' },
    { id: '2', title: 'Maruti Swift VXI 2023', seller: 'Deepa Menon', category: 'Hatchback', listingType: 'BUY_NOW', basePrice: 720000, status: 'PENDING_ADMIN_REVIEW', createdAt: '2026-03-03T14:00:00Z' },
    { id: '3', title: 'Hyundai Creta SX 2024', seller: 'Vikram Singh', category: 'SUV', listingType: 'AUCTION', basePrice: 1800000, status: 'APPROVED', createdAt: '2026-02-28T09:00:00Z' },
    { id: '4', title: 'Tata Nexon EV 2023', seller: 'Anjali Gupta', category: 'Electric', listingType: 'BUY_NOW', basePrice: 1600000, status: 'REJECTED', createdAt: '2026-02-25T16:00:00Z' },
    { id: '5', title: 'BMW 3 Series 2020', seller: 'Karthik Nair', category: 'Luxury', listingType: 'AUCTION', basePrice: 3500000, status: 'PENDING_ADMIN_REVIEW', createdAt: '2026-03-05T08:00:00Z' },
]

const FILTER_TABS = ['All', 'PENDING_ADMIN_REVIEW', 'APPROVED', 'REJECTED']

export default function SellRequestsPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const filtered = MOCK_REQUESTS.filter((r) => {
        const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.seller.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'All' || r.status === statusFilter
        return matchSearch && matchStatus
    })

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Sell Requests</h1>
                <p className="text-text-secondary text-sm mt-0.5">Review and approve vehicle sell requests</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..."
                        className="w-full h-10 pl-10 pr-4 bg-card border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {FILTER_TABS.map((tab) => (
                        <button key={tab} onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === tab ? 'bg-primary text-white' : 'bg-card border border-card-border text-text-secondary hover:bg-surface'}`}>
                            {tab === 'All' ? 'All' : tab === 'PENDING_ADMIN_REVIEW' ? 'Pending' : tab}
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
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Seller</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Category</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Type</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Base Price</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Submitted</th>
                                <th className="px-5 py-3 text-right text-[11px] font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((req) => (
                                <tr key={req.id} className="border-b border-card-border hover:bg-surface/50 transition-colors">
                                    <td className="px-5 py-3.5 font-semibold text-text-primary">{req.title}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{req.seller}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{req.category}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={req.listingType} size="md" /></td>
                                    <td className="px-5 py-3.5 font-bold text-text-primary">{formatCurrency(req.basePrice)}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={req.status} size="md" /></td>
                                    <td className="px-5 py-3.5 text-text-secondary">{formatDate(req.createdAt)}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-1.5 rounded-lg hover:bg-surface text-primary"><Eye className="w-4 h-4" /></button>
                                            {req.status === 'PENDING_ADMIN_REVIEW' && (
                                                <>
                                                    <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-success"><Check className="w-4 h-4" /></button>
                                                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-danger"><X className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3 bg-surface/50">
                    <p className="text-xs text-text-muted">Showing {filtered.length} of {MOCK_REQUESTS.length} requests</p>
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
