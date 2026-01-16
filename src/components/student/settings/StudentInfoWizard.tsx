'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    User, GraduationCap, Users, BookOpen, Heart, AlertTriangle, Shield,
    ChevronRight, ChevronLeft, Check, Save, Lock, Eye, EyeOff,
    Calendar, Phone, Mail, Globe, Sparkles, Info, CheckCircle2,
    Loader2, HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudentInfoWizardProps {
    onComplete?: () => void
    embedded?: boolean
}

interface StepConfig {
    id: string
    title: string
    subtitle: string
    icon: React.ElementType
    color: string
    mandatory: boolean
}

const STEPS: StepConfig[] = [
    { id: 'identity', title: 'Student Identity', subtitle: 'Your school details', icon: GraduationCap, color: 'from-blue-500 to-indigo-600', mandatory: true },
    { id: 'personal', title: 'Personal Info', subtitle: 'Basic information', icon: User, color: 'from-violet-500 to-purple-600', mandatory: true },
    { id: 'guardian', title: 'Guardian Info', subtitle: 'Parent/guardian contact', icon: Users, color: 'from-pink-500 to-rose-600', mandatory: true },
    { id: 'academic', title: 'Academic Context', subtitle: 'Your studies', icon: BookOpen, color: 'from-emerald-500 to-teal-600', mandatory: true },
    { id: 'wellbeing', title: 'Wellbeing Preferences', subtitle: 'How we support you', icon: Heart, color: 'from-amber-500 to-orange-600', mandatory: false },
    { id: 'emergency', title: 'Emergency & Medical', subtitle: 'Important contacts', icon: AlertTriangle, color: 'from-red-500 to-rose-600', mandatory: true },
    { id: 'privacy', title: 'Privacy & Consent', subtitle: 'Your data choices', icon: Shield, color: 'from-slate-600 to-slate-800', mandatory: true }
]

const EDUCATION_BOARDS = [
    { value: 'cbse', label: 'CBSE' },
    { value: 'icse', label: 'ICSE' },
    { value: 'state', label: 'State Board' },
    { value: 'ib', label: 'IB' },
    { value: 'igcse', label: 'IGCSE' },
    { value: 'other', label: 'Other' }
]

const LANGUAGES = [
    'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati',
    'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu', 'Spanish', 'French', 'German'
]

export function StudentInfoWizard({ onComplete, embedded = false }: StudentInfoWizardProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [showGuardianPhone, setShowGuardianPhone] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Record<string, any>>({
        // Step 1: Identity
        admission_number: '',
        roll_number: '',
        class_or_grade: '',
        section: '',
        academic_year: new Date().getFullYear().toString(),

        // Step 2: Personal
        date_of_birth: '',
        gender: '',
        nationality: '',

        // Step 3: Guardian
        primary_guardian_name: '',
        primary_guardian_relationship: '',
        guardian_phone: '',
        guardian_email: '',
        secondary_contact_name: '',
        secondary_contact_phone: '',

        // Step 4: Academic
        education_board: '',
        medium_of_instruction: 'English',
        subjects_enrolled: [],
        stream: '',

        // Step 5: Wellbeing
        preferred_language: 'English',
        comfort_sharing_emotions: 'neutral',
        support_contact_preference: 'teacher',

        // Step 6: Emergency
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_notes: '',

        // Step 7: Privacy
        parent_consent_app_usage: false,
        data_processing_consent: false,
        wellbeing_visibility: 'student_only',
        share_mood_details: false,
        share_survey_text_answers: false,
        allow_ai_wellbeing_guidance: true
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [stepProgress, setStepProgress] = useState<boolean[]>(Array(7).fill(false))

    // Fetch existing data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/student/personal-info')
                if (res.ok) {
                    const { info, isNew } = await res.json()
                    if (!isNew && info) {
                        setFormData(prev => ({ ...prev, ...info }))

                        // Check if already completed
                        if (info.setup_completed) {
                            setIsCompleted(true)
                            setCurrentStep(6) // Show last step for reference
                        } else if (info.setup_step) {
                            setCurrentStep(Math.min(info.setup_step - 1, 6))
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch student info:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Calculate age from DOB
    const calculatedAge = useMemo(() => {
        if (!formData.date_of_birth) return null
        const dob = new Date(formData.date_of_birth)
        const today = new Date()
        let age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--
        }
        return age
    }, [formData.date_of_birth])

    // Auto-save field
    const autoSaveField = useCallback(async (field: string, value: any) => {
        try {
            await fetch('/api/student/personal-info', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field, value })
            })
        } catch (error) {
            console.error('Auto-save failed:', error)
        }
    }, [])

    // Handle field change
    const handleChange = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: '' }))

        // Debounced auto-save after 1 second
        const timeout = setTimeout(() => {
            autoSaveField(field, value)
        }, 1000)

        return () => clearTimeout(timeout)
    }, [autoSaveField])

    // Phone validation helper
    const isValidPhone = (phone: string): boolean => {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '')
        return /^\+?[1-9]\d{7,14}$/.test(cleaned)
    }

    // Email validation helper
    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    // Validate current step
    const validateStep = useCallback((step: number): boolean => {
        const newErrors: Record<string, string> = {}

        switch (step) {
            case 0: // Identity
                if (!formData.class_or_grade?.trim()) {
                    newErrors.class_or_grade = 'Class/Grade is required'
                }
                break
            case 1: // Personal
                if (!formData.date_of_birth) {
                    newErrors.date_of_birth = 'Date of birth is required'
                } else {
                    const dob = new Date(formData.date_of_birth)
                    const today = new Date()
                    const age = today.getFullYear() - dob.getFullYear()
                    if (age < 5 || age > 25) {
                        newErrors.date_of_birth = 'Please enter a valid student date of birth'
                    }
                }
                if (!formData.gender) {
                    newErrors.gender = 'Please select your gender'
                }
                break
            case 2: // Guardian
                if (!formData.primary_guardian_name?.trim()) {
                    newErrors.primary_guardian_name = 'Guardian name is required'
                } else if (formData.primary_guardian_name.trim().length < 2) {
                    newErrors.primary_guardian_name = 'Please enter a valid name'
                }
                if (!formData.guardian_phone?.trim()) {
                    newErrors.guardian_phone = 'Phone number is required'
                } else if (!isValidPhone(formData.guardian_phone)) {
                    newErrors.guardian_phone = 'Enter a valid phone number (e.g., +91 98765 43210)'
                }
                if (formData.guardian_email && !isValidEmail(formData.guardian_email)) {
                    newErrors.guardian_email = 'Enter a valid email address'
                }
                break
            case 3: // Academic
                if (!formData.education_board) {
                    newErrors.education_board = 'Please select your education board'
                }
                break
            case 4: // Wellbeing - optional, no validation
                break
            case 5: // Emergency
                if (!formData.emergency_contact_name?.trim()) {
                    newErrors.emergency_contact_name = 'Emergency contact name is required'
                }
                if (!formData.emergency_contact_phone?.trim()) {
                    newErrors.emergency_contact_phone = 'Emergency phone is required'
                } else if (!isValidPhone(formData.emergency_contact_phone)) {
                    newErrors.emergency_contact_phone = 'Enter a valid phone number'
                }
                break
            case 6: // Privacy
                if (!formData.parent_consent_app_usage) {
                    newErrors.parent_consent_app_usage = 'Parent/guardian consent is required'
                }
                if (!formData.data_processing_consent) {
                    newErrors.data_processing_consent = 'You must agree to the data processing terms'
                }
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    // Get data for current step (step is 0-indexed in frontend)
    const getStepData = (step: number): Record<string, any> => {
        const stepFields: Record<number, string[]> = {
            0: ['admission_number', 'roll_number', 'class_or_grade', 'section', 'academic_year'],
            1: ['date_of_birth', 'gender', 'nationality'],
            2: ['primary_guardian_name', 'primary_guardian_relationship', 'guardian_phone', 'guardian_email', 'secondary_contact_name', 'secondary_contact_phone'],
            3: ['education_board', 'medium_of_instruction', 'subjects_enrolled', 'stream'],
            4: ['preferred_language', 'comfort_sharing_emotions', 'support_contact_preference'],
            5: ['emergency_contact_name', 'emergency_contact_phone', 'medical_notes'],
            6: ['parent_consent_app_usage', 'data_processing_consent', 'wellbeing_visibility', 'share_mood_details', 'share_survey_text_answers', 'allow_ai_wellbeing_guidance']
        }

        const data: Record<string, any> = {}
        stepFields[step]?.forEach(field => {
            const value = formData[field]
            // Only include non-empty values
            if (value !== undefined && value !== null && value !== '') {
                data[field] = value
            }
        })

        console.log(`📦 Step ${step + 1} data:`, data)
        return data
    }

    // Save step and proceed
    const handleNext = async () => {
        if (!validateStep(currentStep)) return

        setSaving(true)
        try {
            const stepData = getStepData(currentStep)

            // API expects 1-indexed step numbers
            const response = await fetch('/api/student/personal-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: currentStep + 1, // Convert to 1-indexed
                    data: stepData
                })
            })

            const result = await response.json()

            if (!response.ok) {
                console.error('Save error:', result.error)
                alert(`Failed to save: ${result.error}`)
                return
            }

            console.log(`✅ Step ${currentStep + 1} saved:`, result)

            const newProgress = [...stepProgress]
            newProgress[currentStep] = true
            setStepProgress(newProgress)

            if (currentStep < 6) {
                setCurrentStep(prev => prev + 1)
            }
        } catch (error) {
            console.error('Failed to save step:', error)
            alert('Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // Complete setup
    const handleComplete = async () => {
        if (!validateStep(6)) return

        setSaving(true)
        try {
            const stepData = getStepData(6)

            const response = await fetch('/api/student/personal-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 7,
                    data: stepData,
                    markComplete: true
                })
            })

            const result = await response.json()

            if (!response.ok) {
                console.error('Complete error:', result.error)
                alert(`Failed to complete: ${result.error}`)
                return
            }

            console.log('✅ Setup completed:', result)
            setIsCompleted(true)
            setIsEditing(false)
            onComplete?.()
        } catch (error) {
            console.error('Failed to complete setup:', error)
        } finally {
            setSaving(false)
        }
    }

    // Progress percentage
    const progressPercent = ((currentStep + 1) / 7) * 100

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        )
    }

    const currentStepConfig = STEPS[currentStep]

    // Show completed state if done and not editing
    if (isCompleted && !isEditing) {
        return (
            <div className={cn("space-y-6", embedded ? "" : "max-w-3xl mx-auto")}>
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />
                    <CardContent className="pt-8 pb-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                                <CheckCircle2 className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Complete!</h2>
                            <p className="text-slate-600 mb-6">Your student information has been saved securely.</p>

                            {/* Summary Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md mx-auto mb-6">
                                {formData.class_or_grade && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500">Class/Grade</p>
                                        <p className="font-medium text-slate-800">{formData.class_or_grade} {formData.section && `- ${formData.section}`}</p>
                                    </div>
                                )}
                                {formData.education_board && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500">Education Board</p>
                                        <p className="font-medium text-slate-800">{formData.education_board.toUpperCase()}</p>
                                    </div>
                                )}
                                {formData.primary_guardian_name && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500">Guardian</p>
                                        <p className="font-medium text-slate-800">{formData.primary_guardian_name}</p>
                                    </div>
                                )}
                                {formData.date_of_birth && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500">Date of Birth</p>
                                        <p className="font-medium text-slate-800">{new Date(formData.date_of_birth).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Privacy Badge */}
                            <div className="flex items-center justify-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-full px-4 py-2 w-fit mx-auto mb-6">
                                <Lock className="h-4 w-4" />
                                <span>Your data is encrypted with AES-256</span>
                            </div>

                            <Button
                                onClick={() => {
                                    setIsEditing(true)
                                    setCurrentStep(0)
                                }}
                                className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                            >
                                <User className="h-4 w-4" />
                                Edit Information
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className={cn("space-y-6", embedded ? "" : "max-w-3xl mx-auto")}>
            {/* Header with Progress */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-xl overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${currentStepConfig.color}`} style={{ width: `${progressPercent}%` }} />
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${currentStepConfig.color} shadow-lg`}>
                                <currentStepConfig.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    {currentStepConfig.title}
                                </CardTitle>
                                <p className="text-sm text-slate-500 mt-0.5">{currentStepConfig.subtitle}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            Step {currentStep + 1} of 7
                        </Badge>
                    </div>
                </CardHeader>

                {/* Step Indicators */}
                <div className="px-6 pb-4">
                    <div className="flex gap-1.5">
                        {STEPS.map((step, idx) => (
                            <button
                                key={step.id}
                                onClick={() => idx < currentStep && setCurrentStep(idx)}
                                disabled={idx > currentStep}
                                className={cn(
                                    "flex-1 h-2 rounded-full transition-all",
                                    idx < currentStep ? "bg-emerald-500" :
                                        idx === currentStep ? `bg-gradient-to-r ${step.color}` :
                                            "bg-slate-200"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </Card>

            {/* Form Content */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-xl">
                <CardContent className="pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {/* Step 1: Student Identity */}
                            {currentStep === 0 && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-medium">Class / Grade *</Label>
                                            <Input
                                                value={formData.class_or_grade}
                                                onChange={(e) => handleChange('class_or_grade', e.target.value)}
                                                placeholder="e.g., 10th, Grade 8"
                                                className={cn("mt-1.5", errors.class_or_grade && "border-red-400")}
                                            />
                                            {errors.class_or_grade && <p className="text-red-500 text-xs mt-1">{errors.class_or_grade}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-slate-700 font-medium">Section</Label>
                                            <Input
                                                value={formData.section}
                                                onChange={(e) => handleChange('section', e.target.value)}
                                                placeholder="e.g., A, B, C"
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-medium">Admission Number</Label>
                                            <Input
                                                value={formData.admission_number}
                                                onChange={(e) => handleChange('admission_number', e.target.value)}
                                                placeholder="School admission number"
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-slate-700 font-medium">Roll Number</Label>
                                            <Input
                                                value={formData.roll_number}
                                                onChange={(e) => handleChange('roll_number', e.target.value)}
                                                placeholder="Class roll number"
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Academic Year</Label>
                                        <Input
                                            value={formData.academic_year}
                                            onChange={(e) => handleChange('academic_year', e.target.value)}
                                            placeholder="e.g., 2024-25"
                                            className="mt-1.5"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Step 2: Personal Information */}
                            {currentStep === 1 && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-medium">Date of Birth *</Label>
                                            <div className="relative mt-1.5">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="date"
                                                    value={formData.date_of_birth}
                                                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                                                    className={cn("pl-10", errors.date_of_birth && "border-red-400")}
                                                />
                                            </div>
                                            {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-slate-700 font-medium">Age</Label>
                                            <div className="mt-1.5 px-4 py-2.5 bg-slate-100 rounded-lg text-slate-600">
                                                {calculatedAge !== null ? `${calculatedAge} years` : 'Enter date of birth'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Gender *</Label>
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            {[
                                                { value: 'male', label: 'Male', emoji: '👦' },
                                                { value: 'female', label: 'Female', emoji: '👧' },
                                                { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🙂' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleChange('gender', opt.value)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 text-center transition-all",
                                                        formData.gender === opt.value ?
                                                            "border-violet-500 bg-violet-50 shadow-md" :
                                                            "border-slate-200 hover:border-violet-300"
                                                    )}
                                                >
                                                    <span className="text-2xl block mb-1">{opt.emoji}</span>
                                                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Nationality (Optional)</Label>
                                        <div className="relative mt-1.5">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                value={formData.nationality}
                                                onChange={(e) => handleChange('nationality', e.target.value)}
                                                placeholder="e.g., Indian, American"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Guardian Information */}
                            {currentStep === 2 && (
                                <>
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                        <Lock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-blue-700">
                                            Guardian contact details are encrypted and stored securely. Only authorized school staff can access this information.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-medium">Primary Guardian Name *</Label>
                                            <Input
                                                value={formData.primary_guardian_name}
                                                onChange={(e) => handleChange('primary_guardian_name', e.target.value)}
                                                placeholder="Parent/Guardian full name"
                                                className={cn("mt-1.5", errors.primary_guardian_name && "border-red-400")}
                                            />
                                            {errors.primary_guardian_name && <p className="text-red-500 text-xs mt-1">{errors.primary_guardian_name}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-slate-700 font-medium">Relationship</Label>
                                            <select
                                                value={formData.primary_guardian_relationship}
                                                onChange={(e) => handleChange('primary_guardian_relationship', e.target.value)}
                                                className="w-full mt-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                            >
                                                <option value="">Select relationship</option>
                                                <option value="mother">Mother</option>
                                                <option value="father">Father</option>
                                                <option value="guardian">Legal Guardian</option>
                                                <option value="grandparent">Grandparent</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-medium">Guardian Phone *</Label>
                                            <div className="relative mt-1.5">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type={showGuardianPhone ? "text" : "password"}
                                                    value={formData.guardian_phone}
                                                    onChange={(e) => handleChange('guardian_phone', e.target.value)}
                                                    placeholder="+91 98765 43210"
                                                    className={cn("pl-10 pr-10", errors.guardian_phone && "border-red-400")}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowGuardianPhone(!showGuardianPhone)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showGuardianPhone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.guardian_phone && <p className="text-red-500 text-xs mt-1">{errors.guardian_phone}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-slate-700 font-medium">Guardian Email</Label>
                                            <div className="relative mt-1.5">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    value={formData.guardian_email}
                                                    onChange={(e) => handleChange('guardian_email', e.target.value)}
                                                    placeholder="guardian@email.com"
                                                    className={cn("pl-10", errors.guardian_email && "border-red-400")}
                                                />
                                            </div>
                                            {errors.guardian_email && <p className="text-red-500 text-xs mt-1">{errors.guardian_email}</p>}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <Label className="text-slate-500 font-medium text-sm">Secondary Contact (Optional)</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                            <Input
                                                value={formData.secondary_contact_name}
                                                onChange={(e) => handleChange('secondary_contact_name', e.target.value)}
                                                placeholder="Name"
                                            />
                                            <Input
                                                value={formData.secondary_contact_phone}
                                                onChange={(e) => handleChange('secondary_contact_phone', e.target.value)}
                                                placeholder="Phone number"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 4: Academic Context */}
                            {currentStep === 3 && (
                                <>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Education Board *</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                                            {EDUCATION_BOARDS.map(board => (
                                                <button
                                                    key={board.value}
                                                    type="button"
                                                    onClick={() => handleChange('education_board', board.value)}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 text-center transition-all font-medium",
                                                        formData.education_board === board.value ?
                                                            "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md" :
                                                            "border-slate-200 hover:border-emerald-300 text-slate-600"
                                                    )}
                                                >
                                                    {board.label}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.education_board && <p className="text-red-500 text-xs mt-1">{errors.education_board}</p>}
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Medium of Instruction</Label>
                                        <select
                                            value={formData.medium_of_instruction}
                                            onChange={(e) => handleChange('medium_of_instruction', e.target.value)}
                                            className="w-full mt-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Stream (if applicable)</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                            {[
                                                { value: 'science', label: '🔬 Science' },
                                                { value: 'commerce', label: '📊 Commerce' },
                                                { value: 'arts', label: '🎨 Arts' },
                                                { value: 'general', label: '📚 General' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleChange('stream', opt.value)}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 text-center transition-all",
                                                        formData.stream === opt.value ?
                                                            "border-emerald-500 bg-emerald-50 shadow-md" :
                                                            "border-slate-200 hover:border-emerald-300"
                                                    )}
                                                >
                                                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 5: Wellbeing Preferences */}
                            {currentStep === 4 && (
                                <>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                        <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-amber-700">
                                            These preferences help us personalize your wellbeing support. All fields are optional.
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Preferred Language</Label>
                                        <select
                                            value={formData.preferred_language}
                                            onChange={(e) => handleChange('preferred_language', e.target.value)}
                                            className="w-full mt-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Comfort Sharing Emotions</Label>
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            {[
                                                { value: 'comfortable', label: 'Comfortable', emoji: '😊' },
                                                { value: 'neutral', label: 'Neutral', emoji: '😐' },
                                                { value: 'prefer_privacy', label: 'Prefer Privacy', emoji: '🔒' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleChange('comfort_sharing_emotions', opt.value)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 text-center transition-all",
                                                        formData.comfort_sharing_emotions === opt.value ?
                                                            "border-amber-500 bg-amber-50 shadow-md" :
                                                            "border-slate-200 hover:border-amber-300"
                                                    )}
                                                >
                                                    <span className="text-2xl block mb-1">{opt.emoji}</span>
                                                    <span className="text-xs font-medium text-slate-600">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Who would you like to reach out to for support?</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                            {[
                                                { value: 'teacher', label: 'Teacher', emoji: '👩‍🏫' },
                                                { value: 'counselor', label: 'Counselor', emoji: '💬' },
                                                { value: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
                                                { value: 'none', label: 'No preference', emoji: '—' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleChange('support_contact_preference', opt.value)}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 text-center transition-all",
                                                        formData.support_contact_preference === opt.value ?
                                                            "border-amber-500 bg-amber-50 shadow-md" :
                                                            "border-slate-200 hover:border-amber-300"
                                                    )}
                                                >
                                                    <span className="text-xl block mb-1">{opt.emoji}</span>
                                                    <span className="text-xs font-medium text-slate-600">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 6: Emergency & Medical */}
                            {currentStep === 5 && (
                                <>
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-700">
                                            Emergency contact information is encrypted and only accessible to authorized school personnel in case of emergencies.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-medium">Emergency Contact Name *</Label>
                                            <Input
                                                value={formData.emergency_contact_name}
                                                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                                                placeholder="Full name"
                                                className={cn("mt-1.5", errors.emergency_contact_name && "border-red-400")}
                                            />
                                            {errors.emergency_contact_name && <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_name}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-slate-700 font-medium">Emergency Phone *</Label>
                                            <div className="relative mt-1.5">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    value={formData.emergency_contact_phone}
                                                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                                                    placeholder="+91 98765 43210"
                                                    className={cn("pl-10", errors.emergency_contact_phone && "border-red-400")}
                                                />
                                            </div>
                                            {errors.emergency_contact_phone && <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_phone}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700 font-medium">Medical Notes (Optional)</Label>
                                        <p className="text-xs text-slate-500 mt-0.5 mb-2">
                                            Only mention allergies, asthma, or conditions relevant to school safety. No detailed medical diagnoses.
                                        </p>
                                        <textarea
                                            value={formData.medical_notes}
                                            onChange={(e) => handleChange('medical_notes', e.target.value)}
                                            placeholder="e.g., Peanut allergy, Asthma (has inhaler)"
                                            rows={3}
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Step 7: Privacy & Consent */}
                            {currentStep === 6 && (
                                <>
                                    <div className="space-y-4">
                                        <div className={cn(
                                            "p-4 rounded-xl border-2 transition-all",
                                            errors.parent_consent_app_usage ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
                                        )}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">Parent/Guardian Consent *</h4>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        I confirm that my parent/guardian has approved my use of this app and understands how my data will be used.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={formData.parent_consent_app_usage}
                                                    onCheckedChange={(checked) => handleChange('parent_consent_app_usage', checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "p-4 rounded-xl border-2 transition-all",
                                            errors.data_processing_consent ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
                                        )}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">Data Processing Agreement *</h4>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        I agree to the processing of my data as described in the privacy policy, compliant with DPDP Act, FERPA, COPPA, and GDPR.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={formData.data_processing_consent}
                                                    onCheckedChange={(checked) => handleChange('data_processing_consent', checked)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold text-slate-800 mb-3">Wellbeing Data Visibility</h4>
                                        <div className="space-y-3">
                                            {[
                                                { value: 'student_only', label: 'Only me', desc: 'Your wellbeing data stays completely private' },
                                                { value: 'trends_to_teachers', label: 'Trends to teachers', desc: 'Teachers see overall trends, not details' },
                                                { value: 'summary_to_parents', label: 'Summary to parents', desc: 'Parents receive monthly wellbeing summaries' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleChange('wellbeing_visibility', opt.value)}
                                                    className={cn(
                                                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                                                        formData.wellbeing_visibility === opt.value ?
                                                            "border-violet-500 bg-violet-50" :
                                                            "border-slate-200 hover:border-violet-300"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="font-medium text-slate-800">{opt.label}</span>
                                                            <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                                                        </div>
                                                        {formData.wellbeing_visibility === opt.value && (
                                                            <CheckCircle2 className="h-5 w-5 text-violet-500" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t space-y-3">
                                        <h4 className="font-semibold text-slate-800">Additional Privacy Controls</h4>

                                        <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-slate-700 text-sm">Share mood details in surveys</span>
                                                <p className="text-xs text-slate-500">Allow teachers to see your mood responses</p>
                                            </div>
                                            <Switch
                                                checked={formData.share_mood_details}
                                                onCheckedChange={(checked) => handleChange('share_mood_details', checked)}
                                            />
                                        </div>

                                        <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-slate-700 text-sm">Share survey text answers</span>
                                                <p className="text-xs text-slate-500">Allow staff to read your written responses</p>
                                            </div>
                                            <Switch
                                                checked={formData.share_survey_text_answers}
                                                onCheckedChange={(checked) => handleChange('share_survey_text_answers', checked)}
                                            />
                                        </div>

                                        <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-slate-700 text-sm">AI Wellbeing Guidance</span>
                                                <p className="text-xs text-slate-500">Receive personalized wellbeing suggestions</p>
                                            </div>
                                            <Switch
                                                checked={formData.allow_ai_wellbeing_guidance}
                                                onCheckedChange={(checked) => handleChange('allow_ai_wellbeing_guidance', checked)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Navigation Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 -mx-1 px-1">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0 || saving}
                    className="gap-2 order-2 sm:order-1 h-11 sm:h-10 rounded-xl border-slate-200 hover:bg-slate-100"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                    <span className="sm:hidden">Previous Step</span>
                </Button>

                {currentStep < 6 ? (
                    <Button
                        onClick={handleNext}
                        disabled={saving}
                        className="gap-2 order-1 sm:order-2 h-12 sm:h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 font-semibold"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span className="hidden sm:inline">Save & Continue</span>
                                <span className="sm:hidden">Continue</span>
                                <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={handleComplete}
                        disabled={saving}
                        className="gap-2 order-1 sm:order-2 h-12 sm:h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 font-semibold"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Completing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Complete Setup</span>
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
