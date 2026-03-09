import { FileX } from 'lucide-react'

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                {icon || <FileX className="w-8 h-8 text-text-muted" />}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
            {description && <p className="text-sm text-text-secondary max-w-sm">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
