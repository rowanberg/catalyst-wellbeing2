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
    ArrowRight,
    Github,
    AlertCircle,
    Zap,
    Shield,
    Users,
    CheckCircle,
    Terminal,
    Sparkles
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

const features = [
    { icon: Zap, text: 'Access 50+ Education APIs', color: 'text-yellow-400' },
    { icon: Shield, text: 'Enterprise-grade Security', color: 'text-green-400' },
    { icon: Users, text: 'Trusted by 1,200+ Developers', color: 'text-blue-400' },
    { icon: Terminal, text: 'Full SDK Support', color: 'text-purple-400' }
]

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data, error: signInError } = await devSupabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError) throw signInError

            if (data.user) {
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign in')
        } finally {
            setLoading(false)
        }
    }

    const handleGithubLogin = async () => {
        try {
            const { error } = await devSupabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) throw error
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with GitHub')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
            {/* Left Panel - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/hero-illustration.png"
                        alt="Developer Portal"
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
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
                    <div className="space-y-8">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl xl:text-5xl font-bold text-white leading-tight"
                            >
                                Build the Future of<br />
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Education Technology
                                </span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mt-4 text-lg text-slate-400 max-w-md"
                            >
                                Access secure APIs for student data, grades, attendance, and wellbeing metrics.
                            </motion.p>
                        </div>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/30"
                                >
                                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                    <span className="text-sm text-slate-300">{feature.text}</span>
                                </div>
                            ))}
                        </motion.div>

                        {/* Code Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 max-w-md"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                <span className="ml-2 text-xs text-slate-500 font-mono">quickstart.js</span>
                            </div>
                            <pre className="text-sm font-mono">
                                <code className="text-slate-400">
                                    <span className="text-purple-400">import</span> {'{'} CatalystWells {'}'} <span className="text-purple-400">from</span> <span className="text-green-400">'@catalystwells/sdk'</span>;{'\n\n'}
                                    <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-blue-400">CatalystWells</span>({'{'}{'\n'}
                                    {'  '}clientId: <span className="text-green-400">'your_client_id'</span>{'\n'}
                                    {'}'});{'\n\n'}
                                    <span className="text-purple-400">const</span> student = <span className="text-purple-400">await</span> client.<span className="text-yellow-400">students</span>.<span className="text-blue-400">get</span>(<span className="text-green-400">'me'</span>);
                                </code>
                            </pre>
                        </motion.div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="flex items-center gap-8 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>SOC 2 Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>FERPA Certified</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>GDPR Ready</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Code2 className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-xl font-bold text-white">CatalystWells</h1>
                                <p className="text-xs text-slate-400">Developer Portal</p>
                            </div>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
                        <p className="text-slate-400">Sign in to continue building amazing apps</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300">{error}</p>
                            </motion.div>
                        )}

                        {/* GitHub Login - Primary */}
                        <button
                            onClick={handleGithubLogin}
                            type="button"
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-600 hover:border-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 mb-6"
                        >
                            <Github className="w-5 h-5" />
                            <span>Continue with GitHub</span>
                        </button>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-slate-800/50 text-slate-500">or sign in with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="you@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-300">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 hover:border-slate-500 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Sign Up Link */}
                    <p className="mt-8 text-center text-slate-400">
                        New to CatalystWells?{' '}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                            Create a developer account
                        </Link>
                    </p>

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
                        <Link href="/docs" className="hover:text-slate-400 transition-colors">Docs</Link>
                        <Link href="/" className="hover:text-slate-400 transition-colors">← Home</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
