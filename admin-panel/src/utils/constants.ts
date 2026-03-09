export const USER_STATUSES = [
    { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'warning' },
    { value: 'ACCEPTED', label: 'Accepted', color: 'success' },
    { value: 'REJECTED', label: 'Rejected', color: 'danger' },
    { value: 'BLOCKED', label: 'Blocked', color: 'danger' },
    { value: 'PENDING_PHONE', label: 'Pending Phone', color: 'info' },
    { value: 'PENDING_EMAIL', label: 'Pending Email', color: 'info' },
] as const

export const LISTING_TYPES = [
    { value: 'AUCTION', label: 'Live Auction' },
    { value: 'BUY_NOW', label: 'Buy Now' },
] as const

export const DEAL_STATUSES = [
    { value: 'WON', label: 'Won', color: 'success' },
    { value: 'PENDING_PAYMENT', label: 'Payment Due', color: 'warning' },
    { value: 'COMPLETED', label: 'Completed', color: 'info' },
    { value: 'LOST', label: 'Lost', color: 'muted' },
] as const

export const CATEGORIES = [
    'Sedan', 'SUV', 'Hatchback', 'Luxury', 'Sports', 'Electric'
] as const

export const SUBSCRIPTION_PLANS = [
    { id: 'BASIC', name: 'Basic', price: 499, listings: 2 },
    { id: 'STANDARD', name: 'Standard', price: 999, listings: 4 },
    { id: 'PREMIUM', name: 'Premium', price: 1999, listings: 10 },
] as const
