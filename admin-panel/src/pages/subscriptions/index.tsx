import { CreditCard, Users, Edit } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { StatusBadge } from '@/components/status-badge'

const PLANS = [
    { id: 'BASIC', name: 'Basic', price: 499, listings: 2, features: ['2 listings/month', 'Basic analytics', 'Email support'], color: 'text-info', bg: 'bg-blue-50' },
    { id: 'STANDARD', name: 'Standard', price: 999, listings: 4, features: ['4 listings/month', 'Advanced analytics', 'Priority support', 'Featured listing'], color: 'text-primary', bg: 'bg-primary-light' },
    { id: 'PREMIUM', name: 'Premium', price: 1999, listings: 10, features: ['10 listings/month', 'All analytics', '24/7 support', 'All features', 'Premium badge'], color: 'text-warning', bg: 'bg-amber-50' },
]

const MOCK_SUBS = [
    { id: '1', user: 'Rahul Sharma', plan: 'PREMIUM', status: 'ACTIVE', expiresAt: '2026-04-15', remaining: 7 },
    { id: '2', user: 'Priya Patel', plan: 'BASIC', status: 'ACTIVE', expiresAt: '2026-03-20', remaining: 1 },
    { id: '3', user: 'Amit Kumar', plan: 'STANDARD', status: 'EXPIRED', expiresAt: '2026-02-28', remaining: 0 },
    { id: '4', user: 'Sneha Reddy', plan: 'PREMIUM', status: 'ACTIVE', expiresAt: '2026-05-01', remaining: 9 },
    { id: '5', user: 'Vikram Singh', plan: 'BASIC', status: 'ACTIVE', expiresAt: '2026-03-30', remaining: 2 },
]

export default function SubscriptionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage subscription plans and user subscriptions</p>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                    <div key={plan.id} className="bg-card rounded-2xl border border-card-border p-5 relative hover:shadow-md transition-shadow">
                        <button className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface text-text-muted"><Edit className="w-3.5 h-3.5" /></button>
                        <div className={`w-11 h-11 rounded-xl ${plan.bg} flex items-center justify-center mb-3`}>
                            <CreditCard className={`w-5 h-5 ${plan.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                        <p className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(plan.price)}<span className="text-sm text-text-muted font-normal">/month</span></p>
                        <ul className="mt-3 space-y-1.5">
                            {plan.features.map((f) => (
                                <li key={f} className="text-sm text-text-secondary flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{f}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Active subscriptions */}
            <div className="bg-card rounded-2xl border border-card-border overflow-hidden">
                <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
                    <Users className="w-4 h-4 text-text-muted" />
                    <h3 className="font-bold text-text-primary">User Subscriptions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface border-b border-card-border">
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">User</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Plan</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Remaining</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">Expires</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_SUBS.map((sub) => (
                                <tr key={sub.id} className="border-b border-card-border hover:bg-surface/50">
                                    <td className="px-5 py-3.5 font-semibold text-text-primary">{sub.user}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="px-2 py-0.5 bg-primary-light text-primary text-[10px] font-bold rounded-md">{sub.plan}</span>
                                    </td>
                                    <td className="px-5 py-3.5"><StatusBadge status={sub.status} size="md" /></td>
                                    <td className="px-5 py-3.5 text-text-secondary">{sub.remaining} listings</td>
                                    <td className="px-5 py-3.5 text-text-secondary">{sub.expiresAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
