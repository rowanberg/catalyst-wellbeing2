'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Wifi, Check, School, Sparkles, Copy, RefreshCw, CreditCard
} from 'lucide-react'

// Types
export interface DigitalIDProfile {
    id: string
    first_name: string
    last_name: string
    student_tag?: string // Can serve as Teacher ID / Staff ID
    grade_level?: string // Can be Department for teachers
    class_name?: string // Can be Role/Title for teachers
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

export interface NFCStatus {
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
    profile: DigitalIDProfile
    nfcStatus: NFCStatus
    isFlipped: boolean
    onFlip: () => void
}) => {
    const [copied, setCopied] = useState(false)
    const idTag = profile.student_tag || 'N/A'

    const handleCopyTag = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (idTag !== 'N/A') {
            navigator.clipboard.writeText(idTag)
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
                                    Digital ID
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
                                        {profile.grade_level.includes('Grade') ? profile.grade_level : `Grade ${profile.grade_level}`}
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
                                ID Number
                            </p>
                            <div className="flex items-center gap-2">
                                <code
                                    className="text-white font-mono font-bold text-base sm:text-lg tracking-widest"
                                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                                >
                                    {idTag}
                                </code>
                                <motion.button
                                    onClick={handleCopyTag}
                                    className="p-1.5 rounded-lg transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.1)' }}
                                    whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Copy ID"
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
    profile: DigitalIDProfile
    isFlipped: boolean
    onFlip: () => void
}) => {
    // Generate deterministic QR pattern based on student tag
    const idTag = profile.student_tag || 'CATALYST'
    const qrPattern = React.useMemo(() => {
        const pattern: boolean[] = []
        for (let i = 0; i < 49; i++) {
            // Use character codes to create deterministic pattern
            const charCode = idTag.charCodeAt(i % idTag.length) || 0
            pattern.push((charCode + i) % 3 !== 0)
        }
        // Ensure corner markers (typical QR code style)
        [0, 1, 2, 7, 8, 14, 42, 43, 44, 35, 36, 28, 6, 4, 5, 48, 47, 46].forEach(idx => {
            if (idx < pattern.length) pattern[idx] = true
        })
        return pattern
    }, [idTag])

    // Generate barcode pattern from student tag
    const barcodePattern = React.useMemo(() => {
        const pattern: number[] = []
        for (let i = 0; i < 30; i++) {
            const charCode = idTag.charCodeAt(i % idTag.length) || 65
            pattern.push((charCode % 3) + 1)
        }
        return pattern
    }, [idTag])

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
export const DigitalIDCard = ({ profile, nfcStatus }: { profile: DigitalIDProfile, nfcStatus: NFCStatus }) => {
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
                        <h3 className="font-bold text-slate-800 dark:text-gray-100">Digital ID</h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400">Official identification card</p>
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
