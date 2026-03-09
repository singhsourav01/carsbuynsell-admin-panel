import { useState } from 'react'
import { Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatDate } from '@/utils/formatters'

const MOCK_LISTINGS = [
    { id: '1', title: 'Honda City ZX 2022', type: 'BUY_NOW', category: 'Sedan', price: 1250000, bidCount: 0, viewCount: 45, status: 'ACTIVE', seller: 'Rahul Sharma', createdAt: '2026-02-15T10:00:00Z' },
    { id: '2', title: 'Toyota Fortuner 2021 AT', type: 'AUCTION', category: 'SUV', price: 3200000, bidCount: 8, viewCount: 120, status: 'ACTIVE', seller: 'Priya Patel', createdAt: '2026-02-20T10:00:00Z' },
    { id: '3', title: 'Hyundai i20 Sportz 2023', type: 'BUY_NOW', category: 'Hatchback', price: 850000, bidCount: 0, viewCount: 30, status: 'ACTIVE', seller: 'Amit Kumar', createdAt: '2026-03-01T10:00:00Z' },
    { id: '4', title: 'Mercedes-Benz C-Class 2020', type: 'AUCTION', category: 'Luxury', price: 4500000, bidCount: 15, viewCount: 200, status: 'ACTIVE', seller: 'Sneha Reddy', createdAt: '2026-02-10T10:00:00Z' },
    { id: '5', title: 'Tesla Model 3 2024', type: 'BUY_NOW', category: 'Electric', price: 5200000, bidCount: 0, viewCount: 89, status: 'ACTIVE', seller: 'Karthik Nair', createdAt: '2026-03-03T10:00:00Z' },
    { id: '6', title: 'Maruti Swift VXI 2023', type: 'BUY_NOW', category: 'Hatchback', price: 720000, bidCount: 0, viewCount: 55, status: 'ACTIVE', seller: 'Deepa Menon', createdAt: '2026-02-25T10:00:00Z' },
]

const TYPE_TABS = [
    { value: 'All', label: 'All Types' },
    { value: 'AUCTION', label: '⚡ Auction' },
    { value: 'BUY_NOW', label: '🛒 Buy Now' },
]

export default function ListingsPage() {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('All')

    const filtered = MOCK_LISTINGS.filter((l) => {
        const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.seller.toLowerCase().includes(search.toLowerCase())
        const matchType = typeFilter === 'All' || l.type === typeFilter
        return matchSearch && matchType
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-fade-in-up">
                <div>
                    <h1 className="text-[26px] font-extrabold text-text-primary tracking-tight">Listing Management</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Manage all vehicle listings on the platform</p>
                </div>
                <button className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Add Listing</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up stagger-1">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings or sellers..."
                        className="w-full h-11 pl-11 pr-4 bg-white border border-card-border rounded-xl text-sm font-medium placeholder:text-text-muted/60 hover:border-primary/30 transition-all" />
                </div>
                <div className="flex gap-1.5 bg-white border border-card-border rounded-xl p-1">
                    {TYPE_TABS.map((tab) => (
                        <button key={tab.value} onClick={() => setTypeFilter(tab.value)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === tab.value ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-secondary hover:bg-surface'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-card-border overflow-hidden shadow-sm animate-fade-in-up stagger-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface/70">
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Vehicle</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Type</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Category</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Price</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Bids</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Views</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Seller</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Listed</th>
                                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((listing) => (
                                <tr key={listing.id} className="border-t border-card-border/60 hover:bg-primary-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-10 rounded-xl bg-gradient-to-br from-surface to-card-border flex items-center justify-center flex-shrink-0">
                                                <span className="text-[9px] font-bold text-text-muted">PHOTO</span>
                                            </div>
                                            <span className="font-bold text-text-primary text-[13px]">{listing.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge status={listing.type} size="md" /></td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 bg-surface text-text-secondary text-[11px] font-bold rounded-lg">{listing.category}</span>
                                    </td>
                                    <td className="px-5 py-4 font-extrabold text-text-primary">{formatCurrency(listing.price)}</td>
                                    <td className="px-5 py-4 text-text-secondary font-medium">{listing.bidCount || '—'}</td>
                                    <td className="px-5 py-4 text-text-secondary font-medium">{listing.viewCount}</td>
                                    <td className="px-5 py-4 text-text-secondary font-medium text-[13px]">{listing.seller}</td>
                                    <td className="px-5 py-4 text-text-secondary font-medium text-[13px]">{formatDate(listing.createdAt)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-2 rounded-xl hover:bg-primary-50 text-primary transition-all"><Eye className="w-4 h-4" /></button>
                                            <button className="p-2 rounded-xl hover:bg-surface text-text-muted hover:text-text-secondary transition-all"><Edit className="w-4 h-4" /></button>
                                            <button className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-surface/40 border-t border-card-border/60">
                    <p className="text-xs text-text-muted font-medium">Showing <span className="font-bold text-text-secondary">{filtered.length}</span> of {MOCK_LISTINGS.length} listings</p>
                    <div className="flex gap-1">
                        <button className="p-2 rounded-lg hover:bg-white border border-card-border"><ChevronLeft className="w-3.5 h-3.5 text-text-muted" /></button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">1</button>
                        <button className="p-2 rounded-lg hover:bg-white border border-card-border"><ChevronRight className="w-3.5 h-3.5 text-text-muted" /></button>
                    </div>
                </div>
            </div>
        </div>
    )
}
