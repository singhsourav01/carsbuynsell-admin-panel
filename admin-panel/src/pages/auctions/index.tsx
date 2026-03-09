import { useState } from 'react'
import { Search, Clock, Eye, Timer, StopCircle, Gavel } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

const MOCK_AUCTIONS = [
    { id: '1', title: 'Toyota Fortuner 2021 AT', currentBid: 3450000, startPrice: 3200000, bidCount: 8, endTime: '2026-03-06T18:00:00Z', seller: 'Priya Patel', category: 'SUV' },
    { id: '2', title: 'Mercedes-Benz C-Class 2020', currentBid: 4800000, startPrice: 4500000, bidCount: 15, endTime: '2026-03-05T23:59:00Z', seller: 'Sneha Reddy', category: 'Luxury' },
    { id: '3', title: 'BMW X5 2022 xDrive', currentBid: 6200000, startPrice: 5800000, bidCount: 22, endTime: '2026-03-07T12:00:00Z', seller: 'Vikram Singh', category: 'Luxury' },
    { id: '4', title: 'Audi Q7 2021 Technology', currentBid: 5500000, startPrice: 5000000, bidCount: 11, endTime: '2026-03-06T20:00:00Z', seller: 'Anjali Gupta', category: 'SUV' },
]

export default function AuctionsPage() {
    const [search, setSearch] = useState('')
    const filtered = MOCK_AUCTIONS.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-fade-in-up">
                <div>
                    <h1 className="text-[26px] font-extrabold text-text-primary tracking-tight">Live Auctions</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Monitor and manage active auctions in real-time</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" />
                    <span className="text-xs font-bold text-red-600">{MOCK_AUCTIONS.length} Live</span>
                </div>
            </div>

            <div className="relative max-w-md animate-fade-in-up stagger-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search auctions..."
                    className="w-full h-11 pl-11 pr-4 bg-white border border-card-border rounded-xl text-sm font-medium placeholder:text-text-muted/60 hover:border-primary/30 transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map((auction, idx) => {
                    const endDate = new Date(auction.endTime)
                    const now = new Date()
                    const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000))
                    const minsLeft = Math.max(0, Math.floor(((endDate.getTime() - now.getTime()) % 3600000) / 60000))
                    const isEndingSoon = hoursLeft < 6

                    return (
                        <div key={auction.id} className={`bg-white rounded-2xl border border-card-border p-6 premium-card animate-fade-in-up stagger-${idx + 2}`}>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="px-2 py-0.5 bg-surface text-text-muted text-[10px] font-bold rounded-md">{auction.category}</span>
                                    </div>
                                    <h3 className="font-bold text-text-primary text-[15px] leading-snug">{auction.title}</h3>
                                    <p className="text-xs text-text-muted font-medium mt-1">by {auction.seller}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ${isEndingSoon ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse-dot ${isEndingSoon ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    LIVE
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-3.5 text-center border border-primary-100/50">
                                    <p className="text-[10px] text-primary/60 font-bold uppercase tracking-wider">Current Bid</p>
                                    <p className="text-lg font-extrabold text-primary mt-1">{formatCurrency(auction.currentBid)}</p>
                                </div>
                                <div className="bg-surface rounded-xl p-3.5 text-center border border-card-border/50">
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Bids</p>
                                    <p className="text-lg font-extrabold text-text-primary mt-1">{auction.bidCount}</p>
                                </div>
                                <div className={`rounded-xl p-3.5 text-center border ${isEndingSoon ? 'bg-red-50 border-red-100' : 'bg-surface border-card-border/50'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isEndingSoon ? 'text-red-400' : 'text-text-muted'}`}>Time Left</p>
                                    <p className={`text-lg font-extrabold mt-1 ${isEndingSoon ? 'text-red-600' : 'text-text-primary'}`}>
                                        {hoursLeft}h {minsLeft}m
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-card-border/60">
                                <p className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                                    <Gavel className="w-3 h-3" />
                                    Start: {formatCurrency(auction.startPrice)}
                                </p>
                                <div className="flex gap-1.5">
                                    <button className="p-2.5 rounded-xl bg-primary-50 text-primary hover:bg-primary hover:text-white transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                                    <button className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all" title="Extend"><Timer className="w-4 h-4" /></button>
                                    <button className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="End"><StopCircle className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
