'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    Code2,
    Mail,
    Lock,
    User,
    Building2,
    Globe,
    ArrowRight,
    Github,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff,
    Sparkles,
    Zap,
    Shield,
    Rocket,
    BookOpen,
    Terminal,
    Gift
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

const benefits = [
    { icon: Zap, title: 'Free Tier', desc: '10,000 API calls/month' },
    { icon: Shield, title: 'Secure OAuth 2.0', desc: 'Enterprise-grade security' },
    { icon: BookOpen, title: 'Full Documentation', desc: 'Detailed API guides' },
    { icon: Terminal, title: 'SDK Support', desc: 'JavaScript, Python, Flutter' }
]

const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up for free' },
    { num: '02', title: 'Register App', desc: 'Get your API keys' },
    { num: '03', title: 'Start Building', desc: 'Access all APIs' }
]

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        agreeToTerms: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const getPasswordStrength = (password: string) => {
        let strength = 0
        if (password.length >= 8) strength++
        if (password.length >= 12) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[a-z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++
        return strength
    }

    const passwordStrength = getPasswordStrength(formData.password)
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-emerald-500']

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        if (!formData.agreeToTerms) {
            setError('You must agree to the terms of service')
            setLoading(false)
            return
        }

        try {
            const { data, error: signUpError } = await devSupabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        company_name: formData.companyName
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (signUpError) throw signUpError

            if (data.user) {
                router.push('/verify-email?email=' + encodeURIComponent(formData.email))
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    const handleGithubSignup = async () => {
        try {
            const { error } = await devSupabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) throw error
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with GitHub')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/register-illustration.png"
                        alt="Developer Workspace"
                        fill
                        className="object-cover opacity-50"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/60" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Code2 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">CatalystWells</h1>
                            <p className="text-xs text-slate-400">Developer Portal</p>
                        </div>
                    </Link>

                    {/* Main Content */}
                    <div className="space-y-10 max-w-md">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full mb-6"
                            >
                                <Gift className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-300 font-medium">Free to get started</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl xl:text-5xl font-bold text-white leading-tight"
                            >
                                Join 1,200+<br />
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Developers
                                </span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-4 text-lg text-slate-400"
                            >
                                Build powerful education apps with our comprehensive API suite.
                            </motion.p>
                        </div>

                        {/* Steps */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4"
                        >
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center">
                                        <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                            {step.num}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{step.title}</p>
                                        <p className="text-sm text-slate-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Benefits Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            {benefits.map((benefit, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/30"
                                >
                                    <benefit.icon className="w-5 h-5 text-blue-400 mb-2" />
                                    <p className="text-sm font-medium text-white">{benefit.title}</p>
                                    <p className="text-xs text-slate-500">{benefit.desc}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Testimonial */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 max-w-md"
                    >
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-sm text-slate-300 italic mb-3">
                            "CatalystWells APIs made it incredibly easy to build our student engagement app.
                            The documentation is excellent and the team is super responsive."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                AK
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Alex Kumar</p>
                                <p className="text-xs text-slate-500">CTO at EduFlow</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Registration Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-6">
                        <Link href="/" className="inline-flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-lg font-bold text-white">CatalystWells</h1>
                                <p className="text-xs text-slate-400">Developer Portal</p>
                            </div>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create your account</h2>
                        <p className="text-slate-400 text-sm">Start building education apps today</p>
                    </div>

                    {/* Registration Card */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-300">{error}</p>
                            </motion.div>
                        )}

                        {/* GitHub - Primary */}
                        <button
                            onClick={handleGithubSignup}
                            type="button"
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-600 hover:border-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 mb-5"
                        >
                            <Github className="w-5 h-5" />
                            <span>Continue with GitHub</span>
                        </button>

                        {/* Divider */}
                        <div className="relative mb-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-slate-800/50 text-slate-500 text-xs">or register with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Email Address <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="you@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Company (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Company <span className="text-slate-500 font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Your company"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Min 8 characters"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[...Array(6)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-700'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {strengthLabels[passwordStrength] || 'Too Weak'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Confirm Password <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Confirm password"
                                        required
                                    />
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
                                )}
                                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                                    <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Passwords match
                                    </p>
                                )}
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-2.5 pt-1">
                                <input
                                    type="checkbox"
                                    id="agreeToTerms"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                    className="mt-0.5 w-4 h-4 bg-slate-900 border-slate-600 rounded focus:ring-blue-500 text-blue-600"
                                />
                                <label htmlFor="agreeToTerms" className="text-xs text-slate-400 leading-relaxed">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !formData.agreeToTerms}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4" />
                                        <span>Create Account</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Sign In Link */}
                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                            Sign in
                        </Link>
                    </p>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
                        <Link href="/terms" className="hover:text-slate-400">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
                        <Link href="/docs" className="hover:text-slate-400">Docs</Link>
                        <Link href="/" className="hover:text-slate-400">← Home</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
