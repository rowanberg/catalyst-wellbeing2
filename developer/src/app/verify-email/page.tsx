'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Code2,
    Mail,
    CheckCircle,
    RefreshCw,
    ArrowRight
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    const [resending, setResending] = useState(false)
    const [resent, setResent] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleResend = async () => {
        if (!email || countdown > 0) return

        setResending(true)
        try {
            const { error } = await devSupabase.auth.resend({
                type: 'signup',
                email: email
            })

            if (error) throw error

            setResent(true)
            setCountdown(60) // 60 second cooldown
        } catch (err) {
            console.error('Error resending email:', err)
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Code2 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div className="text-left">
                            <h1 className="text-xl font-bold text-white">CatalystWells</h1>
                            <p className="text-xs text-slate-400">Developer Portal</p>
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Mail className="w-10 h-10 text-blue-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
                    <p className="text-slate-400 mb-6">
                        We've sent a verification link to
                        <br />
                        <span className="text-white font-medium">{email || 'your email'}</span>
                    </p>

                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                                <p className="text-sm text-slate-300 font-medium">Next steps:</p>
                                <ol className="mt-2 text-sm text-slate-400 space-y-1.5">
                                    <li>1. Open the email we just sent</li>
                                    <li>2. Click the verification link</li>
                                    <li>3. Start building amazing apps!</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleResend}
                            disabled={resending || countdown > 0}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                        >
                            {resending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : countdown > 0 ? (
                                <span>Resend in {countdown}s</span>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Resend verification email</span>
                                </>
                            )}
                        </button>

                        {resent && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-green-400"
                            >
                                Verification email sent successfully!
                            </motion.p>
                        )}

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <span>Already verified?</span>
                            <span className="text-blue-400 font-medium flex items-center gap-1">
                                Sign in <ArrowRight className="w-3 h-3" />
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-slate-500">
                    Didn't receive an email? Check your spam folder or{' '}
                    <Link href="/support" className="text-blue-400 hover:text-blue-300">
                        contact support
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
