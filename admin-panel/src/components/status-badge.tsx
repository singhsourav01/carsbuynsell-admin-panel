import { cn } from '@/utils/cn'

interface StatusBadgeProps {
    status: string
    size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    ACCEPTED: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
    ACTIVE: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
    PENDING_APPROVAL: { label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-amber-600/10' },
    PENDING_PHONE: { label: 'Verify Phone', className: 'bg-sky-50 text-sky-700 ring-sky-600/10' },
    PENDING_EMAIL: { label: 'Verify Email', className: 'bg-sky-50 text-sky-700 ring-sky-600/10' },
    PENDING_ADMIN_REVIEW: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 ring-amber-600/10' },
    PENDING_PAYMENT: { label: 'Payment Due', className: 'bg-amber-50 text-amber-700 ring-amber-600/10' },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 ring-red-600/10' },
    BLOCKED: { label: 'Blocked', className: 'bg-red-50 text-red-700 ring-red-600/10' },
    COMPLETED: { label: 'Completed', className: 'bg-blue-50 text-blue-700 ring-blue-600/10' },
    WON: { label: 'Won', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
    LOST: { label: 'Lost', className: 'bg-slate-50 text-slate-500 ring-slate-500/10' },
    APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
    AUCTION: { label: 'Live Auction', className: 'bg-red-50 text-red-600 ring-red-600/10' },
    BUY_NOW: { label: 'Buy Now', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
    EXPIRED: { label: 'Expired', className: 'bg-slate-50 text-slate-500 ring-slate-500/10' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-50 text-slate-500 ring-slate-500/10' }
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-bold ring-1 ring-inset',
                config.className,
                size === 'sm' ? 'px-2 py-[3px] text-[10px]' : 'px-2.5 py-1 text-[11px]'
            )}
        >
            {config.label}
        </span>
    )
}
