import { useState } from 'react'
import { Search, Check, X, Ban, Eye, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/utils/formatters'

const MOCK_USERS = [
    { id: '1', fullName: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', status: 'ACCEPTED', gender: 'Male', createdAt: '2026-01-15T10:00:00Z' },
    { id: '2', fullName: 'Priya Patel', email: 'priya@example.com', phone: '+91 98765 43211', status: 'PENDING_APPROVAL', gender: 'Female', createdAt: '2026-03-01T10:00:00Z' },
    { id: '3', fullName: 'Amit Kumar', email: 'amit@example.com', phone: '+91 98765 43212', status: 'ACCEPTED', gender: 'Male', createdAt: '2026-02-10T10:00:00Z' },
    { id: '4', fullName: 'Sneha Reddy', email: 'sneha@example.com', phone: '+91 98765 43213', status: 'BLOCKED', gender: 'Female', createdAt: '2025-12-20T10:00:00Z' },
    { id: '5', fullName: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 98765 43214', status: 'REJECTED', gender: 'Male', createdAt: '2026-02-28T10:00:00Z' },
    { id: '6', fullName: 'Anjali Gupta', email: 'anjali@example.com', phone: '+91 98765 43215', status: 'PENDING_PHONE', gender: 'Female', createdAt: '2026-03-04T10:00:00Z' },
    { id: '7', fullName: 'Karthik Nair', email: 'karthik@example.com', phone: '+91 98765 43216', status: 'ACCEPTED', gender: 'Male', createdAt: '2026-01-22T10:00:00Z' },
    { id: '8', fullName: 'Deepa Menon', email: 'deepa@example.com', phone: '+91 98765 43217', status: 'PENDING_EMAIL', gender: 'Female', createdAt: '2026-03-02T10:00:00Z' },
]

const STATUS_TABS = [
    { value: 'All', label: 'All Users' },
    { value: 'PENDING_APPROVAL', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Active' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'BLOCKED', label: 'Blocked' },
]

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600', 'from-sky-500 to-blue-600', 'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600', 'from-indigo-500 to-blue-600',
    'from-cyan-500 to-teal-600', 'from-fuchsia-500 to-purple-600',
]

export default function UsersPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const filtered = MOCK_USERS.filter((u) => {
        const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
        const matchStatus = statusFilter === 'All' || u.status === statusFilter
        return matchSearch && matchStatus
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in-up">
                <div>
                    <h1 className="text-[26px] font-extrabold text-text-primary tracking-tight">User Management</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Manage registered users and approvals</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-primary-50 text-primary text-sm font-bold rounded-full">{MOCK_USERS.length} users</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up stagger-1">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..."
                        className="w-full h-11 pl-11 pr-4 bg-white border border-card-border rounded-xl text-sm font-medium placeholder:text-text-muted/60 hover:border-primary/30 transition-all" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white border border-card-border rounded-xl p-1">
                    {STATUS_TABS.map((tab) => (
                        <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${statusFilter === tab.value ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-secondary hover:bg-surface'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-card-border overflow-hidden shadow-sm animate-fade-in-up stagger-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface/70">
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">User</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Contact</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Joined</th>
                                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user, idx) => (
                                <tr key={user.id} className="border-t border-card-border/60 hover:bg-primary-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <span className="text-white text-[11px] font-bold">{user.fullName.split(' ').map(n => n[0]).join('')}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary text-[13px]">{user.fullName}</p>
                                                <p className="text-[11px] text-text-muted font-medium">{user.gender}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-text-primary text-[13px] font-medium">{user.email}</p>
                                        <p className="text-[11px] text-text-muted font-medium">{user.phone}</p>
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge status={user.status} size="md" /></td>
                                    <td className="px-5 py-4 text-text-secondary text-[13px] font-medium">{formatDate(user.createdAt)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-2 rounded-xl hover:bg-primary-50 text-primary transition-all" title="View">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {user.status === 'PENDING_APPROVAL' && (
                                                <>
                                                    <button className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all" title="Reject">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {user.status === 'ACCEPTED' && (
                                                <button className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all" title="Block">
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-surface/40 border-t border-card-border/60">
                    <p className="text-xs text-text-muted font-medium">Showing <span className="font-bold text-text-secondary">{filtered.length}</span> of {MOCK_USERS.length} users</p>
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
