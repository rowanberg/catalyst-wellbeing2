'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import SchoolRevealPro from '@/components/registration/SchoolRevealPro'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Copy,
  ExternalLink,
  Users,
  Shield,
  FileText,
  ScrollText,
  GraduationCap,
  Heart,
  XCircle,
  Brain,
  Trophy,
  Star,
  Palette,
  Globe,
  Code,
  Clock,
  BarChart,
  Target,
  Award,
  BookOpen,
  MessageSquare,
  Zap,
  Layers,
  TrendingUp,
  UserCheck,
  Coins
} from 'lucide-react'

// Add custom CSS animations
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-180deg); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
  .animate-spin-slow { animation: spin-slow 3s linear infinite; }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = customStyles
  document.head.appendChild(styleElement)
}

// Validation schemas
const schoolSchema = z.object({
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  schoolEmail: z.string().email('Invalid email address'),
  adminFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  adminLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SchoolForm = z.infer<typeof schoolSchema>

// Feature cards data for the sliding carousel
const featureCards = [
  {
    id: 1,
    icon: Heart,
    title: "Student Wellbeing Tracking",
    description: "Monitor and support student mental health with AI-powered insights",
    color: "from-rose-500 to-pink-600",
    bgImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },
  {
    id: 2,
    icon: Brain,
    title: "AI Learning Assistant",
    description: "Personalized learning paths powered by advanced AI technology",
    color: "from-purple-500 to-indigo-600",
    bgImage: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
  },
  {
    id: 3,
    icon: Trophy,
    title: "Gamification & Rewards",
    description: "Engage students with achievements, badges, and virtual rewards",
    color: "from-yellow-500 to-orange-600",
    bgImage: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
  },
  {
    id: 4,
    icon: BarChart,
    title: "Real-time Analytics",
    description: "Track academic progress with comprehensive dashboards",
    color: "from-green-500 to-emerald-600",
    bgImage: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
  },
  {
    id: 5,
    icon: MessageSquare,
    title: "Parent Communication",
    description: "Seamless communication between teachers, students, and parents",
    color: "from-blue-500 to-cyan-600",
    bgImage: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
  },
  {
    id: 6,
    icon: Shield,
    title: "Secure & FERPA Compliant",
    description: "Enterprise-grade security protecting student data",
    color: "from-gray-600 to-slate-700",
    bgImage: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
  },
  {
    id: 7,
    icon: Coins,
    title: "Digital Currency System",
    description: "Virtual economy with mind gems and rewards marketplace",
    color: "from-amber-500 to-yellow-600",
    bgImage: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
  },
  {
    id: 8,
    icon: Heart,
    title: "Health & Wellness Hub",
    description: "Comprehensive wellbeing resources and intervention tools",
    color: "from-teal-500 to-green-600",
    bgImage: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"
  }
]

export default function SchoolRegistrationWizard() {
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const [showMobileIntro, setShowMobileIntro] = useState(false) // Mobile intro state - start false to prevent hydration error
  const [introDismissed, setIntroDismissed] = useState(false) // Track if user dismissed intro
  const [success, setSuccess] = useState(false)
  const [schoolCode, setSchoolCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null) // Capture affiliate referral code
  const router = useRouter()
  const searchParams = useSearchParams()

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Capture referral code from URL on mount
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref)
      console.log('📌 Referral code captured:', ref)
    }
  }, [searchParams])

  // Auto-rotate feature cards
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % featureCards.length)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [])

  // Check if mobile on mount only (don't recheck on resize to avoid keyboard issues)
  useEffect(() => {
    if (mounted) {
      const isMobile = window.innerWidth < 1024
      setShowMobileIntro(isMobile && !introDismissed)
    }
  }, [mounted, introDismissed])

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    mode: 'onChange'
  })

  const watchedFields = watch()

  const steps = [
    {
      id: 1,
      title: 'Terms & Conditions',
      description: 'Review and accept our terms',
      icon: FileText,
      fields: ['termsAccepted']
    },
    {
      id: 2,
      title: 'School Information',
      description: 'Basic details about your school',
      icon: Building2,
      fields: ['schoolName', 'address', 'phone', 'schoolEmail']
    },
    {
      id: 3,
      title: 'Administrator Account',
      description: 'Create your admin account',
      icon: Shield,
      fields: ['adminFirstName', 'adminLastName', 'adminEmail', 'password']
    },
    {
      id: 4,
      title: 'Review & Complete',
      description: 'Confirm your information',
      icon: CheckCircle,
      fields: []
    }
  ]

  const validateStep = async (step: number) => {
    const stepFields = steps[step - 1].fields
    return await trigger(stepFields as any)
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: SchoolForm) => {
    setIsLoading(true)
    setError('')

    try {
      // Include referral code in the payload if present
      const payload = {
        ...data,
        referralCode: referralCode || undefined, // Pass referral code to API
      }

      const response = await fetch('/api/register-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setSchoolCode(result.schoolCode)
      } else {
        setError(result.message || 'Failed to register school')
      }
    } catch (err) {
      setError('Network error occurred. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copySchoolCode = async () => {
    try {
      await navigator.clipboard.writeText(schoolCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy school code')
    }
  }

  if (success) {
    return (
      <SchoolRevealPro
        schoolName={watchedFields.schoolName || 'Your School'}
        schoolId={schoolCode}
        location={watchedFields.address || 'Global'}
        onDashboard={() => router.push('/login')}
        onInviteTeachers={() => router.push('/register')}
      />
    )
  }

  // Mobile intro screen component - only show after mount to prevent hydration error
  if (mounted && showMobileIntro && window.innerWidth < 1024) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950">
        {/* Professional background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"></div>
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
          </div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          {/* Mobile header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="relative flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Catalyst
            </h1>
            <h2 className="text-lg font-semibold text-slate-300 mb-2">
              School Registration
            </h2>
            <p className="text-slate-400 text-sm">
              Secure • Compliant • Enterprise-Grade
            </p>
          </div>

          {/* Professional mobile feature cards */}
          <div className="w-full max-w-sm mb-8">
            <div className="relative h-[380px]">
              {featureCards.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 transform transition-all duration-2000 ease-in-out ${index === currentFeatureIndex
                    ? 'translate-x-0 opacity-100 scale-100 rotate-0'
                    : index < currentFeatureIndex
                      ? '-translate-x-full opacity-0 scale-98 -rotate-1'
                      : 'translate-x-full opacity-0 scale-98 rotate-1'
                    }`}
                >
                  <div className="h-full relative">
                    <div className="absolute inset-0 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-xl"></div>

                    <div className="relative z-10 p-6 h-full flex flex-col text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="inline-flex p-3 bg-blue-600 rounded-lg shadow-lg">
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-grow">
                        {feature.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-400">500+</div>
                          <div className="text-slate-400 text-xs">Schools</div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-400">50K+</div>
                          <div className="text-slate-400 text-xs">Students</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Professional mobile indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {featureCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeatureIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentFeatureIndex
                    ? 'w-8 bg-blue-500'
                    : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={() => {
              setShowMobileIntro(false)
              setIntroDismissed(true) // Mark as dismissed so it won't reappear
            }}
            className="w-full max-w-sm bg-blue-600 text-white font-semibold py-3.5 px-8 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Registration
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Optimized geometric background - Institution theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-teal-400/15 to-cyan-600/15 dark:from-teal-600/20 dark:to-cyan-800/20 rounded-full blur-2xl"></div>
        <div className="absolute top-20 -left-32 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-600/15 dark:from-emerald-600/20 dark:to-teal-800/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-gradient-to-br from-cyan-400/15 to-teal-500/15 dark:from-cyan-600/20 dark:to-teal-800/20 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 min-h-screen lg:grid lg:grid-cols-12">
        {/* Left side - Professional showcase */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 p-8 xl:p-12 items-center justify-center">
          <div className="w-full max-w-md xl:max-w-lg relative my-auto">
            {/* Professional logo */}
            <div className="mb-8 text-center relative">
              <div className="relative inline-block">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-500 hover:scale-110 hover:rotate-3">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-gray-900 dark:text-white mt-6 mb-2">
                Catalyst <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Wells</span>
              </h1>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-semibold font-jakarta text-gray-800 dark:text-slate-300">
                  School Registration
                </h2>
                <p className="text-gray-600 dark:text-slate-400 text-sm font-dm-sans">
                  Secure • Compliant • Enterprise-Grade
                </p>
              </div>
            </div>

            {/* Professional feature showcase */}
            <div className="relative h-[350px] xl:h-[400px]">
              {featureCards.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 transform transition-all duration-1000 ease-in-out ${index === currentFeatureIndex
                    ? 'translate-y-0 opacity-100'
                    : index === (currentFeatureIndex - 1 + featureCards.length) % featureCards.length
                      ? '-translate-y-8 opacity-0'
                      : 'translate-y-8 opacity-0'
                    }`}
                >
                  <div className="h-full relative">
                    {/* Professional card with enhanced backdrop */}
                    <div className="absolute inset-0 bg-white/85 dark:bg-slate-800/85 rounded-xl border border-white/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"></div>

                    <div className="relative z-10 p-6 h-full flex flex-col">
                      {/* Icon */}
                      <div className="mb-4">
                        <div className={`inline-flex p-3 bg-gradient-to-r ${feature.color} rounded-lg shadow-lg flex-shrink-0`}>
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-base sm:text-lg font-semibold font-jakarta text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow font-dm-sans">
                        {feature.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg p-3">
                          <div className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400">500+</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Schools</div>
                        </div>
                        <div className="bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                          <div className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">50K+</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Students</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Professional indicators */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {featureCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeatureIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentFeatureIndex
                      ? 'w-8 bg-teal-600 dark:bg-teal-500'
                      : 'w-1.5 bg-gray-400 dark:bg-slate-600 hover:bg-gray-500 dark:hover:bg-slate-500'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Professional form */}
        <div className="lg:col-span-7 xl:col-span-8 flex items-center justify-center p-4 py-8 lg:p-8 xl:p-12">
          <div className="w-full max-w-md lg:max-w-2xl xl:max-w-3xl">
            {/* Breadcrumbs */}
            <nav className="flex mb-4 text-sm text-gray-500 dark:text-slate-400" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <a href="https://www.catalystwells.com" className="inline-flex items-center hover:text-gray-900 dark:hover:text-white transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    <a href="https://www.catalystwells.com/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">Register</a>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-900 dark:text-white font-medium">Wizard</span>
                  </div>
                </li>
              </ol>
            </nav>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl">
              {/* Subtle top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 rounded-t-2xl"></div>

              <div className="p-6 lg:p-8 xl:p-10 max-h-[calc(100vh-4rem)] overflow-y-auto">

                {/* Professional Progress Steps */}
                <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
                  {/* Mobile-optimized progress bar */}
                  <div className="block lg:hidden mb-4">
                    {/* Current step indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg">
                          {React.createElement(steps[currentStep - 1].icon, { className: "w-4 h-4 text-white" })}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold font-jakarta text-slate-900 dark:text-white">
                            {steps[currentStep - 1].title}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">
                            Step {currentStep} of {steps.length}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Progress</div>
                        <div className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                          {Math.round((currentStep / steps.length) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative">
                      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(currentStep / steps.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Step dots */}
                    <div className="flex justify-between mt-2 px-1">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentStep > step.id
                            ? 'bg-teal-600'
                            : currentStep === step.id
                              ? 'bg-teal-600 scale-150'
                              : 'bg-gray-300 dark:bg-slate-700'
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Desktop progress steps */}
                  <div className="hidden lg:block">
                    <div className="flex items-center justify-center space-x-2 xl:space-x-4 mb-4 max-w-2xl mx-auto">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div className="relative">
                            {/* Step circle */}
                            <div
                              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${currentStep >= step.id
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                                : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                }`}
                            >
                              {currentStep > step.id ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <step.icon className="w-4 h-4" />
                              )}
                            </div>
                          </div>

                          {/* Connector line */}
                          {index < steps.length - 1 && (
                            <div className="w-8 xl:w-12 mx-1 xl:mx-2">
                              <div className="h-0.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r from-teal-600 to-cyan-600 transition-all duration-500 ${currentStep > step.id ? 'w-full' : 'w-0'
                                    }`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop step info */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {steps[currentStep - 1].title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Step 1: Professional Terms & Conditions */}
                  {currentStep === 1 && (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Terms Content Card */}
                      <div className="relative">
                        <div className="bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700/50 p-6 shadow-lg">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg">
                              <ScrollText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold font-jakarta text-slate-900 dark:text-white">
                                Terms & Conditions
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm">Please review before proceeding</p>
                            </div>
                          </div>

                          {/* Terms Content - Natural flow */}
                          <div className="mb-4">
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                              {/* Introduction */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <Shield className="w-4 h-4" /> 1. Acceptance of Terms
                                </h4>
                                <p>
                                  By registering your educational institution on the Catalyst platform, you acknowledge that you have read, understood, and agree to be bound by our <a href="https://www.catalystwells.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms and Conditions</a>, <a href="https://www.catalystwells.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>, <a href="https://www.catalystwells.com/legal" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Legal Notice</a>, and <a href="https://www.catalystwells.com/cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Cookie Policy</a>. You confirm that you are authorized to register your institution and accept these terms on its behalf.
                                </p>
                              </div>

                              {/* Trial Period */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <Clock className="w-4 h-4" /> 2. Trial Period
                                </h4>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>7-day free trial with full platform access</li>
                                  <li>Maximum 100 active members during trial</li>
                                  <li>No credit card required for trial period</li>
                                  <li>Automatic notifications before trial expiration</li>
                                </ul>
                              </div>

                              {/* Data Privacy */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <Lock className="w-4 h-4" /> 3. Data Privacy & Security
                                </h4>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>FERPA compliant student data protection</li>
                                  <li>Enterprise-grade encryption for all data</li>
                                  <li>Regular security audits and compliance checks</li>
                                  <li>No third-party data sharing without consent</li>
                                  <li>Right to data export and deletion</li>
                                </ul>
                              </div>

                              {/* Educational Use */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4" /> 4. Educational Use Only
                                </h4>
                                <p>
                                  This platform is designed exclusively for educational institutions and purposes. Commercial use, data scraping, or unauthorized access is strictly prohibited and may result in immediate account termination.
                                </p>
                              </div>

                              {/* Responsibilities */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <UserCheck className="w-4 h-4" /> 5. Institution Responsibilities
                                </h4>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Provide accurate and up-to-date institution information</li>
                                  <li>Maintain secure administrator credentials</li>
                                  <li>Ensure appropriate use by staff and students</li>
                                  <li>Monitor and manage user activities</li>
                                  <li>Comply with local educational regulations</li>
                                </ul>
                              </div>

                              {/* Service Availability */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <Globe className="w-4 h-4" /> 6. Service Availability
                                </h4>
                                <p>
                                  While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance. We are not liable for damages resulting from service interruptions.
                                </p>
                              </div>

                              {/* Termination */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <XCircle className="w-4 h-4" /> 7. Account Termination
                                </h4>
                                <p>
                                  You may terminate your account at any time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, all data will be retained for 30 days before permanent deletion.
                                </p>
                              </div>

                              {/* Updates */}
                              <div>
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> 8. Terms Updates
                                </h4>
                                <p>
                                  We may update these terms periodically. Significant changes will be communicated via email. Continued use of the platform after updates constitutes acceptance of the revised terms.
                                </p>
                              </div>

                              {/* Contact */}
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                                <h4 className="text-slate-900 dark:text-white font-semibold mb-2">Questions?</h4>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">
                                  For questions about these terms, contact us at{' '}
                                  <a href="mailto:legal@catalystwells.in" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    legal@catalystwells.in
                                  </a>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Acceptance Checkbox */}
                          <div className="flex items-start gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                            <input
                              {...register('termsAccepted')}
                              type="checkbox"
                              id="termsAccepted"
                              className="mt-1 w-5 h-5 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="termsAccepted" className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                              <span className="font-semibold text-slate-900 dark:text-white">I have read and agree to the Terms & Conditions</span> and confirm that I am authorized to register this institution on behalf of the school administration.
                            </label>
                          </div>

                          {errors.termsAccepted && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
                              <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                {errors.termsAccepted?.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: School Information */}
                  {currentStep === 2 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid gap-3 sm:gap-4">
                        {/* School Name Field */}
                        <div>
                          <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">School Name</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Building2 className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                              {...register('schoolName')}
                              type="text"
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter your school name"
                            />
                          </div>
                          {errors.schoolName && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.schoolName?.message}
                            </p>
                          )}
                        </div>

                        {/* School Address Field */}
                        <div>
                          <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">School Address</label>
                          <div className="relative">
                            <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none">
                              <MapPin className="h-5 w-5 text-slate-400" />
                            </div>
                            <textarea
                              {...register('address')}
                              rows={3}
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Enter complete school address"
                            />
                          </div>
                          {errors.address && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.address?.message}
                            </p>
                          )}
                        </div>

                        {/* Phone and Email Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {/* Phone Field */}
                          <div>
                            <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">Phone Number</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-slate-400" />
                              </div>
                              <input
                                {...register('phone')}
                                type="tel"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            {errors.phone && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                {errors.phone?.message}
                              </p>
                            )}
                          </div>

                          {/* Email Field */}
                          <div>
                            <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">School Email</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                              </div>
                              <input
                                {...register('schoolEmail')}
                                type="email"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                placeholder="info@school.edu"
                              />
                            </div>
                            {errors.schoolEmail && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                {errors.schoolEmail?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Administrator Account */}
                  {currentStep === 3 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid gap-3 sm:gap-4">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {/* First Name */}
                          <div>
                            <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">First Name</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                              </div>
                              <input
                                {...register('adminFirstName')}
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                placeholder="John"
                              />
                            </div>
                            {errors.adminFirstName && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                {errors.adminFirstName?.message}
                              </p>
                            )}
                          </div>

                          {/* Last Name */}
                          <div>
                            <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">Last Name</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                              </div>
                              <input
                                {...register('adminLastName')}
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                placeholder="Doe"
                              />
                            </div>
                            {errors.adminLastName && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                {errors.adminLastName?.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Admin Email */}
                        <div>
                          <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">Administrator Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                              {...register('adminEmail')}
                              type="email"
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                              placeholder="admin@school.edu"
                            />
                          </div>
                          {errors.adminEmail && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.adminEmail?.message}
                            </p>
                          )}
                        </div>

                        {/* Password */}
                        <div>
                          <label className="text-sm font-medium font-dm-sans text-slate-700 dark:text-slate-300 mb-2 block">Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                              {...register('password')}
                              type={showPassword ? 'text' : 'password'}
                              className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                              placeholder="Create a secure password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.password?.message}
                            </p>
                          )}

                          {/* Password strength indicator */}
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${watchedFields.password && watchedFields.password.length >= level * 3
                                    ? level === 1 ? 'bg-red-500'
                                      : level === 2 ? 'bg-yellow-500'
                                        : level === 3 ? 'bg-blue-500'
                                          : 'bg-emerald-500'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Password strength: {
                                !watchedFields.password ? 'Enter a password' :
                                  watchedFields.password.length < 6 ? 'Too weak' :
                                    watchedFields.password.length < 9 ? 'Fair' :
                                      watchedFields.password.length < 12 ? 'Good' :
                                        'Strong'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {currentStep === 4 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-3 sm:space-y-4">
                        {/* School Information Review */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-base font-semibold font-jakarta text-slate-900 dark:text-white">School Information</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">School Name</span>
                              <p className="text-slate-900 dark:text-white font-medium">{watchedFields.schoolName || '-'}</p>
                            </div>
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Email</span>
                              <p className="text-slate-900 dark:text-white font-medium text-sm">{watchedFields.schoolEmail || '-'}</p>
                            </div>
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Phone</span>
                              <p className="text-slate-900 dark:text-white font-medium">{watchedFields.phone || '-'}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 md:col-span-2">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Address</span>
                              <p className="text-slate-900 dark:text-white font-medium">{watchedFields.address || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Administrator Review */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-base font-semibold font-jakarta text-slate-900 dark:text-white">Administrator Account</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Full Name</span>
                              <p className="text-slate-900 dark:text-white font-medium">
                                {watchedFields.adminFirstName || '-'} {watchedFields.adminLastName || '-'}
                              </p>
                            </div>
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Login Email</span>
                              <p className="text-slate-900 dark:text-white font-medium text-sm">{watchedFields.adminEmail || '-'}</p>
                            </div>
                          </div>

                          {/* Login & Security Information */}
                          <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-4">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">Login Credentials</h4>
                                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed mb-2">
                                  Use <span className="font-semibold text-blue-600 dark:text-blue-400">{watchedFields.adminEmail || 'your admin email'}</span> to log in to your administrator dashboard after registration.
                                </p>
                                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2.5 py-2 mt-2">
                                  <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <span className="font-semibold text-amber-700 dark:text-amber-400">Security Tip:</span> Enable 2-factor authentication in Settings after your first login for increased account security.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <p className="text-red-600 dark:text-red-400 text-sm text-center flex items-center justify-center gap-2">
                            <XCircle className="w-5 h-5" />
                            {error}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation - Professional */}
                  <div className="mt-5 sm:mt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium font-dm-sans hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>
                      )}
                    </div>

                    <div>
                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold font-jakarta rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <span>Next Step</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold font-jakarta rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Creating School...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Complete Registration</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}