import { useState } from 'react'
import { Save, Globe, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
    const [appName, setAppName] = useState('CarsbuyNsell')
    const [tagline, setTagline] = useState('Driving Deals, Funding Dreams')
    const [currency, setCurrency] = useState('INR')
    const [notifEmail, setNotifEmail] = useState(true)
    const [notifSms, setNotifSms] = useState(false)
    const [maintenance, setMaintenance] = useState(false)

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage application configuration</p>
            </div>

            {/* General */}
            <div className="bg-card rounded-2xl border border-card-border p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-text-primary">General</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">App Name</label>
                        <input value={appName} onChange={(e) => setAppName(e.target.value)}
                            className="w-full mt-1 h-11 px-4 bg-input-bg border border-input-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Tagline</label>
                        <input value={tagline} onChange={(e) => setTagline(e.target.value)}
                            className="w-full mt-1 h-11 px-4 bg-input-bg border border-input-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Currency</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                            className="w-full mt-1 h-11 px-4 bg-input-bg border border-input-border rounded-xl text-sm focus:outline-none focus:border-primary">
                            <option value="INR">₹ INR - Indian Rupee</option>
                            <option value="USD">$ USD - US Dollar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-card rounded-2xl border border-card-border p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-text-primary">Notifications</h3>
                </div>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">Email Notifications</p>
                        <p className="text-xs text-text-muted">Receive admin alerts via email</p>
                    </div>
                    <button onClick={() => setNotifEmail(!notifEmail)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${notifEmail ? 'bg-primary' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${notifEmail ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-card-border">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">SMS Notifications</p>
                        <p className="text-xs text-text-muted">Receive critical alerts via SMS</p>
                    </div>
                    <button onClick={() => setNotifSms(!notifSms)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${notifSms ? 'bg-primary' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${notifSms ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </div>

            {/* System */}
            <div className="bg-card rounded-2xl border border-card-border p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-text-primary">System</h3>
                </div>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">Maintenance Mode</p>
                        <p className="text-xs text-text-muted">Temporarily disable public access</p>
                    </div>
                    <button onClick={() => setMaintenance(!maintenance)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${maintenance ? 'bg-danger' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${maintenance ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </div>

            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors">
                <Save className="w-4 h-4" /> Save Changes
            </button>
        </div>
    )
}
