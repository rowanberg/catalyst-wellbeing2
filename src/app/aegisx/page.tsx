'use client'

/**
 * AegisX - Premium Digital Student ID Card
 * Unique Catalyst Wells Branded Design
 * Optimized for Mobile & Desktop with comprehensive features
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Shield, Smartphone, Wifi,
    CheckCircle2, XCircle, Loader2, QrCode, Copy, Check,
    Fingerprint, School, User, Calendar, Hash, Sparkles,
    Link2, AlertCircle, RefreshCw, Download, Share2,
    Clock, MapPin, Phone, Mail, BookOpen, Award,
    Eye, EyeOff, History, Settings, ChevronRight,
    Scan, CreditCard, Zap, Star, Globe, Lock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/lib/redux/hooks'
import { ThemeLoader } from '@/components/student/ThemeLoader'
import { AccessHistoryModal } from '@/components/aegisx/AccessHistoryModal'

// Types
interface StudentProfile {
    id: string
    first_name: string
    last_name: string
    student_tag?: string
    grade_level?: string
    class_name?: string
    avatar_url?: string
    profile_picture_url?: string
    email?: string
    phone?: string
    date_of_birth?: string
    blood_group?: string
    emergency_contact?: string
    school?: {
        id: string
        name: string
        school_code?: string
        logo_url?: string
        city?: string
        country?: string
        address?: string
    }
}

interface NFCStatus {
    isLinked: boolean
    cardId?: string
    linkedAt?: string
}

// Catalyst Wells Branded Logo Component
const CatalystLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = {
        sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-[8px]' },
        md: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-[10px]' },
        lg: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-xs' }
    }

    return (
        <div className={`${sizes[size].container} relative`}>
            {/* Outer ring with gradient */}
            <div
                className="absolute inset-0 rounded-xl"
                style={{
                    background: 'conic-gradient(from 0deg, var(--theme-primary), var(--theme-secondary), var(--theme-accent), var(--theme-primary))',
                    padding: '2px'
                }}
            >
                <div className="w-full h-full rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center">
                    {/* Inner icon */}
                    <div className="relative">
                        <Sparkles className={`${sizes[size].icon}`} style={{ color: 'var(--theme-primary)' }} />
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                            style={{ background: 'var(--theme-secondary)' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Premium ID Card Component - Front
const DigitalIDCardFront = ({
    profile,
    nfcStatus,
    isFlipped,
    onFlip
}: {
    profile: StudentProfile
    nfcStatus: NFCStatus
    isFlipped: boolean
    onFlip: () => void
}) => {
    const [copied, setCopied] = useState(false)
    const studentTag = profile.student_tag || 'N/A'

    const handleCopyTag = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (studentTag !== 'N/A') {
            navigator.clipboard.writeText(studentTag)
            setCopied(true)
            if ('vibrate' in navigator) navigator.vibrate(10)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const cardValidUntil = new Date()
    cardValidUntil.setFullYear(cardValidUntil.getFullYear() + 1)

    return (
        <motion.div
            className="absolute inset-0 w-full h-full"
            style={{
                backfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <div
                className="relative w-full h-full rounded-3xl overflow-hidden cursor-pointer group"
                onClick={onFlip}
                style={{
                    background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                }}
            >
                {/* Premium Gradient Accent Bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{
                        background: 'linear-gradient(90deg, var(--theme-primary), var(--theme-secondary), var(--theme-accent), var(--theme-primary))',
                        backgroundSize: '200% 100%'
                    }}
                />

                {/* Animated Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Gradient Orb - Top Right */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)',
                            filter: 'blur(40px)'
                        }}
                    />
                    {/* Gradient Orb - Bottom Left */}
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, var(--theme-secondary) 0%, transparent 70%)',
                            filter: 'blur(30px)'
                        }}
                    />
                </div>

                {/* Premium Holographic Shimmer */}
                <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    style={{
                        background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)',
                        backgroundSize: '200% 100%'
                    }}
                />

                {/* Card Content */}
                <div className="relative z-10 h-full p-4 sm:p-5 md:p-6 flex flex-col justify-between">
                    {/* Top Section - Branding */}
                    <div className="flex justify-between items-start">
                        {/* School Branding */}
                        <div className="flex items-center gap-3">
                            {/* School Logo Container */}
                            <div className="relative">
                                <div
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {profile.school?.logo_url ? (
                                        <img
                                            src={profile.school.logo_url}
                                            alt={profile.school.name}
                                            className="w-10 h-10 object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    ) : (
                                        <School className="w-6 h-6 sm:w-7 sm:h-7 text-white/90" />
                                    )}
                                </div>
                                {/* Verified Badge */}
                                <motion.div
                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        border: '2px solid #1a1a2e'
                                    }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Check className="w-3 h-3 text-white" />
                                </motion.div>
                            </div>

                            <div>
                                <h3 className="text-white font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-[200px]">
                                    {profile.school?.name || 'Catalyst Wells'}
                                </h3>
                                <p className="text-white/50 text-[10px] sm:text-xs font-medium tracking-widest uppercase">
                                    Digital Student ID
                                </p>
                            </div>
                        </div>

                        {/* Catalyst Badge */}
                        <motion.div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                                border: '1px solid rgba(255,255,255,0.15)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                            <span className="text-white/90 text-[10px] sm:text-xs font-bold tracking-wider">
                                CATALYST
                            </span>
                        </motion.div>
                    </div>

                    {/* Middle Section - Student Profile */}
                    <div className="flex items-center gap-4 sm:gap-5 py-2">
                        {/* Large Profile Photo */}
                        <div className="relative flex-shrink-0">
                            <div
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden relative"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
                                }}
                            >
                                {(profile.avatar_url || profile.profile_picture_url) ? (
                                    <img
                                        src={profile.avatar_url || profile.profile_picture_url || ''}
                                        alt={`${profile.first_name} ${profile.last_name}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Hide the broken image and show fallback
                                            e.currentTarget.style.display = 'none'
                                            const parent = e.currentTarget.parentElement
                                            if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))"><span class="text-white font-bold text-3xl">${profile.first_name?.charAt(0)?.toUpperCase() || 'S'}</span></div>`
                                            }
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                                    >
                                        <span className="text-white font-bold text-3xl sm:text-4xl">
                                            {profile.first_name?.charAt(0)?.toUpperCase() || 'S'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* NFC Status Indicator */}
                            <motion.div
                                className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${nfcStatus.isLinked
                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                                    : 'bg-white/20'
                                    }`}
                                style={{ border: '3px solid #1a1a2e', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                                animate={nfcStatus.isLinked ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            >
                                <Wifi className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${nfcStatus.isLinked ? 'text-white' : 'text-white/50'}`} />
                            </motion.div>
                        </div>

                        {/* Student Name & Details */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-white font-bold text-xl sm:text-2xl md:text-3xl leading-tight truncate drop-shadow-lg">
                                {profile.first_name} {profile.last_name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {profile.grade_level && (
                                    <span
                                        className="px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                                            color: 'white',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        Grade {profile.grade_level}
                                    </span>
                                )}
                                {profile.class_name && (
                                    <span
                                        className="px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold"
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        {profile.class_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - ID & Validity */}
                    <div className="flex justify-between items-end">
                        {/* Student ID */}
                        <div>
                            <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-1 font-medium">
                                Student ID
                            </p>
                            <div className="flex items-center gap-2">
                                <code
                                    className="text-white font-mono font-bold text-base sm:text-lg tracking-widest"
                                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                                >
                                    {studentTag}
                                </code>
                                <motion.button
                                    onClick={handleCopyTag}
                                    className="p-1.5 rounded-lg transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.1)' }}
                                    whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Copy Student ID"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-white/60" />
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* Validity */}
                        <div className="text-right">
                            <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-1 font-medium">
                                Valid Until
                            </p>
                            <p className="text-white font-bold text-sm sm:text-base">
                                {cardValidUntil.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Premium Chip */}
                        <div
                            className="w-11 h-8 sm:w-12 sm:h-9 rounded-lg flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(145deg, #d4af37 0%, #c9a227 30%, #b8860b 60%, #8b6914 100%)',
                                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div className="w-7 h-5 sm:w-8 sm:h-6 grid grid-cols-4 grid-rows-3 gap-[1px] rounded-sm overflow-hidden">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="bg-amber-900/40" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Corner Accent */}
                <div
                    className="absolute bottom-0 right-0 w-24 h-24 opacity-20"
                    style={{
                        background: 'radial-gradient(circle at bottom right, var(--theme-accent), transparent 70%)'
                    }}
                />
            </div>
        </motion.div>
    )
}

// Premium ID Card Component - Back
const DigitalIDCardBack = ({
    profile,
    isFlipped,
    onFlip
}: {
    profile: StudentProfile
    isFlipped: boolean
    onFlip: () => void
}) => {
    // Generate deterministic QR pattern based on student tag
    const studentTag = profile.student_tag || 'CATALYST'
    const qrPattern = React.useMemo(() => {
        const pattern: boolean[] = []
        for (let i = 0; i < 49; i++) {
            // Use character codes to create deterministic pattern
            const charCode = studentTag.charCodeAt(i % studentTag.length) || 0
            pattern.push((charCode + i) % 3 !== 0)
        }
        // Ensure corner markers (typical QR code style)
        [0, 1, 2, 7, 8, 14, 42, 43, 44, 35, 36, 28, 6, 4, 5, 48, 47, 46].forEach(idx => {
            if (idx < pattern.length) pattern[idx] = true
        })
        return pattern
    }, [studentTag])

    // Generate barcode pattern from student tag
    const barcodePattern = React.useMemo(() => {
        const pattern: number[] = []
        for (let i = 0; i < 30; i++) {
            const charCode = studentTag.charCodeAt(i % studentTag.length) || 65
            pattern.push((charCode % 3) + 1)
        }
        return pattern
    }, [studentTag])

    return (
        <motion.div
            className="absolute inset-0 w-full h-full"
            style={{
                backfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <div
                className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
                onClick={onFlip}
                style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 60%, #020617 100%)' }}
            >
                {/* Subtle Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                {/* Magnetic Strip with Holographic Effect */}
                <div className="absolute top-4 sm:top-5 left-0 right-0 h-9 sm:h-11 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
                    <motion.div
                        className="absolute inset-0 opacity-30"
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            width: '50%'
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full pt-14 sm:pt-18 px-3 sm:px-4 pb-3 sm:pb-4 flex flex-col justify-between">
                    {/* Barcode / QR Section */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Barcode */}
                        <div
                            className="flex-1 h-9 sm:h-11 rounded-lg flex items-center justify-center px-2"
                            style={{ background: 'white' }}
                        >
                            <div className="flex items-end gap-[1px] h-7 sm:h-9">
                                {barcodePattern.map((h, i) => (
                                    <div
                                        key={i}
                                        className="bg-black rounded-[0.5px]"
                                        style={{ width: i % 4 === 0 ? '2.5px' : '1.5px', height: `${h * 9}px` }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg p-1.5 flex-shrink-0"
                            style={{ background: 'white' }}
                        >
                            <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-[0.5px]">
                                {qrPattern.map((filled, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-[0.5px] ${filled ? 'bg-slate-900' : 'bg-white'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5">
                            <p className="text-slate-500 text-[7px] sm:text-[8px] uppercase tracking-wider">School</p>
                            <p className="text-white font-mono text-[9px] sm:text-[10px] mt-0.5 truncate">
                                {profile.school?.school_code || 'CW-2025'}
                            </p>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5">
                            <p className="text-slate-500 text-[7px] sm:text-[8px] uppercase tracking-wider">Blood</p>
                            <p className="text-white font-bold text-[9px] sm:text-[10px] mt-0.5">
                                {profile.blood_group || '—'}
                            </p>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5">
                            <p className="text-slate-500 text-[7px] sm:text-[8px] uppercase tracking-wider">Year</p>
                            <p className="text-white font-mono text-[9px] sm:text-[10px] mt-0.5">
                                2025-26
                            </p>
                        </div>
                    </div>

                    {/* Emergency / Contact */}
                    <div className="mt-1.5 sm:mt-2 p-2 sm:p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-400 text-[7px] sm:text-[8px] uppercase tracking-wider font-bold">
                                Emergency Contact
                            </p>
                        </div>
                        <p className="text-white/90 text-[9px] sm:text-[10px] font-medium">
                            {profile.emergency_contact || 'Contact school administration'}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                            >
                                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            </div>
                            <span className="text-slate-400 text-[8px] sm:text-[9px] font-medium">
                                Catalyst Wells
                            </span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5">
                            <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-500" />
                            <span className="text-slate-500 text-[7px] sm:text-[8px]">Flip</span>
                        </div>
                    </div>
                </div>

                {/* Security Hologram */}
                <motion.div
                    className="absolute bottom-10 right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{
                        background: 'conic-gradient(from 0deg, var(--theme-primary), var(--theme-secondary), var(--theme-accent), var(--theme-primary))'
                    }}
                />
            </div>
        </motion.div>
    )
}


// Main Card Container with 3D Flip
const DigitalIDCard = ({ profile, nfcStatus }: { profile: StudentProfile, nfcStatus: NFCStatus }) => {
    const [isFlipped, setIsFlipped] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -15 }}
            animate={{
                opacity: 1,
                y: 0,
                rotateX: 0,
                scale: isHovered ? 1.015 : 1,
                rotateY: isHovered ? (isFlipped ? -3 : 3) : 0
            }}
            transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
                scale: { duration: 0.25 },
                rotateY: { duration: 0.35 }
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto"
            style={{ perspective: '1500px' }}
        >
            {/* Desktop Card Header */}
            <motion.div
                className="hidden lg:flex items-center justify-between mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                    >
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Digital Student ID</h3>
                        <p className="text-sm text-slate-500">Official identification card</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm font-medium text-emerald-600">Active • Verified</span>
                </div>
            </motion.div>

            {/* Mobile Card Status Indicator */}
            <motion.div
                className="flex lg:hidden items-center justify-center gap-2 mb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                        {isFlipped ? 'Card Back' : 'Card Front'} • Active
                    </span>
                </div>
            </motion.div>

            {/* Card Container */}
            <motion.div
                className="relative w-full"
                style={{
                    aspectRatio: '1.586/1',
                    transformStyle: 'preserve-3d'
                }}
                whileTap={{ scale: 0.98 }}
            >
                <DigitalIDCardFront
                    profile={profile}
                    nfcStatus={nfcStatus}
                    isFlipped={isFlipped}
                    onFlip={() => {
                        setIsFlipped(!isFlipped)
                        if ('vibrate' in navigator) navigator.vibrate(10)
                    }}
                />
                <DigitalIDCardBack
                    profile={profile}
                    isFlipped={isFlipped}
                    onFlip={() => {
                        setIsFlipped(!isFlipped)
                        if ('vibrate' in navigator) navigator.vibrate(10)
                    }}
                />
            </motion.div>

            {/* Enhanced Card Shadow */}
            <motion.div
                className="mx-4 lg:mx-8 h-6 lg:h-8 rounded-full blur-2xl lg:blur-3xl -z-10 mt-3 lg:mt-4"
                style={{
                    background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary), var(--theme-accent))',
                }}
                animate={{
                    opacity: isFlipped ? 0.12 : (isHovered ? 0.5 : 0.3),
                    scaleX: isHovered ? 1.08 : 1
                }}
                transition={{ duration: 0.35 }}
            />

            {/* Flip Controls */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-3 mt-4"
            >
                <motion.button
                    onClick={() => setIsFlipped(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!isFlipped
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Front
                </motion.button>
                <motion.button
                    onClick={() => setIsFlipped(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isFlipped
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Back
                </motion.button>
            </motion.div>

            {/* Flip Hint - Mobile Only */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="lg:hidden text-center text-[10px] sm:text-xs text-slate-400 mt-2"
            >
                Tap card to flip
            </motion.p>
        </motion.div>
    )
}



// NFC Link Section Component - Enhanced
const NFCLinkSection = ({
    nfcStatus,
    onLinkNFC,
    onUnlinkNFC,
    isLinking,
    nfcSupported
}: {
    nfcStatus: NFCStatus
    onLinkNFC: () => void
    onUnlinkNFC: () => void
    isLinking: boolean
    nfcSupported: boolean
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
        >
            <Card className="border-0 shadow-xl rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
                <CardHeader
                    className="pb-3 sm:pb-4"
                    style={{
                        background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-highlight) 40%, transparent), color-mix(in srgb, var(--theme-tertiary) 30%, transparent))'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div
                                className="p-2 sm:p-2.5 rounded-xl shadow-md"
                                style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                            >
                                <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-base sm:text-lg">NFC Card Link</CardTitle>
                                <p className="text-xs sm:text-sm text-slate-500">Tap-to-verify with physical card</p>
                            </div>
                        </div>
                        {nfcStatus.isLinked && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                    {nfcStatus.isLinked ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                <div className="p-2 rounded-full bg-emerald-100">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-emerald-800 text-sm">NFC Card Connected</p>
                                    <p className="text-xs sm:text-sm text-emerald-600 truncate">
                                        ID: {nfcStatus.cardId?.slice(0, 8)}...{nfcStatus.cardId?.slice(-4)}
                                    </p>
                                    {nfcStatus.linkedAt && (
                                        <p className="text-[10px] sm:text-xs text-emerald-500 mt-0.5">
                                            Linked {new Date(nfcStatus.linkedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <Button
                                    variant="outline"
                                    className="h-10 sm:h-11 text-xs sm:text-sm"
                                    onClick={onLinkNFC}
                                    disabled={isLinking}
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLinking ? 'animate-spin' : ''}`} />
                                    Relink
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-10 sm:h-11 text-xs sm:text-sm text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={onUnlinkNFC}
                                >
                                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Unlink
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-200">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-amber-800 text-sm">No NFC Card Linked</p>
                                    <p className="text-xs sm:text-sm text-amber-600 mt-1">
                                        Link your physical ID for tap-to-verify at attendance, library, and gates.
                                    </p>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                    { icon: Fingerprint, label: 'Quick Access' },
                                    { icon: Shield, label: 'Secure' },
                                    { icon: Zap, label: 'Instant' }
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100"
                                    >
                                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-slate-400 mb-1" />
                                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{item.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <Button
                                className="w-full h-11 sm:h-12 text-sm sm:text-base text-white shadow-lg"
                                style={{
                                    background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                                }}
                                onClick={onLinkNFC}
                                disabled={isLinking}
                            >
                                {isLinking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                                        <span>Scanning...</span>
                                    </>
                                ) : (
                                    <>
                                        <Scan className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        <span>Link NFC Card</span>
                                    </>
                                )}
                            </Button>

                            {!nfcSupported && (
                                <p className="text-xs text-center text-slate-400">
                                    NFC not detected. Contact school admin for manual linking.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Quick Actions Section
const QuickActionsSection = ({
    onDownload,
    onShare,
    onViewHistory,
    onSettings
}: {
    onDownload: () => void
    onShare: () => void
    onViewHistory: () => void
    onSettings: () => void
}) => {
    const actions = [
        { icon: Download, label: 'Save', onClick: onDownload, color: 'var(--theme-primary)' },
        { icon: Share2, label: 'Share', onClick: onShare, color: 'var(--theme-secondary)' },
        { icon: History, label: 'History', onClick: onViewHistory, color: 'var(--theme-accent)' },
        { icon: Settings, label: 'Settings', onClick: onSettings, color: 'var(--theme-primary)' }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-4 gap-2 sm:gap-3"
        >
            {actions.map((action, i) => (
                <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    onClick={action.onClick}
                    className="flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-lg border border-slate-100 hover:shadow-xl transition-all active:scale-95"
                >
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: action.color }} />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-600">{action.label}</span>
                </motion.button>
            ))}
        </motion.div>
    )
}

// Info Cards Section - Enhanced with comprehensive details
const InfoCardsSection = ({ profile }: { profile: StudentProfile }) => {
    const currentDate = new Date()
    const enrollmentDate = profile.date_of_birth
        ? new Date(new Date(profile.date_of_birth).setFullYear(new Date(profile.date_of_birth).getFullYear() + 5))
        : new Date(currentDate.getFullYear() - 2, 3, 1) // Default: 2 years ago, April

    const cardValidUntil = new Date(currentDate.getFullYear() + 1, 5, 30) // June 30 next year

    // Calculate days until expiry
    const daysUntilExpiry = Math.ceil((cardValidUntil.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    // Mock usage stats (in real app, fetch from API)
    const totalScans = 247
    const lastUsed = new Date(currentDate.getTime() - 1000 * 60 * 60 * 3) // 3 hours ago

    const mainCards = [
        {
            icon: Calendar,
            label: 'Academic Year',
            value: '2025-2026',
            color: 'var(--theme-primary)',
            gradient: 'from-blue-500 to-indigo-600',
            description: 'Current session'
        },
        {
            icon: Globe,
            label: 'Campus',
            value: profile.school?.city || 'Main Campus',
            color: 'var(--theme-secondary)',
            gradient: 'from-purple-500 to-pink-600',
            description: profile.school?.address?.split(',')[0] || 'Primary location'
        },
        {
            icon: Award,
            label: 'Card Status',
            value: 'Active',
            color: '#10b981',
            gradient: 'from-emerald-500 to-teal-600',
            description: 'Fully operational'
        },
        {
            icon: Lock,
            label: 'Security Level',
            value: 'Verified',
            color: 'var(--theme-accent)',
            gradient: 'from-orange-500 to-red-600',
            description: 'Identity confirmed'
        }
    ]

    const detailCards = [
        {
            icon: User,
            label: 'Enrollment Date',
            value: enrollmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subValue: `${Math.floor((currentDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365))} years enrolled`,
            color: '#3b82f6'
        },
        {
            icon: CreditCard,
            label: 'Card Validity',
            value: cardValidUntil.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subValue: `${daysUntilExpiry} days remaining`,
            color: '#8b5cf6',
            warning: daysUntilExpiry < 60
        },
        {
            icon: Shield,
            label: 'Access Level',
            value: 'Full Access',
            subValue: 'All facilities enabled',
            color: '#10b981'
        },
        {
            icon: Zap,
            label: 'Total Scans',
            value: totalScans.toLocaleString(),
            subValue: 'Lifetime usage',
            color: '#f59e0b'
        },
        {
            icon: Clock,
            label: 'Last Used',
            value: lastUsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            subValue: `${Math.floor((currentDate.getTime() - lastUsed.getTime()) / (1000 * 60 * 60))}h ago`,
            color: '#06b6d4'
        },
        {
            icon: Fingerprint,
            label: 'Card ID Type',
            value: 'NFC + QR',
            subValue: 'Dual authentication',
            color: '#ec4899'
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 sm:space-y-4 lg:space-y-5"
        >
            {/* Main Card Information - Premium Design */}
            <Card className="border-0 shadow-xl rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
                <CardHeader
                    className="pb-3 sm:pb-4 lg:pb-5"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div
                                className="p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl shadow-md"
                                style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                            >
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                                    Card Information
                                </CardTitle>
                                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 mt-0.5">
                                    Comprehensive card details & statistics
                                </p>
                            </div>
                        </div>
                        <Badge className="hidden sm:flex bg-emerald-100 text-emerald-700 border-0 px-2.5 py-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-5 lg:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-5">
                    {/* Primary Stats - Gradient Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                        {mainCards.map((card, i) => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.05 }}
                                className="group relative overflow-hidden rounded-xl lg:rounded-2xl p-3 sm:p-4 cursor-pointer"
                                style={{
                                    background: `linear-gradient(135deg, ${card.color}08, ${card.color}15)`
                                }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Gradient overlay on hover */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                                />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div
                                            className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg lg:rounded-xl shadow-sm"
                                            style={{ background: `${card.color}20` }}
                                        >
                                            <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" style={{ color: card.color }} />
                                        </div>
                                        <motion.div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: card.color }}
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 font-medium mb-1">
                                        {card.label}
                                    </p>
                                    <p className="text-xs sm:text-sm lg:text-base font-bold text-slate-800 truncate">
                                        {card.value}
                                    </p>
                                    <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 mt-0.5 truncate">
                                        {card.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Detailed Information Grid */}
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Extended Details
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                            {detailCards.map((card, i) => (
                                <motion.div
                                    key={card.label}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + i * 0.04 }}
                                    className={`relative p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 transition-all hover:shadow-md ${card.warning
                                        ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                        }`}
                                    whileHover={{ y: -2 }}
                                >
                                    {card.warning && (
                                        <motion.div
                                            className="absolute top-2 right-2"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <AlertCircle className="w-3 h-3 text-amber-500" />
                                        </motion.div>
                                    )}

                                    <div className="flex items-start gap-2 sm:gap-2.5 mb-2">
                                        <div
                                            className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                                            style={{ background: `${card.color}15` }}
                                        >
                                            <card.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" style={{ color: card.color }} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 font-medium mb-0.5">
                                                {card.label}
                                            </p>
                                            <p className="text-xs sm:text-sm lg:text-base font-bold text-slate-800 truncate">
                                                {card.value}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 truncate">
                                            {card.subValue}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats Bar - Mobile Optimized */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl lg:rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))'
                        }}
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div
                                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </motion.div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-800">
                                    Digital ID Activated
                                </p>
                                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-slate-500">
                                    All systems operational • Last sync: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 sm:h-8 text-[10px] sm:text-xs hidden sm:flex"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                        </Button>
                    </motion.div>
                </CardContent>
            </Card>

            {/* Student Details - Desktop Only */}
            <Card className="hidden lg:block border-0 shadow-xl rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        Student Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Full Name</p>
                            <p className="font-semibold text-slate-800">{profile.first_name} {profile.last_name}</p>
                        </div>

                        {/* Student ID */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Student Tag</p>
                            <p className="font-mono font-semibold text-slate-800">{profile.student_tag || 'N/A'}</p>
                        </div>

                        {/* Grade & Class */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Grade & Section</p>
                            <p className="font-semibold text-slate-800">
                                {profile.grade_level ? `Grade ${profile.grade_level}` : 'N/A'}
                                {profile.class_name && ` • ${profile.class_name}`}
                            </p>
                        </div>

                        {/* School */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">School</p>
                            <p className="font-semibold text-slate-800 truncate">{profile.school?.name || 'Catalyst School'}</p>
                        </div>
                    </div>

                    {/* School Address */}
                    {profile.school?.address && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-100">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">School Address</p>
                                    <p className="font-medium text-slate-700">{profile.school.address}</p>
                                    {(profile.school.city || profile.school.country) && (
                                        <p className="text-sm text-slate-500 mt-1">
                                            {[profile.school.city, profile.school.country].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}


// Main Page Component
export default function AegisXPage() {
    const router = useRouter()
    const { profile: authProfile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)

    const [mounted, setMounted] = useState(false)
    const [profile, setProfile] = useState<StudentProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [nfcStatus, setNfcStatus] = useState<NFCStatus>({ isLinked: false })
    const [isLinkingNFC, setIsLinkingNFC] = useState(false)
    const [nfcSupported, setNfcSupported] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)

    // Check NFC support
    useEffect(() => {
        if (typeof window !== 'undefined' && 'NDEFReader' in window) {
            setNfcSupported(true)
        }
    }, [])

    // Mount state
    useEffect(() => {
        setMounted(true)
    }, [])

    // Auth check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        } else if (!authLoading && authProfile?.role !== 'student') {
            router.push(`/${authProfile?.role || 'login'}`)
        }
    }, [authLoading, user, authProfile, router])

    // Fetch profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/v2/student/profile', {
                    credentials: 'include'
                })

                if (!response.ok) throw new Error('Failed to fetch profile')

                const data = await response.json()
                setProfile(data.profile)
                await checkNFCStatus()
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && user) fetchProfile()
    }, [authLoading, user])

    const checkNFCStatus = async () => {
        try {
            const response = await fetch('/api/student/nfc-status', { credentials: 'include' })
            if (response.ok) {
                const data = await response.json()
                setNfcStatus(data)
            }
        } catch (err) {
            console.log('NFC status check failed:', err)
        }
    }

    const handleLinkNFC = useCallback(async () => {
        if (!nfcSupported) {
            alert('NFC not supported. Please contact your school administrator.')
            return
        }

        setIsLinkingNFC(true)

        try {
            // @ts-ignore
            const ndef = new NDEFReader()
            await ndef.scan()

            ndef.addEventListener('reading', async ({ serialNumber }: { serialNumber: string }) => {
                const response = await fetch('/api/student/link-nfc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ cardId: serialNumber })
                })

                if (response.ok) {
                    setNfcStatus({
                        isLinked: true,
                        cardId: serialNumber,
                        linkedAt: new Date().toISOString()
                    })
                    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
                }
                setIsLinkingNFC(false)
            })

            setTimeout(() => setIsLinkingNFC(false), 30000)
        } catch (err: any) {
            setIsLinkingNFC(false)
            alert(err.name === 'NotAllowedError'
                ? 'NFC permission denied.'
                : 'Failed to scan NFC card.')
        }
    }, [nfcSupported])

    const handleUnlinkNFC = async () => {
        if (!confirm('Are you sure you want to unlink your NFC card?')) return

        try {
            const response = await fetch('/api/student/link-nfc', {
                method: 'DELETE',
                credentials: 'include'
            })

            if (response.ok) {
                setNfcStatus({ isLinked: false })
                if ('vibrate' in navigator) navigator.vibrate(50)
            }
        } catch (err) {
            alert('Failed to unlink NFC card.')
        }
    }

    const handleDownload = async () => {
        // TODO: Implement card download as image
        alert('Download feature coming soon!')
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Catalyst Wells Digital ID',
                    text: `Student ID: ${profile?.student_tag}`,
                    url: window.location.href
                })
            } catch (err) {
                console.log('Share cancelled')
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    const handleViewHistory = () => {
        setShowHistoryModal(true)
    }

    const handleSettings = () => {
        router.push('/student/settings')
    }

    // Loading state
    if (!mounted || authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-highlight) 50%, white), white, color-mix(in srgb, var(--theme-tertiary) 30%, white))' }}>
                <ThemeLoader />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <CatalystLogo size="lg" />
                    <p className="text-slate-600 font-medium mt-4 text-sm sm:text-base">Loading your ID Card...</p>
                    <Loader2 className="w-5 h-5 mx-auto mt-2 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                </motion.div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-highlight) 50%, white), white)' }}>
                <ThemeLoader />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load ID Card</h2>
                    <p className="text-slate-600 mb-4 text-sm">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen pb-8 lg:pb-12"
            style={{
                background: 'linear-gradient(180deg, color-mix(in srgb, var(--theme-highlight) 40%, white) 0%, white 20%, color-mix(in srgb, var(--theme-tertiary) 15%, white) 100%)'
            }}
        >
            <ThemeLoader />
            <AccessHistoryModal open={showHistoryModal} onOpenChange={setShowHistoryModal} />

            {/* Header - Mobile Optimized */}
            <header
                className="sticky top-0 z-40 backdrop-blur-xl border-b"
                style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)'
                }}
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => router.back()}
                            className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-700" />
                        </motion.button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                                <span className="truncate">AegisX</span>
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 shrink-0" style={{ color: 'var(--theme-primary)' }} />
                            </h1>
                            <p className="text-[9px] sm:text-[10px] lg:text-sm text-slate-500 truncate">Catalyst Wells Digital ID</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 shrink-0">
                        {/* Quick actions for desktop */}
                        <div className="hidden lg:flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                <Download className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-700">Save</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                <Share2 className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-700">Share</span>
                            </motion.button>
                        </div>

                        {/* Verified Badge - Compact on mobile */}
                        <div
                            className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full"
                            style={{
                                background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                            }}
                        >
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" style={{ color: 'var(--theme-primary)' }} />
                            <span className="text-[10px] sm:text-xs lg:text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--theme-primary)' }}>
                                Verified
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Desktop Optimized Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                {/* Desktop: Two Column Layout */}
                <div className="lg:grid lg:grid-cols-5 lg:gap-10 xl:gap-14">

                    {/* Left Column - ID Card (larger on desktop) */}
                    <div className="lg:col-span-3">
                        {/* Card Container with Desktop Sizing */}
                        <div className="lg:sticky lg:top-28">
                            {profile && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <DigitalIDCard profile={profile} nfcStatus={nfcStatus} />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Features & Actions */}
                    <div className="lg:col-span-2 mt-6 lg:mt-0 space-y-5 lg:space-y-6">

                        {/* Mobile Quick Actions */}
                        <div className="lg:hidden">
                            <QuickActionsSection
                                onDownload={handleDownload}
                                onShare={handleShare}
                                onViewHistory={handleViewHistory}
                                onSettings={handleSettings}
                            />
                        </div>

                        {/* NFC Link Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <NFCLinkSection
                                nfcStatus={nfcStatus}
                                onLinkNFC={handleLinkNFC}
                                onUnlinkNFC={handleUnlinkNFC}
                                isLinking={isLinkingNFC}
                                nfcSupported={nfcSupported}
                            />
                        </motion.div>

                        {/* Info Cards */}
                        {profile && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <InfoCardsSection profile={profile} />
                            </motion.div>
                        )}

                        {/* Desktop Actions Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="hidden lg:block"
                        >
                            <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Settings className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 pt-0 space-y-3">
                                    <motion.button
                                        whileHover={{ x: 4 }}
                                        onClick={handleViewHistory}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <History className="w-5 h-5 text-slate-500" />
                                            <span className="font-medium text-slate-700">View Access History</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ x: 4 }}
                                        onClick={handleSettings}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-5 h-5 text-slate-500" />
                                            <span className="font-medium text-slate-700">Card Settings</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                    </motion.button>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Security Notice */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-4 lg:pt-6"
                        >
                            <div
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
                                style={{ background: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' }}
                            >
                                <Lock className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                <p className="text-xs lg:text-sm font-medium" style={{ color: 'var(--theme-primary)' }}>
                                    Protected by Catalyst Wells Security
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    )
}
