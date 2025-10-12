'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  CreditCard,
  Check,
  Sparkles,
  Zap,
  Users,
  HelpCircle,
  ChevronRight,
  Shield,
  Award,
  Brain,
  Heart,
  FileText,
  UserCheck,
  Building,
  Info,
  ArrowRight,
  Star,
  Rocket,
  School,
  TreePine,
  Crown
} from 'lucide-react'

interface PlanFeature {
  text: string
  tooltip?: string
  isHighlight?: boolean
  icon?: 'ai' | 'wellness' | 'feedback' | 'summary' | 'check'
}

interface Plan {
  id: string
  name: string
  icon: string
  price: {
    monthly: number | 'Free'
    annually: number | 'Free'
  }
  currency: string
  perUnit?: string
  subheading: string
  userLimits?: {
    students: string
    teachers: string
    parents: string
  }
  features: PlanFeature[]
  ctaText: string
  ctaVariant: 'outline' | 'default' | 'gradient'
  badge?: string
  isRecommended?: boolean
  headerColor: string
}

function SubscriptionContent() {
  const router = useRouter()
  const { addToast } = useToast()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)

  // Client-side hydration and responsive handling
  useEffect(() => {
    setIsClient(true)
    setViewportWidth(window.innerWidth)
    
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-select recommended plan after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedPlan && isClient) {
        setHoveredPlan('ai-pro')
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [selectedPlan, isClient])

  // Optimized animation variants
  const isMobile = viewportWidth < 1024

  const plans: Plan[] = [
    {
      id: 'core',
      name: 'Catalyst Core',
      icon: '🌱',
      price: { monthly: 'Free', annually: 'Free' },
      currency: '₹',
      subheading: 'A no-risk pilot program to explore core features with a limited group.',
      userLimits: {
        students: 'Up to 70 Student Accounts',
        teachers: 'Up to 6 Teacher Accounts',
        parents: 'Up to 70 Parent Accounts'
      },
      features: [
        { text: 'Admin Dashboard (Basic)', icon: 'check' },
        { text: 'Teacher Dashboard', icon: 'check' },
        { text: 'Student & Parent Dashboards', icon: 'check' },
        { text: 'Classroom & Assignment Manager', icon: 'check' },
        { text: 'Basic Communication Tools', icon: 'check' },
        { text: 'Community Support', icon: 'check' }
      ],
      ctaText: 'Start Pilot',
      ctaVariant: 'outline',
      headerColor: 'bg-gray-100'
    },
    {
      id: 'standard',
      name: 'Catalyst Standard',
      icon: '🏫',
      price: { monthly: 18, annually: 15 },
      currency: '₹',
      perUnit: 'per student / month',
      subheading: 'The complete solution for institutions ready to digitize their entire school community.',
      features: [
        { text: 'All features in Catalyst Core, plus:', icon: 'check' },
        { text: 'Full School & User Management', icon: 'check' },
        { text: 'Unlimited Teachers & Parents', icon: 'check' },
        { text: 'Advanced Examination Module', icon: 'check' },
        { text: 'Custom Rubric Grading System', icon: 'check' },
        { text: 'Performance Analytics & Reports', icon: 'check' },
        { text: 'Priority Email & Chat Support', icon: 'check' }
      ],
      ctaText: 'Choose Standard',
      ctaVariant: 'default',
      headerColor: 'bg-gradient-to-r from-blue-500 to-purple-500'
    },
    {
      id: 'ai-pro',
      name: 'Catalyst AI Pro',
      icon: '🚀',
      price: { monthly: 30, annually: 25 },
      currency: '₹',
      perUnit: 'per student / month',
      subheading: 'The ultimate package to leverage AI for personalized learning and proactive support.',
      badge: 'RECOMMENDED',
      isRecommended: true,
      features: [
        { text: 'All features in Catalyst Standard, plus:', icon: 'check' },
        { text: 'AI-Powered Insights for Admins & Teachers', icon: 'ai', tooltip: 'Get predictive analytics and actionable insights powered by advanced AI', isHighlight: true },
        { text: 'AI-Generated Feedback on Assignments', icon: 'feedback', tooltip: 'Automatic personalized feedback for each student submission', isHighlight: true },
        { text: 'Personalized Learning Suggestions', icon: 'ai', isHighlight: true },
        { text: 'AI Wellness Tracking for Focus & Motivation', icon: 'wellness', tooltip: 'Track student well-being and mental health with AI insights', isHighlight: true },
        { text: 'AI-Summarized Communications', icon: 'summary', isHighlight: true },
        { text: 'Dedicated Account Manager & Onboarding Support', icon: 'check' }
      ],
      ctaText: 'Choose AI Pro',
      ctaVariant: 'gradient',
      headerColor: 'bg-gradient-to-r from-purple-600 to-blue-600'
    }
  ]

  const handlePlanSelect = async (planId: string) => {
    // Optimistic UI update
    setSelectedPlan(planId)
    setIsLoading(true)
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    // Optimized API simulation with better UX
    const plan = plans.find(p => p.id === planId)
    
    // Show immediate feedback
    addToast({
      type: 'info',
      title: 'Processing Selection',
      description: `Preparing ${plan?.name} checkout...`
    })
    
    try {
      // Simulate API call with realistic timing
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      addToast({
        type: 'success',
        title: 'Plan Selected Successfully',
        description: `${plan?.name} is ready for checkout. Redirecting...`
      })
      
      setIsLoading(false)
      
      // Preload checkout page for better performance
      router.prefetch(`/admin/checkout?plan=${planId}&billing=${billingCycle}`)
      
      // Navigate with transition
      setTimeout(() => {
        router.push(`/admin/checkout?plan=${planId}&billing=${billingCycle}`)
      }, 1500)
      
    } catch (error) {
      setIsLoading(false)
      setSelectedPlan(null)
      addToast({
        type: 'error',
        title: 'Selection Failed',
        description: 'Please try again. If the issue persists, contact support.'
      })
    }
  }

  // Optimized billing cycle handler
  const handleBillingCycleChange = (cycle: 'monthly' | 'annually') => {
    setBillingCycle(cycle)
    
    // Analytics tracking (placeholder)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // gtag('event', 'billing_cycle_change', { cycle })
    }
  }

  const getFeatureIcon = (icon?: string) => {
    switch(icon) {
      case 'ai':
        return <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
      case 'wellness':
        return <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
      case 'feedback':
        return <Brain className="h-4 w-4 text-blue-500 flex-shrink-0" />
      case 'summary':
        return <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
      default:
        return <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
    }
  }

  const calculatePrice = (price: number | 'Free') => {
    if (price === 'Free') return 'Free'
    return billingCycle === 'annually' ? price : price
  }

  const calculateAnnualSavings = (monthlyPrice: number | 'Free', annualPrice: number | 'Free') => {
    if (monthlyPrice === 'Free' || annualPrice === 'Free') return 0
    return Math.round(((monthlyPrice * 12) - (annualPrice * 12)) / (monthlyPrice * 12) * 100)
  }

  // Prevent flash of incorrect content
  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading Enterprise Plans...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 opacity-30">
        {/* Primary orbs with improved performance */}
        <div 
          className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full mix-blend-multiply filter blur-3xl"
          style={{
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '0s'
          }}
        ></div>
        <div 
          className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-3xl"
          style={{
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute -bottom-8 left-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Additional ambient lighting */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: isMobile ? 8 : 15 }, (_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-white rounded-full opacity-20`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `floatParticle ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -20px) rotate(90deg); }
          50% { transform: translate(-20px, 20px) rotate(180deg); }
          75% { transform: translate(20px, 20px) rotate(270deg); }
        }
        
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) opacity(0.1); }
          50% { transform: translateY(-20px) opacity(0.3); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <div className="relative z-10">
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`${isMobile ? 'py-3' : 'py-6'}`}>
              {/* Compact Refined Layout */}
              <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-center justify-between'}`}>
                
                {/* Refined Header */}
                <div className={`flex items-center ${isMobile ? 'justify-center text-center' : 'space-x-4'}`}>
                  <div className="relative">
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg`}>
                      <CreditCard className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                    </div>
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl blur opacity-20"></div>
                  </div>
                  
                  <div className={`${isMobile ? 'ml-3' : ''}`}>
                    <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent leading-tight`}>
                      {isMobile ? 'Plans & Billing' : 'Enterprise Plans & Billing'}
                    </h1>
                    <p className={`${isMobile ? 'text-xs mt-0.5' : 'text-sm mt-1'} text-gray-400 font-medium`}>
                      {isMobile ? 'Choose your perfect plan' : 'Choose the perfect plan for your institution'}
                    </p>
                  </div>
                </div>

                {/* Compact Trust Indicators */}
                <div className={`flex items-center ${isMobile ? 'justify-center space-x-4' : 'space-x-6'} text-xs`}>
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <Shield className="h-3 w-3" />
                    <span className="font-medium">Secure</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-400">
                    <Award className="h-3 w-3" />
                    <span className="font-medium">SOC 2</span>
                  </div>
                  <div className="flex items-center space-x-1 text-purple-400">
                    <Check className="h-3 w-3" />
                    <span className="font-medium">FERPA</span>
                  </div>
                </div>
                
                {/* Refined Billing Toggle */}
                <div className="relative">
                  {isMobile ? (
                    /* Compact Mobile Toggle */
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl p-0.5 border border-white/20 shadow-lg">
                      <div className="relative flex">
                        <div className={`absolute inset-y-0.5 transition-all duration-300 ease-out rounded-lg bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-md ${
                          billingCycle === 'annually' ? 'left-1/2 right-0.5' : 'left-0.5 right-1/2'
                        }`}></div>
                        
                        <button
                          onClick={() => handleBillingCycleChange('monthly')}
                          className={`relative z-10 flex-1 py-2.5 px-3 rounded-lg font-semibold text-center transition-all duration-200 touch-manipulation ${
                            billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'
                          }`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <span className="text-xs">Monthly</span>
                        </button>
                        
                        <button
                          onClick={() => handleBillingCycleChange('annually')}
                          className={`relative z-10 flex-1 py-2.5 px-3 rounded-lg font-semibold text-center transition-all duration-200 touch-manipulation ${
                            billingCycle === 'annually' ? 'text-white' : 'text-gray-400'
                          }`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <span className="text-xs">Annual</span>
                          <Badge className="bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">
                            15%
                          </Badge>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Refined Desktop Toggle */
                    <div className="flex items-center bg-white/5 backdrop-blur-xl rounded-xl p-1 border border-white/10 shadow-lg">
                      <button
                        onClick={() => handleBillingCycleChange('monthly')}
                        className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                          billingCycle === 'monthly' 
                            ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-md' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => handleBillingCycleChange('annually')}
                        className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                          billingCycle === 'annually' 
                            ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-md' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Annual
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          Save 15%
                        </Badge>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 max-w-6xl mx-auto ${isMobile ? 'px-3 py-6' : 'px-4 sm:px-6 lg:px-8 py-12'}`}>
        {/* Refined Plan Cards */}
        <div className={`${isMobile ? 'mb-8' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12'}`}>
          {isMobile ? (
            /* Mobile: Horizontal 3D Scrolling */
            <div className="relative overflow-hidden pb-8">
              <div 
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  perspective: '1000px'
                }}
              >
                {plans.map((plan, index) => {
            const isCore = plan.id === 'core'
            const isStandard = plan.id === 'standard'
            const isAiPro = plan.id === 'ai-pro'
            const savings = calculateAnnualSavings(plan.price.monthly, plan.price.annually)
            
                  return (
                    <Card
                      key={plan.id}
                      style={{
                        minWidth: '85vw',
                        maxWidth: '85vw',
                        transformStyle: 'preserve-3d',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 will-change-transform snap-center active:scale-98 touch-manipulation ${
                  isAiPro 
                    ? `bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 border border-purple-400/60 shadow-xl hover:shadow-purple-500/20 hover:border-purple-300/80` 
                    : isStandard
                    ? `bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-400/40 hover:border-blue-400/70 hover:shadow-blue-500/15`
                    : `bg-gradient-to-br from-gray-900/20 via-slate-900/20 to-gray-800/20 border border-gray-600/40 hover:border-gray-400/70 hover:shadow-gray-500/15`
                } backdrop-blur-xl ${
                  selectedPlan === plan.id ? 'ring-2 ring-purple-400/70 shadow-purple-500/40' : ''
                } ${
                  hoveredPlan === plan.id ? 'shadow-xl' : 'shadow-md'
                } rounded-xl`}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                onClick={() => !isLoading && handlePlanSelect(plan.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    !isLoading && handlePlanSelect(plan.id)
                  }
                }}
              >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-3">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>

                {/* Premium Badge */}
                {plan.badge && (
                  <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} z-20`}>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 font-bold text-xs shadow-md">
                      <Star className="h-3 w-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                {/* Compact Card Header */}
                <CardHeader className={`relative ${isMobile ? 'pb-3 pt-4' : 'pb-4 pt-6'} text-white`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`${isMobile ? 'text-2xl' : 'text-3xl'}`}>{plan.icon}</span>
                    <div className="flex-1">
                      <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white leading-tight`}>
                        {plan.name}
                      </CardTitle>
                      <CardDescription className={`${isMobile ? 'text-xs mt-1' : 'text-sm mt-1'} text-white/80`}>
                        {plan.subheading}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Compact Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline">
                      {plan.price[billingCycle] !== 'Free' && (
                        <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-white/80`}>
                          {plan.currency}
                        </span>
                      )}
                      <span className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-black bg-gradient-to-r ${
                        isAiPro 
                          ? 'from-white via-purple-200 to-blue-200 bg-clip-text text-transparent' 
                          : isStandard 
                          ? 'from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent'
                          : 'from-white via-gray-100 to-gray-200 bg-clip-text text-transparent'
                      } leading-tight`}>
                        {calculatePrice(plan.price[billingCycle])}
                      </span>
                      {plan.perUnit && (
                        <span className={`ml-2 ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-white/70`}>
                          {plan.perUnit}
                        </span>
                      )}
                    </div>
                    
                    {/* Compact Savings Badge */}
                    {billingCycle === 'annually' && savings > 0 && (
                      <div className="mt-2">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 text-xs font-bold">
                          💰 Save {savings}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className={`${isMobile ? 'pt-2 pb-4' : 'pt-4 pb-6'}`}>
                  {/* Refined User Limits */}
                  {plan.userLimits && (
                    <div className={`${isMobile ? 'mb-3 p-3' : 'mb-4 p-3'} bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm`}>
                      <h4 className={`text-xs font-semibold text-white uppercase tracking-wider ${isMobile ? 'mb-2' : 'mb-3'}`}>User Limits</h4>
                      <div className={`${isMobile ? 'space-y-2' : 'space-y-2'}`}>
                        <div className="flex items-center text-sm text-white/90">
                          <Users className="h-3 w-3 mr-2 text-purple-400" />
                          <span className="font-medium text-xs">{plan.userLimits.students}</span>
                        </div>
                        <div className="flex items-center text-sm text-white/90">
                          <UserCheck className="h-3 w-3 mr-2 text-blue-400" />
                          <span className="font-medium text-xs">{plan.userLimits.teachers}</span>
                        </div>
                        <div className="flex items-center text-sm text-white/90">
                          <Users className="h-3 w-3 mr-2 text-emerald-400" />
                          <span className="font-medium text-xs">{plan.userLimits.parents}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Compact Features */}
                  <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Features</h4>
                    <ul className={`${isMobile ? 'space-y-2' : 'space-y-2'}`}>
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            {getFeatureIcon(feature.icon)}
                          </div>
                          <span className={`ml-3 text-xs ${
                            feature.isHighlight 
                              ? 'font-semibold text-white' 
                              : 'font-medium text-white/90'
                          } leading-relaxed`}>
                            {feature.text}
                            {feature.tooltip && (
                              <button className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full hover:bg-white/10 transition-colors">
                                <Info className="h-2 w-2 text-purple-400" />
                                <span className="sr-only">More info</span>
                              </button>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Refined CTA Button */}
                  <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlanSelect(plan.id)
                      }}
                      disabled={isLoading}
                      className={`relative w-full ${isMobile ? 'py-3' : 'py-3'} font-semibold ${isMobile ? 'text-sm' : 'text-sm'} transition-all duration-200 ${
                        plan.ctaVariant === 'gradient'
                          ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl' 
                          : plan.ctaVariant === 'default'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-800 hover:bg-white hover:border-purple-300 hover:text-purple-700 shadow-md hover:shadow-lg'
                      } ${selectedPlan === plan.id ? 'ring-2 ring-purple-400/50' : ''} ${
                        isLoading && selectedPlan === plan.id ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-102'
                      } rounded-lg`}
                    >
                      <span className="flex items-center justify-center">
                        {isLoading && selectedPlan === plan.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>{plan.ctaText}</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </span>
                    </Button>
                    
                    {/* Selection Indicator */}
                    {selectedPlan === plan.id && (
                      <div className="mt-2 flex items-center justify-center text-xs text-emerald-400">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                        Selected
                      </div>
                    )}
                  </div>
                </CardContent>
                    </Card>
                  )
                })}
              </div>
              {/* Scroll Indicator Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {plans.map((plan, idx) => (
                  <div
                    key={plan.id}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: idx === 1 ? '24px' : '6px',
                      backgroundColor: idx === 1 ? 'rgb(168, 85, 247)' : 'rgba(255, 255, 255, 0.3)'
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Desktop: Grid Layout */
            <>
              {plans.map((plan) => {
                const isCore = plan.id === 'core'
                const isStandard = plan.id === 'standard'
                const isAiPro = plan.id === 'ai-pro'
                const savings = calculateAnnualSavings(plan.price.monthly, plan.price.annually)
                
                return (
                  <Card 
                    key={plan.id}
                    className={`group relative overflow-hidden cursor-pointer transition-all duration-300 will-change-transform ${
                      isAiPro 
                        ? `bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 border border-purple-400/60 shadow-xl hover:shadow-purple-500/20 hover:border-purple-300/80` 
                        : isStandard
                        ? `bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-400/40 hover:border-blue-400/70 hover:shadow-blue-500/15`
                        : `bg-gradient-to-br from-gray-900/20 via-slate-900/20 to-gray-800/20 border border-gray-600/40 hover:border-gray-400/70 hover:shadow-gray-500/15`
                    } backdrop-blur-xl ${
                      selectedPlan === plan.id ? 'ring-2 ring-purple-400/70 shadow-purple-500/40' : ''
                    } ${
                      hoveredPlan === plan.id ? 'shadow-xl' : 'shadow-md'
                    } hover:scale-102 rounded-xl`}
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    onClick={() => !isLoading && handlePlanSelect(plan.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        !isLoading && handlePlanSelect(plan.id)
                      }
                    }}
                  >
                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 opacity-3">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                      }}></div>
                    </div>

                    {/* Premium Badge */}
                    {plan.badge && (
                      <div className="absolute top-4 right-4 z-20">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 font-bold text-xs shadow-md">
                          <Star className="h-3 w-3 mr-1" />
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Compact Card Header */}
                    <CardHeader className="relative pb-4 pt-6 text-white">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-3xl">{plan.icon}</span>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-white leading-tight">
                            {plan.name}
                          </CardTitle>
                          <CardDescription className="text-sm mt-1 text-white/80">
                            {plan.subheading}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Compact Price */}
                      <div className="mb-3">
                        <div className="flex items-baseline">
                          {plan.price[billingCycle] !== 'Free' && (
                            <span className="text-lg font-medium text-white/80">
                              {plan.currency}
                            </span>
                          )}
                          <span className={`text-4xl font-black bg-gradient-to-r ${
                            isAiPro 
                              ? 'from-white via-purple-200 to-blue-200 bg-clip-text text-transparent' 
                              : isStandard 
                              ? 'from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent'
                              : 'from-white via-gray-100 to-gray-200 bg-clip-text text-transparent'
                          } leading-tight`}>
                            {calculatePrice(plan.price[billingCycle])}
                          </span>
                          {plan.perUnit && (
                            <span className="ml-2 text-sm font-medium text-white/70">
                              {plan.perUnit}
                            </span>
                          )}
                        </div>
                        
                        {/* Compact Savings Badge */}
                        {billingCycle === 'annually' && savings > 0 && (
                          <div className="mt-2">
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 text-xs font-bold">
                              💰 Save {savings}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4 pb-6">
                      {/* Refined User Limits */}
                      {plan.userLimits && (
                        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">User Limits</h4>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-white/90">
                              <Users className="h-3 w-3 mr-2 text-purple-400" />
                              <span className="font-medium text-xs">{plan.userLimits.students}</span>
                            </div>
                            <div className="flex items-center text-sm text-white/90">
                              <UserCheck className="h-3 w-3 mr-2 text-blue-400" />
                              <span className="font-medium text-xs">{plan.userLimits.teachers}</span>
                            </div>
                            <div className="flex items-center text-sm text-white/90">
                              <Users className="h-3 w-3 mr-2 text-emerald-400" />
                              <span className="font-medium text-xs">{plan.userLimits.parents}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Compact Features */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Features</h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                {getFeatureIcon(feature.icon)}
                              </div>
                              <span className={`ml-3 text-xs ${
                                feature.isHighlight 
                                  ? 'font-semibold text-white' 
                                  : 'font-medium text-white/90'
                              } leading-relaxed`}>
                                {feature.text}
                                {feature.tooltip && (
                                  <button className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full hover:bg-white/10 transition-colors">
                                    <Info className="h-2 w-2 text-purple-400" />
                                    <span className="sr-only">More info</span>
                                  </button>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Refined CTA Button */}
                      <div className="mt-6">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlanSelect(plan.id)
                          }}
                          disabled={isLoading}
                          className={`relative w-full py-3 font-semibold text-sm transition-all duration-200 ${
                            plan.ctaVariant === 'gradient'
                              ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl' 
                              : plan.ctaVariant === 'default'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-800 hover:bg-white hover:border-purple-300 hover:text-purple-700 shadow-md hover:shadow-lg'
                          } ${selectedPlan === plan.id ? 'ring-2 ring-purple-400/50' : ''} ${
                            isLoading && selectedPlan === plan.id ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-102'
                          } rounded-lg`}
                        >
                          <span className="flex items-center justify-center">
                            {isLoading && selectedPlan === plan.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <span>{plan.ctaText}</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </span>
                        </Button>
                        
                        {/* Selection Indicator */}
                        {selectedPlan === plan.id && (
                          <div className="mt-2 flex items-center justify-center text-xs text-emerald-400">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                            Selected
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>

        {/* Compact Compare Link */}
        <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
          <button className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium text-sm px-6 py-3 rounded-xl inline-flex items-center transition-all duration-200 border border-white/20 hover:border-white/40 shadow-lg">
            <span className="text-gray-200">Compare all features</span>
            <ChevronRight className="ml-2 h-4 w-4 text-purple-400" />
          </button>
        </div>

        {/* Compact Enterprise Section */}
        <Card className={`relative bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white overflow-hidden border border-purple-500/30 shadow-lg ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-2xl"></div>
          </div>
          
          <CardContent className={`relative ${isMobile ? 'p-6' : 'p-8'}`}>
            <div className={`${isMobile ? 'text-center' : 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'}`}>
              <div>
                <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-3 mb-4`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent`}>
                    Enterprise Solutions
                  </h2>
                </div>
                <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-gray-300 mb-4`}>
                  Custom solutions for school districts and universities
                </p>
                <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-4'} mb-6`}>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                    <span className="text-xs text-gray-300">5,000+ students</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                    <span className="text-xs text-gray-300">Dedicated team</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                    <span className="text-xs text-gray-300">API access</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                    <span className="text-xs text-gray-300">On-premise</span>
                  </div>
                </div>
                <Button 
                  size={isMobile ? "sm" : "default"}
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                  onClick={() => router.push('/admin/enterprise-inquiry')}
                >
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {!isMobile && (
                <div className="relative">
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">50K+</div>
                        <div className="text-xs text-gray-400">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">500+</div>
                        <div className="text-xs text-gray-400">Schools</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">99.9%</div>
                        <div className="text-xs text-gray-400">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">24/7</div>
                        <div className="text-xs text-gray-400">Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compact Trust Signals */}
        <div className={`${isMobile ? 'mt-8' : 'mt-12'} text-center`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-200 mb-6`}>
            Trusted & Secure
          </h3>
          
          <div className={`${isMobile ? 'grid grid-cols-2 gap-4' : 'flex justify-center items-center space-x-8'} max-w-3xl mx-auto`}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
              <Shield className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm">FERPA</h4>
              <p className="text-gray-400 text-xs">Compliant</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
              <Award className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm">SOC 2</h4>
              <p className="text-gray-400 text-xs">Certified</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
              <Shield className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm">GDPR</h4>
              <p className="text-gray-400 text-xs">Ready</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
              <Check className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm">ISO 27001</h4>
              <p className="text-gray-400 text-xs">Certified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <ClientWrapper>
      <UnifiedAuthGuard requiredRole="admin">
        <SubscriptionContent />
      </UnifiedAuthGuard>
    </ClientWrapper>
  )
}
