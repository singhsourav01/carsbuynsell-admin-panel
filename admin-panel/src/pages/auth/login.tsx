import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { authClient } from '@/services/api-client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !password) {
            setError('Please enter email and password')
            return
        }
        setError('')
        setLoading(true)
        try {
            const res = await authClient.post('/auth/signin', {
                user_details: email.trim(),
                password,
            })
            const data = res.data
            const token = data?.access_token || data?.data?.access_token || data?.token
            const refreshToken = data?.refresh_token || data?.data?.refresh_token
            const userData = data?.user || data?.data?.user || data?.data

            if (token) {
                login(token, {
                    id: userData?.id || userData?.user_id || '',
                    fullName: userData?.full_name || userData?.fullName || 'Admin',
                    email: userData?.email || email,
                    phone: userData?.phone || '',
                    role: userData?.role || 'admin',
                }, refreshToken)
                navigate('/', { replace: true })
            } else {
                setError('Invalid response from server')
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up stagger-1">
            {error && (
                <div className="flex items-center gap-3 p-4 bg-danger-light border border-danger/20 rounded-2xl text-sm text-danger font-medium animate-scale-in">
                    <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-base">⚠</span>
                    </div>
                    <span>{error}</span>
                </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary tracking-wide">Email or Mobile</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@autobid.in"
                        className="w-full h-[52px] bg-white border border-card-border rounded-2xl pl-11 pr-4 text-[15px] font-medium text-text-primary placeholder:text-text-muted/60 hover:border-primary/30 transition-all"
                    />
                </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary tracking-wide">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full h-[52px] bg-white border border-card-border rounded-2xl pl-11 pr-12 text-[15px] font-medium text-text-primary placeholder:text-text-muted/60 hover:border-primary/30 transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
                    >
                        {showPass ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                    </button>
                </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded-md border-card-border text-primary accent-primary" />
                    <span className="text-sm text-text-secondary">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors">
                    Forgot password?
                </button>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full h-[52px] text-white font-bold text-sm tracking-wide rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:shadow-none cursor-pointer"
            >
                {loading ? (
                    <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>

            <p className="text-center text-xs text-text-muted pt-2">
                Authorized personnel only. Access is logged and monitored.
            </p>
        </form>
    )
}
