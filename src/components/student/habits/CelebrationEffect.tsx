'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface CelebrationEffectProps {
    show: boolean
    onComplete?: () => void
    type?: 'success' | 'achievement' | 'streak'
    message?: string
}

export function CelebrationEffect({
    show,
    onComplete,
    type = 'success',
    message
}: CelebrationEffectProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!show) return

        setVisible(true)
        triggerConfetti(type)

        const timer = setTimeout(() => {
            setVisible(false)
            onComplete?.()
        }, 3000)

        return () => clearTimeout(timer)
    }, [show, type, onComplete])

    const triggerConfetti = (effectType: string) => {
        const count = effectType === 'achievement' ? 200 : 100
        const spread = effectType === 'streak' ? 60 : 70

        // Burst from center
        confetti({
            particleCount: count,
            spread,
            origin: { y: 0.6 },
            colors: effectType === 'achievement'
                ? ['#FFD700', '#FFA500', '#FF6B6B']
                : ['#8b5cf6', '#6366f1', '#a78bfa'],
        })

        // Side cannons for achievements
        if (effectType === 'achievement') {
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FFD700', '#FFA500'],
                })
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FFD700', '#FFA500'],
                })
            }, 250)
        }
    }

    const getEmoji = () => {
        switch (type) {
            case 'achievement':
                return '🏆'
            case 'streak':
                return '🔥'
            default:
                return '✨'
        }
    }

    const getMessage = () => {
        if (message) return message

        switch (type) {
            case 'achievement':
                return 'Achievement Unlocked!'
            case 'streak':
                return 'Streak Milestone!'
            default:
                return 'Great job!'
        }
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                    <motion.div
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        exit={{ y: -50 }}
                        className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-purple-200 max-w-md mx-4"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatDelay: 1,
                            }}
                            className="text-8xl text-center mb-4"
                        >
                            {getEmoji()}
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2"
                        >
                            {getMessage()}
                        </motion.h2>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
