'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    AppWindow,
    Globe,
    Shield,
    Palette,
    CheckCircle,
    Upload,
    X,
    Info,
    AlertCircle,
    Sparkles
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface FormData {
    // Step 1: Basic Info
    name: string
    description: string
    shortDescription: string
    category: string

    // Step 2: URLs
    websiteUrl: string
    privacyPolicyUrl: string
    termsOfServiceUrl: string
    supportUrl: string
    documentationUrl: string

    // Step 3: OAuth Config
    redirectUris: string[]
    scopes: string[]
    environment: 'sandbox' | 'production'

    // Step 4: Branding
    logoUrl: string
    bannerUrl: string
}

const categories = [
    { id: 'learning', name: 'Learning & LMS', description: 'Educational content and learning management' },
    { id: 'attendance', name: 'Attendance', description: 'Attendance tracking and management' },
    { id: 'analytics', name: 'Analytics', description: 'Data analysis and reporting' },
    { id: 'wellbeing', name: 'Wellbeing', description: 'Student health and wellbeing' },
    { id: 'communication', name: 'Communication', description: 'Messaging and notifications' },
    { id: 'productivity', name: 'Productivity', description: 'Scheduling and task management' },
    { id: 'assessment', name: 'Assessment', description: 'Tests, quizzes, and grading' },
    { id: 'other', name: 'Other', description: 'Other educational tools' }
]

const availableScopes = [
    { id: 'profile.read', name: 'Read Profile', category: 'Profile', risk: 'low' },
    { id: 'profile.email', name: 'Read Email', category: 'Profile', risk: 'medium' },
    { id: 'student.profile.read', name: 'Student Profile', category: 'Student', risk: 'low' },
    { id: 'student.attendance.read', name: 'Attendance Records', category: 'Student', risk: 'medium' },
    { id: 'student.academic.read', name: 'Academic Records', category: 'Student', risk: 'medium' },
    { id: 'student.assessments.read', name: 'Assessment Data', category: 'Student', risk: 'medium' },
    { id: 'student.timetable.read', name: 'Timetable', category: 'Student', risk: 'low' },
    { id: 'student.wellbeing.read', name: 'Wellbeing Data', category: 'Student', risk: 'high' },
    { id: 'student.notifications.send', name: 'Send Notifications', category: 'Student', risk: 'medium' },
    { id: 'teacher.profile.read', name: 'Teacher Profile', category: 'Teacher', risk: 'low' },
    { id: 'teacher.classes.read', name: 'Assigned Classes', category: 'Teacher', risk: 'low' },
    { id: 'parent.profile.read', name: 'Parent Profile', category: 'Parent', risk: 'low' },
    { id: 'parent.children.read', name: 'Children Info', category: 'Parent', risk: 'medium' },
    { id: 'school.structure.read', name: 'School Structure', category: 'School', risk: 'low' },
    { id: 'calendar.read', name: 'Calendar Events', category: 'Calendar', risk: 'low' }
]

const steps = [
    { id: 1, name: 'Basic Info', icon: AppWindow },
    { id: 2, name: 'URLs', icon: Globe },
    { id: 3, name: 'OAuth Config', icon: Shield },
    { id: 4, name: 'Branding', icon: Palette },
    { id: 5, name: 'Review', icon: CheckCircle }
]

export default function CreateApplicationPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [newRedirectUri, setNewRedirectUri] = useState('')

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        shortDescription: '',
        category: '',
        websiteUrl: '',
        privacyPolicyUrl: '',
        termsOfServiceUrl: '',
        supportUrl: '',
        documentationUrl: '',
        redirectUris: [],
        scopes: ['profile.read'],
        environment: 'sandbox',
        logoUrl: '',
        bannerUrl: ''
    })

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const addRedirectUri = () => {
        if (newRedirectUri && !formData.redirectUris.includes(newRedirectUri)) {
            updateFormData('redirectUris', [...formData.redirectUris, newRedirectUri])
            setNewRedirectUri('')
        }
    }

    const removeRedirectUri = (uri: string) => {
        updateFormData('redirectUris', formData.redirectUris.filter(u => u !== uri))
    }

    const toggleScope = (scopeId: string) => {
        if (formData.scopes.includes(scopeId)) {
            updateFormData('scopes', formData.scopes.filter(s => s !== scopeId))
        } else {
            updateFormData('scopes', [...formData.scopes, scopeId])
        }
    }

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return formData.name.length >= 3 && formData.description.length >= 20 && formData.category !== ''
            case 2:
                return formData.websiteUrl !== '' && formData.privacyPolicyUrl !== '' && formData.termsOfServiceUrl !== ''
            case 3:
                return formData.redirectUris.length > 0 && formData.scopes.length > 0
            case 4:
                return true // Branding is optional
            default:
                return true
        }
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 5))
            setError('')
        } else {
            setError('Please fill in all required fields')
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
        setError('')
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) throw new Error('Developer account not found')

            // Generate client_id
            const clientId = `cw_app_${Math.random().toString(36).substring(2, 15)}`

            // Create application
            const { data: app, error: createError } = await devSupabase
                .from('developer_applications')
                .insert({
                    developer_id: account.id,
                    name: formData.name,
                    description: formData.description,
                    short_description: formData.shortDescription,
                    category: formData.category,
                    website_url: formData.websiteUrl,
                    privacy_policy_url: formData.privacyPolicyUrl,
                    terms_of_service_url: formData.termsOfServiceUrl,
                    support_url: formData.supportUrl || null,
                    documentation_url: formData.documentationUrl || null,
                    redirect_uris: formData.redirectUris,
                    requested_scopes: formData.scopes,
                    allowed_scopes: formData.scopes,
                    environment: formData.environment,
                    logo_url: formData.logoUrl || null,
                    banner_url: formData.bannerUrl || null,
                    client_id: clientId,
                    status: 'draft'
                })
                .select()
                .single()

            if (createError) throw createError

            // Log activity
            await devSupabase.from('developer_activity_logs').insert({
                developer_id: account.id,
                application_id: app.id,
                action: 'created_application',
                resource_type: 'application',
                resource_id: app.id,
                details: { name: formData.name }
            })

            router.push(`/dashboard/applications/${app.id}?created=true`)
        } catch (err: any) {
            setError(err.message || 'Failed to create application')
        } finally {
            setLoading(false)
        }
    }

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-green-500/20 text-green-400'
            case 'medium': return 'bg-yellow-500/20 text-yellow-400'
            case 'high': return 'bg-red-500/20 text-red-400'
            default: return 'bg-slate-500/20 text-slate-400'
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/applications"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Applications</span>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Application</h1>
                <p className="text-slate-400 mt-1">Set up your OAuth application to integrate with CatalystWells</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentStep > step.id
                                        ? 'bg-green-500'
                                        : currentStep === step.id
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                            : 'bg-slate-700'
                                    }`}>
                                    {currentStep > step.id ? (
                                        <Check className="w-6 h-6 text-white" />
                                    ) : (
                                        <step.icon className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <span className={`mt-2 text-sm font-medium ${currentStep >= step.id ? 'text-white' : 'text-slate-500'
                                    }`}>
                                    {step.name}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-700'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Form Card */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8"
            >
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Application Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="My Education App"
                            />
                            <p className="mt-1 text-xs text-slate-500">Minimum 3 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Short Description <span className="text-slate-500">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.shortDescription}
                                onChange={(e) => updateFormData('shortDescription', e.target.value)}
                                maxLength={100}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="A brief one-liner about your app"
                            />
                            <p className="mt-1 text-xs text-slate-500">{formData.shortDescription.length}/100 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Full Description <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => updateFormData('description', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                placeholder="Describe what your app does, how it helps educators and students..."
                            />
                            <p className="mt-1 text-xs text-slate-500">Minimum 20 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">
                                Category <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => updateFormData('category', cat.id)}
                                        className={`p-4 rounded-xl border text-left transition-all ${formData.category === cat.id
                                                ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/20'
                                                : 'bg-slate-900/50 border-slate-600 hover:border-slate-500'
                                            }`}
                                    >
                                        <p className={`text-sm font-medium ${formData.category === cat.id ? 'text-blue-400' : 'text-white'}`}>
                                            {cat.name}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: URLs */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-blue-300">
                                These URLs are required for app verification. Make sure they are accessible and contain valid content.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Website URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="url"
                                value={formData.websiteUrl}
                                onChange={(e) => updateFormData('websiteUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://yourapp.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Privacy Policy URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="url"
                                value={formData.privacyPolicyUrl}
                                onChange={(e) => updateFormData('privacyPolicyUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://yourapp.com/privacy"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Terms of Service URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="url"
                                value={formData.termsOfServiceUrl}
                                onChange={(e) => updateFormData('termsOfServiceUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://yourapp.com/terms"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Support URL <span className="text-slate-500">(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.supportUrl}
                                onChange={(e) => updateFormData('supportUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://yourapp.com/support"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Documentation URL <span className="text-slate-500">(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.documentationUrl}
                                onChange={(e) => updateFormData('documentationUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://docs.yourapp.com"
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: OAuth Config */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        {/* Environment Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">
                                Environment
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => updateFormData('environment', 'sandbox')}
                                    className={`p-4 rounded-xl border text-left transition-all ${formData.environment === 'sandbox'
                                            ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/20'
                                            : 'bg-slate-900/50 border-slate-600 hover:border-slate-500'
                                        }`}
                                >
                                    <p className={`font-medium ${formData.environment === 'sandbox' ? 'text-blue-400' : 'text-white'}`}>
                                        Sandbox
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">For testing with dummy data</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateFormData('environment', 'production')}
                                    className={`p-4 rounded-xl border text-left transition-all ${formData.environment === 'production'
                                            ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/20'
                                            : 'bg-slate-900/50 border-slate-600 hover:border-slate-500'
                                        }`}
                                >
                                    <p className={`font-medium ${formData.environment === 'production' ? 'text-blue-400' : 'text-white'}`}>
                                        Production
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">For live apps (requires approval)</p>
                                </button>
                            </div>
                        </div>

                        {/* Redirect URIs */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Redirect URIs <span className="text-red-400">*</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-3">
                                Where users will be redirected after authorization
                            </p>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="url"
                                    value={newRedirectUri}
                                    onChange={(e) => setNewRedirectUri(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="https://yourapp.com/auth/callback"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRedirectUri())}
                                />
                                <button
                                    type="button"
                                    onClick={addRedirectUri}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {formData.redirectUris.length > 0 && (
                                <div className="space-y-2">
                                    {formData.redirectUris.map((uri) => (
                                        <div key={uri} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                            <code className="text-sm text-slate-300 truncate">{uri}</code>
                                            <button
                                                type="button"
                                                onClick={() => removeRedirectUri(uri)}
                                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Scopes */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Requested Scopes <span className="text-red-400">*</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-3">
                                Select the permissions your app needs
                            </p>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {availableScopes.map((scope) => (
                                    <button
                                        key={scope.id}
                                        type="button"
                                        onClick={() => toggleScope(scope.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${formData.scopes.includes(scope.id)
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.scopes.includes(scope.id)
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-slate-600'
                                                }`}>
                                                {formData.scopes.includes(scope.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-white">{scope.name}</p>
                                                <p className="text-xs text-slate-500">{scope.id}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(scope.risk)}`}>
                                            {scope.risk}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Branding */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-xl flex gap-3">
                            <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <p className="text-sm text-slate-400">
                                Branding is optional but recommended. A logo helps users identify your app during authorization.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Logo URL <span className="text-slate-500">(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.logoUrl}
                                onChange={(e) => updateFormData('logoUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://yourapp.com/logo.png"
                            />
                            <p className="mt-1 text-xs text-slate-500">Recommended: 256x256px, PNG or SVG</p>
                        </div>

                        {formData.logoUrl && (
                            <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <img
                                    src={formData.logoUrl}
                                    alt="App logo preview"
                                    className="w-16 h-16 rounded-xl object-cover"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <p className="text-sm text-slate-400">Logo Preview</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Banner URL <span className="text-slate-500">(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.bannerUrl}
                                onChange={(e) => updateFormData('bannerUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://yourapp.com/banner.png"
                            />
                            <p className="mt-1 text-xs text-slate-500">Recommended: 1200x400px, PNG or JPG</p>
                        </div>
                    </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <p className="text-sm text-green-300">
                                Review your application details before creating. You can edit these later.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <h4 className="text-sm font-semibold text-slate-400 mb-3">Basic Info</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Name:</span>
                                        <span className="text-white font-medium">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Category:</span>
                                        <span className="text-white">{categories.find(c => c.id === formData.category)?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <h4 className="text-sm font-semibold text-slate-400 mb-3">URLs</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Website:</span>
                                        <span className="text-white truncate max-w-xs">{formData.websiteUrl}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Privacy Policy:</span>
                                        <span className="text-white truncate max-w-xs">{formData.privacyPolicyUrl}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <h4 className="text-sm font-semibold text-slate-400 mb-3">OAuth Configuration</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Environment:</span>
                                        <span className="text-white capitalize">{formData.environment}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Redirect URIs:</span>
                                        <span className="text-white">{formData.redirectUris.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Scopes:</span>
                                        <span className="text-white">{formData.scopes.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    {currentStep < 5 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
                        >
                            <span>Continue</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Create Application</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
