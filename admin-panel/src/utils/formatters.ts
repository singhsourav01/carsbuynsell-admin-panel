import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function formatCurrency(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(date: string): string {
    return dayjs(date).format('DD MMM YYYY')
}

export function formatDateTime(date: string): string {
    return dayjs(date).format('DD MMM YYYY, hh:mm A')
}

export function formatRelativeTime(date: string): string {
    return dayjs(date).fromNow()
}
