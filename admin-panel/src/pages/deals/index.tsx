import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw } from 'lucide-react'
import { apiClient } from '@/services/api-client'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

interface BuyRequest {
    br_id: string
    br_listing_id: string
    br_user_id: string
    br_contact_name: string
    br_contact_phone: string
    br_contact_email: string
    br_listing_title?: string
    br_listing_price?: number
    br_created_at: string
}

export default function DealsPage() {
    const [search, setSearch] = useState('')

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['buy-requests'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/buy-requests')
            const rows = res.data?.data?.data ?? res.data?.data ?? []
            return (Array.isArray(rows) ? rows : []) as BuyRequest[]
        },
        refetchInterval: 30000,
    })

    const requests = data ?? []
    const q = search.toLowerCase()
    const filtered = requests.filter((r) =>
        [r.br_listing_title, r.br_contact_name, r.br_contact_phone, r.br_contact_email, r.br_listing_id]
            .some((v) => (v || '').toLowerCase().includes(q)),
    )
    const totalValue = requests.reduce((s, r) => s + (Number(r.br_listing_price) || 0), 0)

    const th = 'px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider'

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Buy Now Requests</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Every Buy Now purchase with the buyer's details</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-text-muted">{requests.length} requests · Total value</p>
                        <p className="text-xl font-bold text-success">{formatCurrency(totalValue)}</p>
                    </div>
                    <button onClick={() => refetch()} className="p-2 rounded-xl bg-card border border-card-border hover:bg-surface" title="Refresh">
                        <RefreshCw className={`w-4 h-4 text-text-secondary ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by vehicle, buyer, phone or email..."
                    className="w-full h-10 pl-10 pr-4 bg-card border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="bg-card rounded-2xl border border-card-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface border-b border-card-border">
                                <th className={th}>Vehicle</th>
                                <th className={th}>Price</th>
                                <th className={th}>Buyer</th>
                                <th className={th}>Phone</th>
                                <th className={th}>Email</th>
                                <th className={th}>Requested At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => (
                                <tr key={r.br_id} className="border-b border-card-border hover:bg-surface/50 transition-colors">
                                    <td className="px-5 py-3.5 font-semibold text-text-primary">
                                        {r.br_listing_title || 'Vehicle'}
                                        <span className="block text-[11px] font-normal text-text-muted">ID: {r.br_listing_id}</span>
                                    </td>
                                    <td className="px-5 py-3.5 font-bold text-text-primary">{r.br_listing_price ? formatCurrency(r.br_listing_price) : '—'}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{r.br_contact_name || '—'}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{r.br_contact_phone || '—'}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{r.br_contact_email || '—'}</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{formatDateTime(r.br_created_at)}</td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-text-muted">
                                        {isLoading ? 'Loading...' : isError ? 'Could not load Buy Now requests.' : 'No Buy Now requests yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-3 bg-surface/50">
                    <p className="text-xs text-text-muted">Showing {filtered.length} of {requests.length} requests</p>
                </div>
            </div>
        </div>
    )
}
