import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    iconColor?: string
    iconBg?: string
    trend?: { value: string; positive: boolean }
    className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary-50', trend, className }: StatCardProps) {
    return (
        <div className={cn('bg-white rounded-2xl border border-card-border p-5 premium-card', className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                    <p className="text-text-muted text-[13px] font-medium">{title}</p>
                    <p className="text-[28px] font-extrabold text-text-primary leading-none tracking-tight">{value}</p>
                    {subtitle && <p className="text-[12px] text-text-muted font-medium">{subtitle}</p>}
                    {trend && (
                        <div className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                            trend.positive ? 'bg-success-light text-emerald-700' : 'bg-danger-light text-red-700'
                        )}>
                            <span>{trend.positive ? '↑' : '↓'}</span>
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', iconBg)}>
                    <Icon className={cn('w-[22px] h-[22px]', iconColor)} />
                </div>
            </div>
        </div>
    )
}
