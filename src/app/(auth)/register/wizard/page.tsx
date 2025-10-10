'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
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
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [showMobileIntro, setShowMobileIntro] = useState(true) // Mobile intro state
  const [success, setSuccess] = useState(false)
  const [schoolCode, setSchoolCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const router = useRouter()

  // Auto-rotate feature cards
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % featureCards.length)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [])

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setShowMobileIntro(window.innerWidth < 1024) // Show intro on mobile/tablet
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      const response = await fetch('/api/register-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900">
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
          
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">🎉 School Registered!</h2>
            <p className="text-white/80 mb-6">Welcome to the Catalyst platform</p>
            
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm mb-6">
              <p className="text-white/80 text-sm mb-2">Your unique school code:</p>
              <div className="flex items-center justify-center space-x-2">
                <p className="text-3xl font-mono font-bold text-white tracking-wider">{schoolCode}</p>
                <button
                  onClick={copySchoolCode}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy school code"
                >
                  {codeCopied ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-white/80" />
                  )}
                </button>
              </div>
              <p className="text-white/60 text-xs mt-3">Share this code with staff and students</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Access Admin Dashboard</span>
                </div>
              </button>
              
              <Link
                href="/register"
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm group w-full"
              >
                <Users className="w-4 h-4" />
                <span>Invite Users</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile intro screen component
  if (showMobileIntro && typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        {/* Ultra-modern animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-fuchsia-900/50"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          </div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float-delayed"></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          {/* Mobile header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 p-1 animate-spin-slow">
                <div className="bg-black rounded-full w-full h-full"></div>
              </div>
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full shadow-2xl">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-3 tracking-tight">
              CATALYST
            </h1>
            <h2 className="text-xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent mb-2">
              INSTITUTIONAL REGISTRATION
            </h2>
            <p className="text-violet-300/60 text-sm uppercase tracking-wider">
              Professional • Secure • Efficient
            </p>
          </div>

          {/* Enhanced mobile feature cards */}
          <div className="w-full max-w-sm mb-8">
            <div className="relative h-[450px]">
              {featureCards.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 transform transition-all duration-2000 ease-in-out ${
                    index === currentFeatureIndex 
                      ? 'translate-x-0 opacity-100 scale-100 rotate-0' 
                      : index < currentFeatureIndex
                      ? '-translate-x-full opacity-0 scale-98 -rotate-1'
                      : 'translate-x-full opacity-0 scale-98 rotate-1'
                  }`}
                >
                  <div className="h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 rounded-2xl border border-violet-500/30 backdrop-blur-xl"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-black/50 to-transparent rounded-2xl"></div>
                    
                    <div className="relative z-10 p-6 h-full flex flex-col text-center">
                      <div className="relative mb-6 flex justify-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-md opacity-50 animate-pulse"></div>
                        <div className={`relative inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-xl shadow-2xl`}>
                          <feature.icon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-violet-200/80 text-base leading-relaxed mb-6 flex-grow">
                        {feature.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-violet-900/30 to-transparent border border-violet-500/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">500+</div>
                          <div className="text-violet-300/60 text-xs uppercase tracking-wider">Schools</div>
                        </div>
                        <div className="bg-gradient-to-br from-fuchsia-900/30 to-transparent border border-fuchsia-500/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-2xl font-black bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">50K+</div>
                          <div className="text-fuchsia-300/60 text-xs uppercase tracking-wider">Students</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced mobile indicators */}
            <div className="flex justify-center space-x-3 mt-6">
              {featureCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeatureIndex(index)}
                  className={`relative transition-all duration-500 ${
                    index === currentFeatureIndex
                      ? 'w-8 h-2'
                      : 'w-2 h-2'
                  }`}
                >
                  <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    index === currentFeatureIndex
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/50'
                      : 'bg-violet-500/30 hover:bg-violet-500/50'
                  }`} />
                  {index === currentFeatureIndex && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse opacity-50" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={() => setShowMobileIntro(false)}
            className="w-full max-w-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-300 transform hover:scale-105"
          >
            Continue to Registration
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Ultra-modern animated background */}
      <div className="absolute inset-0">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-fuchsia-900/50"></div>
        
        {/* Dynamic grid pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        </div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-fuchsia-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
        
        {/* Animated light beams */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-violet-500/50 via-transparent to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-fuchsia-500/30 via-transparent to-transparent animate-pulse animation-delay-1000"></div>
        
        {/* Holographic orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float-delayed"></div>
      </div>

      <div className="relative z-10 h-screen flex overflow-hidden">
        {/* Left side - Enhanced showcase */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 p-8 items-center justify-center relative">
          {/* Enhanced holographic border effects */}
          <div className="absolute inset-2 border border-violet-500/40 rounded-3xl animate-pulse"></div>
          <div className="absolute inset-3 border border-fuchsia-500/30 rounded-2xl"></div>
          <div className="absolute inset-4 border border-purple-500/20 rounded-xl"></div>
          
          {/* Floating particles */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-violet-400 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-20 right-16 w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-ping opacity-40"></div>
          <div className="absolute bottom-16 left-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-50"></div>
          
          <div className="w-full max-w-lg relative">
            {/* Futuristic logo */}
            <div className="mb-6 text-center relative">
              <div className="relative inline-block">
                {/* Glowing ring effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 p-1 animate-spin-slow">
                  <div className="bg-black rounded-full w-full h-full"></div>
                </div>
                <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full shadow-2xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent mt-4 mb-2 tracking-tight">
                CATALYST
              </h1>
              <div className="space-y-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent tracking-wide">
                  INSTITUTIONAL REGISTRATION
                </h2>
                <p className="text-violet-300/60 text-sm font-light tracking-wider uppercase">
                  Professional • Secure • Efficient
                </p>
              </div>
            </div>

            {/* Enhanced feature showcase */}
            <div className="relative h-[400px]">
              {featureCards.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 transform transition-all duration-2000 ease-in-out ${
                    index === currentFeatureIndex 
                      ? 'translate-y-0 opacity-100 scale-100 rotate-0' 
                      : index === (currentFeatureIndex - 1 + featureCards.length) % featureCards.length
                      ? '-translate-y-full opacity-0 scale-98 -rotate-0.5'
                      : 'translate-y-full opacity-0 scale-98 rotate-0.5'
                  }`}
                >
                  <div className="h-full relative">
                    {/* Holographic card effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 rounded-3xl border border-violet-500/30 backdrop-blur-xl"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-black/50 to-transparent rounded-3xl"></div>
                    
                    <div className="relative z-10 p-5 h-full flex flex-col">
                      {/* Floating icon */}
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-md opacity-50 animate-pulse"></div>
                        <div className={`relative inline-flex p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-2xl`}>
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      {/* Content - Fixed text overflow */}
                      <h3 className="text-lg font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent mb-2 line-clamp-2">
                        {feature.title}
                      </h3>
                      <p className="text-violet-200/80 text-sm leading-relaxed mb-3 flex-grow line-clamp-3 overflow-hidden">
                        {feature.description}
                      </p>
                      
                      {/* Futuristic progress bars - Compact */}
                      <div className="space-y-1.5 mb-3">
                        {[
                          { label: 'Performance', value: 95 },
                          { label: 'Innovation', value: 88 },
                          { label: 'Impact', value: 92 }
                        ].map((metric, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between text-xs text-violet-300">
                              <span className="truncate">{metric.label}</span>
                              <span>{metric.value}%</span>
                            </div>
                            <div className="h-0.5 bg-violet-900/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-2000"
                                style={{ width: `${metric.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Holographic stats - Compact */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-violet-900/30 to-transparent border border-violet-500/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">500+</div>
                          <div className="text-violet-300/60 text-xs uppercase tracking-wider">Schools</div>
                        </div>
                        <div className="bg-gradient-to-br from-fuchsia-900/30 to-transparent border border-fuchsia-500/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-2xl font-black bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">50K+</div>
                          <div className="text-fuchsia-300/60 text-xs uppercase tracking-wider">Students</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Futuristic indicators */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {featureCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeatureIndex(index)}
                    className={`relative transition-all duration-500 ${
                      index === currentFeatureIndex 
                        ? 'w-8 h-2' 
                        : 'w-2 h-2'
                    }`}
                  >
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                      index === currentFeatureIndex
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/50'
                        : 'bg-violet-500/30 hover:bg-violet-500/50'
                    }`} />
                    {index === currentFeatureIndex && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Futuristic form */}
        <div className="flex-1 flex items-start justify-center p-3 pt-6 relative overflow-y-auto lg:items-center lg:pt-3 lg:p-4">
        {/* Form container with holographic effect */}
        <div className="w-full max-w-2xl lg:max-w-3xl relative my-2 lg:my-4">
        {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-lg opacity-20"></div>
            
            <div className="relative bg-black/80 backdrop-blur-2xl rounded-3xl border border-violet-500/30 shadow-2xl overflow-hidden">
              {/* Inner holographic border */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-fuchsia-900/20 rounded-3xl"></div>
              
              <div className="relative z-10 p-6">

                {/* Enterprise Progress Steps */}
                <div className="mb-6">
                  {/* Mobile-optimized progress bar */}
                  <div className="block lg:hidden mb-4">
                    {/* Current step indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur-md opacity-50 animate-pulse"></div>
                          <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg shadow-lg">
                            {React.createElement(steps[currentStep - 1].icon, { className: "w-4 h-4 text-white" })}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            {steps[currentStep - 1].title}
                          </h3>
                          <p className="text-violet-300/60 text-xs">
                            Step {currentStep} of {steps.length}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-violet-300/60 mb-1">Progress</div>
                        <div className="text-sm font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                          {Math.round((currentStep / steps.length) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="relative">
                      <div className="h-2 bg-violet-900/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${(currentStep / steps.length) * 100}%` }}
                        />
                      </div>
                      {/* Animated glow */}
                      <div 
                        className="absolute top-0 h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full opacity-50 blur-sm transition-all duration-700"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                      />
                    </div>
                    
                    {/* Step dots */}
                    <div className="flex justify-between mt-2 px-1">
                      {steps.map((step, index) => (
                        <div 
                          key={step.id}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            currentStep > step.id 
                              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' 
                              : currentStep === step.id
                              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 scale-150'
                              : 'bg-violet-900/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Desktop progress steps */}
                  <div className="hidden lg:block">
                    <div className="flex items-center justify-center space-x-4 mb-4 max-w-md mx-auto">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div className="relative">
                            {/* Active step glow */}
                            {currentStep === step.id && (
                              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                            )}
                            
                            {/* Step circle */}
                            <div 
                              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
                                currentStep >= step.id 
                                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/50 scale-110' 
                                  : 'bg-violet-900/30 text-violet-400 border-2 border-violet-500/30'
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
                            <div className="w-8 mx-2">
                              <div className="h-0.5 bg-violet-900/30 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ${
                                    currentStep > step.id ? 'w-full' : 'w-0'
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
                      <h3 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-1">
                        {steps[currentStep - 1].title}
                      </h3>
                      <p className="text-violet-300/60 text-xs uppercase tracking-wider">
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                  </div>
                </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Futuristic Terms & Conditions */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Holographic card */}
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 rounded-2xl border border-violet-500/30 backdrop-blur-xl"></div>
                      <div className="relative z-10 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-sm opacity-50"></div>
                              <div className="relative p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl">
                                <ScrollText className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                              Terms & Conditions
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg shadow-violet-500/25 text-sm"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Read Full</span>
                          </button>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-violet-200 mb-3 text-sm">By registering your school, you agree to:</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-violet-300 text-xs">
                              <Shield className="w-3 h-3 text-violet-400" />
                              <span>Provide accurate school information</span>
                            </div>
                            <div className="flex items-center gap-2 text-violet-300 text-xs">
                              <Lock className="w-3 h-3 text-violet-400" />
                              <span>Ensure data privacy & student protection</span>
                            </div>
                            <div className="flex items-center gap-2 text-violet-300 text-xs">
                              <GraduationCap className="w-3 h-3 text-violet-400" />
                              <span>Use for educational purposes only</span>
                            </div>
                            <div className="flex items-center gap-2 text-violet-300 text-xs">
                              <CheckCircle className="w-3 h-3 text-violet-400" />
                              <span>7-day trial with 100 member limit</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            {...register('termsAccepted')}
                            type="checkbox"
                            id="termsAccepted"
                            className="mt-1 w-4 h-4 text-violet-600 bg-violet-900/20 border-violet-500/30 rounded focus:ring-2 focus:ring-violet-500 focus:ring-offset-0"
                          />
                          <label htmlFor="termsAccepted" className="text-violet-200 text-sm leading-relaxed">
                            I have read and agree to the{' '}
                            <button
                              type="button"
                              onClick={() => setShowTermsModal(true)}
                              className="text-violet-400 hover:text-violet-300 underline font-medium"
                            >
                              Terms & Conditions
                            </button>
                            {' '}and confirm that I am authorized to register this school.
                          </label>
                        </div>
                        {errors.termsAccepted && (
                          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 backdrop-blur-xl mt-3">
                            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                              <XCircle className="w-4 h-4" />
                              {errors.termsAccepted?.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: School Information - Liquid Glass Design */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      {/* School Name Field */}
                      <div>
                        <label className="text-sm font-medium text-violet-300 mb-2 block">School Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-violet-400 group-focus-within:text-fuchsia-400 transition-colors" />
                          </div>
                          <input
                            {...register('schoolName')}
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-violet-900/20 backdrop-blur-xl border border-violet-500/30 rounded-xl text-violet-100 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all duration-200"
                            placeholder="Enter your school name"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                        </div>
                        {errors.schoolName && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {errors.schoolName?.message}
                          </p>
                        )}
                      </div>

                      {/* School Address Field */}
                      <div>
                        <label className="text-sm font-medium text-violet-300 mb-2 block">School Address</label>
                        <div className="relative group">
                          <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                            <MapPin className="h-4 w-4 text-violet-400 group-focus-within:text-fuchsia-400 transition-colors" />
                          </div>
                          <textarea
                            {...register('address')}
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 bg-violet-900/20 backdrop-blur-xl border border-violet-500/30 rounded-xl text-violet-100 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all duration-200 resize-none"
                            placeholder="Enter complete school address"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                        </div>
                        {errors.address && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {errors.address?.message}
                          </p>
                        )}
                      </div>

                      {/* Phone and Email Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Phone Field */}
                        <div>
                          <label className="text-sm font-medium text-violet-300 mb-2 block">Phone Number</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-4 w-4 text-violet-400 group-focus-within:text-fuchsia-400 transition-colors" />
                            </div>
                            <input
                              {...register('phone')}
                              type="tel"
                              className="w-full pl-10 pr-4 py-3 bg-violet-900/20 backdrop-blur-xl border border-violet-500/30 rounded-xl text-violet-100 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all duration-200"
                              placeholder="(555) 123-4567"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                          </div>
                          {errors.phone && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.phone?.message}
                            </p>
                          )}
                        </div>

                        {/* Email Field */}
                        <div>
                          <label className="text-sm font-medium text-violet-300 mb-2 block">School Email</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-4 w-4 text-violet-400 group-focus-within:text-fuchsia-400 transition-colors" />
                            </div>
                            <input
                              {...register('schoolEmail')}
                              type="email"
                              className="w-full pl-10 pr-4 py-3 bg-violet-900/20 backdrop-blur-xl border border-violet-500/30 rounded-xl text-violet-100 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all duration-200"
                              placeholder="info@school.edu"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                          </div>
                          {errors.schoolEmail && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.schoolEmail?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Administrator Account - Liquid Glass Design */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">First Name</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                              {...register('adminFirstName')}
                              type="text"
                              className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-xl border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                              placeholder="John"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                          </div>
                          {errors.adminFirstName && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.adminFirstName?.message}
                            </p>
                          )}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Last Name</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                              {...register('adminLastName')}
                              type="text"
                              className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-xl border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Doe"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                          </div>
                          {errors.adminLastName && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              {errors.adminLastName?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Admin Email */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Administrator Email</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            {...register('adminEmail')}
                            type="email"
                            className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-xl border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                            placeholder="admin@school.edu"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                        </div>
                        {errors.adminEmail && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {errors.adminEmail?.message}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            className="w-full pl-10 pr-12 py-3 bg-white/70 backdrop-blur-xl border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                            placeholder="Create a secure password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-500 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl"></div>
                        </div>
                        {errors.password && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {errors.password?.message}
                          </p>
                        )}
                        
                        {/* Password strength indicator */}
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-1">
                            {[1,2,3,4].map((level) => (
                              <div
                                key={level}
                                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                                  watchedFields.password && watchedFields.password.length >= level * 3
                                    ? level === 1 ? 'bg-red-500'
                                    : level === 2 ? 'bg-yellow-500'
                                    : level === 3 ? 'bg-blue-500'
                                    : 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
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

                {/* Step 4: Review - Liquid Glass Design */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {/* School Information Review */}
                      <div className="backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/60 rounded-2xl p-6 border border-white/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">School Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/50 rounded-lg p-3">
                            <span className="text-xs text-gray-500 block mb-1">School Name</span>
                            <p className="text-gray-800 font-medium">{watchedFields.schoolName || '-'}</p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-3">
                            <span className="text-xs text-gray-500 block mb-1">Email</span>
                            <p className="text-gray-800 font-medium text-sm">{watchedFields.schoolEmail || '-'}</p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-3">
                            <span className="text-xs text-gray-500 block mb-1">Phone</span>
                            <p className="text-gray-800 font-medium">{watchedFields.phone || '-'}</p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-3 md:col-span-2">
                            <span className="text-xs text-gray-500 block mb-1">Address</span>
                            <p className="text-gray-800 font-medium">{watchedFields.address || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Administrator Review */}
                      <div className="backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/60 rounded-2xl p-6 border border-white/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Administrator Account</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/50 rounded-lg p-3">
                            <span className="text-xs text-gray-500 block mb-1">Full Name</span>
                            <p className="text-gray-800 font-medium">
                              {watchedFields.adminFirstName || '-'} {watchedFields.adminLastName || '-'}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-3">
                            <span className="text-xs text-gray-500 block mb-1">Email</span>
                            <p className="text-gray-800 font-medium text-sm">{watchedFields.adminEmail || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm text-center flex items-center justify-center gap-2">
                          <XCircle className="w-5 h-5" />
                          {error}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation - Enhanced with liquid glass design */}
                <div className="mt-6 xl:mt-8 flex justify-between items-center">
                  <div className="flex gap-2 xl:gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center gap-2 px-4 xl:px-5 py-2.5 xl:py-3 bg-white/70 backdrop-blur-xl border-2 border-gray-200 rounded-lg xl:rounded-xl text-gray-700 font-medium hover:bg-white/90 hover:shadow-lg transition-all duration-200 text-sm xl:text-base"
                      >
                        <ArrowLeft className="w-4 h-4 xl:w-5 xl:h-5" />
                        <span>Previous</span>
                      </button>
                    )}
                  </div>

                  <div>
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-2 px-5 xl:px-6 py-2.5 xl:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg xl:rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm xl:text-base"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4 xl:w-5 xl:h-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 xl:px-6 py-2.5 xl:py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg xl:rounded-xl shadow-lg hover:from-emerald-700 hover:to-green-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm xl:text-base"
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