'use client'

/**
 * Teacher Digital ID Page - AegisX Style
 * Full-featured digital ID card for teachers with NFC linking, access history, and real database integration
 * Uses the same profile data source as /teacher/profile page
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Shield, Wifi,
    CheckCircle2, XCircle, Loader2,
    Fingerprint, User, Calendar, Sparkles,
    AlertCircle, RefreshCw, Download, Share2,
    Clock, MapPin, Phone, BookOpen, Award,
    History, Settings, ChevronRight,
    Scan, CreditCard, Zap, Lock,
    GraduationCap, Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/lib/redux/hooks'
import { DigitalIDCard, DigitalIDProfile, NFCStatus } from '@/components/aegisx/DigitalIDCard'
import { TeacherAccessHistoryModal } from '@/components/teacher/TeacherAccessHistoryModal'

// Types matching /teacher/profile page
interface TeacherProfile {
    id?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    address?: string
    bio?: string
    profile_picture_url?: string
    avatar_url?: string
    date_of_birth?: string
    hire_date?: string
    department?: string
    subject_specialization?: string
    education_level?: string
    years_experience?: number
    certifications?: string[]
    emergency_contact_name?: string
    emergency_contact_phone?: string
    school?: {
        id?: string
        name?: string
        school_code?: string
        logo_url?: string
        city?: string
        country?: string
        address?: string
    }
}

// NFC Link Section Component
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
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.08))'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div
                                className="p-2 sm:p-2.5 rounded-xl shadow-md"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
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
                                        Link your staff ID for tap-to-verify at attendance, staff room, and facilities.
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
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
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
        { icon: Download, label: 'Save', onClick: onDownload, color: '#3b82f6' },
        { icon: Share2, label: 'Share', onClick: onShare, color: '#8b5cf6' },
        { icon: History, label: 'History', onClick: onViewHistory, color: '#f59e0b' },
        { icon: Settings, label: 'Settings', onClick: onSettings, color: '#10b981' }
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

// Info Cards Section - Teacher Optimized
const TeacherInfoCardsSection = ({ profile }: { profile: TeacherProfile }) => {
    const currentDate = new Date()
    const hireDate = profile.hire_date
        ? new Date(profile.hire_date)
        : new Date(currentDate.getFullYear() - 3, 6, 1)

    const cardValidUntil = new Date(currentDate.getFullYear() + 1, 5, 30)
    const daysUntilExpiry = Math.ceil((cardValidUntil.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    const yearsOfService = Math.floor((currentDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365))

    const mainCards = [
        {
            icon: Calendar,
            label: 'Academic Year',
            value: '2025-2026',
            color: '#3b82f6',
            gradient: 'from-blue-500 to-indigo-600',
            description: 'Current session'
        },
        {
            icon: Briefcase,
            label: 'Department',
            value: profile.department || 'Faculty',
            color: '#8b5cf6',
            gradient: 'from-purple-500 to-pink-600',
            description: profile.subject_specialization || 'Educator'
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
            label: 'Access Level',
            value: 'Staff',
            color: '#f59e0b',
            gradient: 'from-orange-500 to-amber-600',
            description: 'Full campus access'
        }
    ]

    const detailCards = [
        {
            icon: User,
            label: 'Date of Joining',
            value: hireDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subValue: `${yearsOfService} years of service`,
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
            icon: GraduationCap,
            label: 'Qualification',
            value: profile.education_level || 'M.Ed',
            subValue: profile.subject_specialization || 'Education',
            color: '#10b981'
        },
        {
            icon: Clock,
            label: 'Experience',
            value: `${profile.years_experience || yearsOfService}+ Years`,
            subValue: 'Professional experience',
            color: '#f59e0b'
        },
        {
            icon: Fingerprint,
            label: 'Card ID Type',
            value: 'NFC + QR',
            subValue: 'Dual authentication',
            color: '#06b6d4'
        },
        {
            icon: Shield,
            label: 'Security',
            value: 'Verified',
            subValue: 'Identity confirmed',
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
            {/* Main Card Information */}
            <Card className="border-0 shadow-xl rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
                <CardHeader
                    className="pb-3 sm:pb-4 lg:pb-5"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div
                                className="p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl shadow-md"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                            >
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                                    Card Information
                                </CardTitle>
                                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 mt-0.5">
                                    Staff credentials & statistics
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
                    {/* Primary Stats */}
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

                    {/* Quick Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl lg:rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.08))'
                        }}
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div
                                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </motion.div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-800">
                                    Staff ID Activated
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

            {/* Teacher Details - Desktop Only */}
            <Card className="hidden lg:block border-0 shadow-xl rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        Staff Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Full Name</p>
                            <p className="font-semibold text-slate-800">{profile.first_name} {profile.last_name}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Email</p>
                            <p className="font-semibold text-slate-800 truncate">{profile.email || 'Not specified'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Department</p>
                            <p className="font-semibold text-slate-800">
                                {profile.department || 'Faculty'}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Specialization</p>
                            <p className="font-semibold text-slate-800">{profile.subject_specialization || 'General'}</p>
                        </div>
                    </div>

                    {/* Bio if available */}
                    {profile.bio && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-2">About</p>
                            <p className="text-sm text-slate-700">{profile.bio}</p>
                        </div>
                    )}

                    {/* Emergency Contact */}
                    {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-rose-700 font-semibold mb-1">Emergency Contact</p>
                                    {profile.emergency_contact_name && (
                                        <p className="text-sm text-rose-600">{profile.emergency_contact_name}</p>
                                    )}
                                    {profile.emergency_contact_phone && (
                                        <p className="text-sm text-rose-500">{profile.emergency_contact_phone}</p>
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

// Catalyst Logo Component
const CatalystLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = {
        sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
        md: { container: 'w-12 h-12', icon: 'w-6 h-6' },
        lg: { container: 'w-16 h-16', icon: 'w-8 h-8' }
    }

    return (
        <div className={`${sizes[size].container} relative`}>
            <div
                className="absolute inset-0 rounded-xl"
                style={{
                    background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                    padding: '2px'
                }}
            >
                <div className="w-full h-full rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center">
                    <div className="relative">
                        <Sparkles className={`${sizes[size].icon} text-blue-600`} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Main Page Component
export default function TeacherDigitalIDPage() {
    const router = useRouter()
    const { profile: reduxProfile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)

    const [mounted, setMounted] = useState(false)
    const [profile, setProfile] = useState<TeacherProfile | null>(null)
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

    // Auth check - allow teachers and admins
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        } else if (!authLoading && reduxProfile?.role && !['teacher', 'admin'].includes(reduxProfile.role)) {
            router.push(`/${reduxProfile.role}`)
        }
    }, [authLoading, user, reduxProfile, router])

    // Fetch profile - same source as /teacher/profile page
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/teacher/profile')

                if (response.ok) {
                    const data = await response.json()
                    const profileData = data.profile || reduxProfile
                    setProfile(profileData)
                } else {
                    // Fall back to Redux profile if API fails
                    if (reduxProfile) {
                        setProfile({
                            id: reduxProfile.id,
                            first_name: reduxProfile.first_name,
                            last_name: reduxProfile.last_name,
                            email: user?.email,
                            avatar_url: reduxProfile.avatar_url
                        })
                    }
                }

                await checkNFCStatus()
            } catch (err: any) {
                console.error('Error fetching profile:', err)
                // Fall back to Redux profile
                if (reduxProfile) {
                    setProfile({
                        id: reduxProfile.id,
                        first_name: reduxProfile.first_name,
                        last_name: reduxProfile.last_name,
                        email: user?.email,
                        avatar_url: reduxProfile.avatar_url
                    })
                } else {
                    setError(err.message)
                }
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && user) fetchProfile()
    }, [authLoading, user, reduxProfile])

    const checkNFCStatus = async () => {
        try {
            const response = await fetch('/api/teacher/nfc-status', { credentials: 'include' })
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
                const response = await fetch('/api/teacher/link-nfc', {
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
                } else {
                    const data = await response.json()
                    alert(data.error || 'Failed to link NFC card')
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
            const response = await fetch('/api/teacher/link-nfc', {
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
        alert('Download feature coming soon!')
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Digital Staff ID',
                    text: `Staff ID: TCH-${(profile?.id || '').substring(0, 8).toUpperCase()}`,
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
        router.push('/teacher/profile')
    }

    // Convert teacher profile to DigitalIDProfile format for the card component
    const digitalIDProfile: DigitalIDProfile | null = useMemo(() => {
        if (!profile) return null
        return {
            id: profile.id || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            student_tag: `TCH-${(profile.id || '').substring(0, 8).toUpperCase()}`,
            grade_level: profile.department || 'Faculty',
            class_name: profile.subject_specialization || 'Educator',
            avatar_url: profile.profile_picture_url || profile.avatar_url,
            email: profile.email,
            phone: profile.phone,
            blood_group: undefined,
            emergency_contact: profile.emergency_contact_phone,
            school: profile.school ? {
                id: profile.school.id || '',
                name: profile.school.name || '',
                school_code: profile.school.school_code,
                logo_url: profile.school.logo_url,
                city: profile.school.city,
                country: profile.school.country,
                address: profile.school.address
            } : undefined
        }
    }, [profile])

    // Loading state
    if (!mounted || authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), white, rgba(99, 102, 241, 0.1))' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <CatalystLogo size="lg" />
                    <p className="text-slate-600 font-medium mt-4 text-sm sm:text-base">Loading your Staff ID...</p>
                    <Loader2 className="w-5 h-5 mx-auto mt-2 animate-spin text-blue-600" />
                </motion.div>
            </div>
        )
    }

    // Error state
    if (error && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), white)' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Staff ID</h2>
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
                background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, white 20%, rgba(99, 102, 241, 0.05) 100%)'
            }}
        >
            <TeacherAccessHistoryModal open={showHistoryModal} onOpenChange={setShowHistoryModal} />

            {/* Header */}
            <header
                className="sticky top-0 z-40 backdrop-blur-xl border-b"
                style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(99, 102, 241, 0.15)'
                }}
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => router.push('/teacher')}
                            className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-700" />
                        </motion.button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                                <span className="truncate">Digital ID</span>
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 shrink-0 text-blue-600" />
                            </h1>
                            <p className="text-[9px] sm:text-[10px] lg:text-sm text-slate-500 truncate">Staff Identification Card</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 shrink-0">
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

                        {/* Verified Badge */}
                        <div
                            className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full"
                            style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}
                        >
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
                            <span className="text-[10px] sm:text-xs lg:text-sm font-semibold whitespace-nowrap text-blue-600">
                                Verified
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                <div className="lg:grid lg:grid-cols-5 lg:gap-10 xl:gap-14">

                    {/* Left Column - ID Card */}
                    <div className="lg:col-span-3">
                        <div className="lg:sticky lg:top-28">
                            {digitalIDProfile && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <DigitalIDCard profile={digitalIDProfile} nfcStatus={nfcStatus} />
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
                                <TeacherInfoCardsSection profile={profile} />
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
                                        <Settings className="w-4 h-4 text-blue-600" />
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
                                            <User className="w-5 h-5 text-slate-500" />
                                            <span className="font-medium text-slate-700">Edit Profile</span>
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
                                style={{ background: 'rgba(59, 130, 246, 0.05)' }}
                            >
                                <Lock className="w-4 h-4 text-blue-600" />
                                <p className="text-xs lg:text-sm font-medium text-blue-600">
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
