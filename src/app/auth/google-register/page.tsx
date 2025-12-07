'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Loader2 } from 'lucide-react'

// Helper function to decode base64url (browser-compatible)
function base64UrlDecode(str: string): string {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    while (base64.length % 4) {
        base64 += '='
    }
    // Decode using atob (browser API)
    return decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    )
}

export default function GoogleRegisterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    useEffect(() => {
        const data = searchParams.get('data')

        console.log('🔄 [Google Register] Page loaded, data param:', data ? 'present' : 'missing')

        if (!data) {
            console.error('❌ [Google Register] No data parameter')
            setError('No user data provided')
            setStatus('error')
            setTimeout(() => router.push('/login'), 2000)
            return
        }

        try {
            // Decode the base64url encoded Google user data
            const decodedString = base64UrlDecode(data)
            const decodedData = JSON.parse(decodedString)

            console.log('✅ [Google Register] Decoded user data:', {
                email: decodedData.email,
                firstName: decodedData.firstName,
                lastName: decodedData.lastName
            })

            // IMPORTANT: Store in sessionStorage with the key 'google_oauth_data'
            // This matches what the registration page expects at line 166
            sessionStorage.setItem('google_oauth_data', JSON.stringify(decodedData))
            console.log('✅ [Google Register] Stored data in sessionStorage as google_oauth_data')

            setStatus('success')

            // Small delay to show success state before redirect
            setTimeout(() => {
                console.log('🚀 [Google Register] Redirecting to /register')
                router.push('/register')
            }, 500)
        } catch (err) {
            console.error('❌ [Google Register] Failed to parse user data:', err)
            setError('Invalid user data')
            setStatus('error')
            setTimeout(() => router.push('/login'), 2000)
        }
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="text-center space-y-4">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl shadow-cyan-500/30">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                </div>

                {status === 'error' ? (
                    <>
                        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            <span className="text-lg font-medium text-gray-900 dark:text-white">
                                {status === 'success' ? 'Redirecting to registration...' : 'Setting up your account...'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {status === 'success'
                                ? 'Your Google account details have been saved'
                                : 'Preparing your registration with Google account details'
                            }
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
