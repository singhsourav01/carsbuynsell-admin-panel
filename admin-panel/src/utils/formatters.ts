import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function formatCurrency(amount: number): string {
    const value = Math.round(Number(amount) || 0)
    return `₹${value.toLocaleString('en-IN')}`
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
