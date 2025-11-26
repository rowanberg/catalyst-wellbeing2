'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

interface OTPInputProps {
    length?: number
    onComplete: (otp: string) => void
    loading?: boolean
    error?: string
}

export function OTPInput({ length = 6, onComplete, loading = false, error }: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
    const [activeIndex, setActiveIndex] = useState(0)

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value

        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < length - 1) {
            setActiveIndex(index + 1)
            const nextInput = document.getElementById(`otp-${index + 1}`)
            nextInput?.focus()
        }

        // Call onComplete when all digits are filled
        if (newOtp.every((digit) => digit !== '')) {
            onComplete(newOtp.join(''))
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault()
            const newOtp = [...otp]

            if (otp[index]) {
                // Clear current digit
                newOtp[index] = ''
                setOtp(newOtp)
            } else if (index > 0) {
                // Move to previous input and clear it
                newOtp[index - 1] = ''
                setOtp(newOtp)
                setActiveIndex(index - 1)
                const prevInput = document.getElementById(`otp-${index - 1}`)
                prevInput?.focus()
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            setActiveIndex(index - 1)
            const prevInput = document.getElementById(`otp-${index - 1}`)
            prevInput?.focus()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            setActiveIndex(index + 1)
            const nextInput = document.getElementById(`otp-${index + 1}`)
            nextInput?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text/plain').slice(0, length)

        if (!/^\d+$/.test(pastedData)) return

        const newOtp = [...otp]
        pastedData.split('').forEach((digit, index) => {
            if (index < length) {
                newOtp[index] = digit
            }
        })

        setOtp(newOtp)

        // Focus last filled input or first empty one
        const lastFilledIndex = Math.min(pastedData.length - 1, length - 1)
        setActiveIndex(lastFilledIndex)
        const input = document.getElementById(`otp-${lastFilledIndex}`)
        input?.focus()

        // Call onComplete if all digits are filled
        if (newOtp.every((digit) => digit !== '')) {
            onComplete(newOtp.join(''))
        }
    }

    const isComplete = otp.every((digit) => digit !== '')

    return (
        <div className="space-y-4">
            <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                    <motion.input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onFocus={() => setActiveIndex(index)}
                        disabled={loading}
                        className={`
							w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 
							transition-all duration-200
							${activeIndex === index ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'}
							${digit ? 'bg-purple-50 border-purple-400' : 'bg-white'}
							${error ? 'border-red-500 bg-red-50' : ''}
							${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400'}
							focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200
						`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                    />
                ))}
            </div>

            {/* Status Indicator */}
            {isComplete && !error && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-green-600"
                >
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Verifying...</span>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-red-600"
                >
                    <X className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                </motion.div>
            )}
        </div>
    )
}
