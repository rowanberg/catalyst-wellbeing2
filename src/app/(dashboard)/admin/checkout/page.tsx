'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  CreditCard,
  Lock,
  ArrowLeft,
  Check,
  Shield,
  Info,
  Users,
  Calculator,
  Gift,
  School,
  Award,
  CheckCircle,
  Wallet
} from 'lucide-react'

// Razorpay Script Loader
declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'student-count' | 'checkout'>('student-count')
  const [studentCount, setStudentCount] = useState('')
  const [totalStudents, setTotalStudents] = useState(0)
  const [finalPrice, setFinalPrice] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const planId = searchParams.get('plan')
  const billingCycle = searchParams.get('billing')
  
  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Load Razorpay Script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      document.body.removeChild(script)
    }
  }, [])
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingEmail: '',
    gstNumber: ''
  })

  const planDetails = {
    'core': {
      name: 'Catalyst Core',
      price: 0,
      monthlyPrice: 0,
      annualPrice: 0,
      icon: '🌱',
      maxStudents: 70,
      description: 'Perfect for pilot programs'
    },
    'standard': {
      name: 'Catalyst Standard',
      price: billingCycle === 'annually' ? 15 : 18,
      monthlyPrice: 18,
      annualPrice: 15,
      icon: '🏫',
      description: 'Complete school management solution'
    },
    'ai-pro': {
      name: 'Catalyst AI Pro',
      price: billingCycle === 'annually' ? 25 : 30,
      monthlyPrice: 30,
      annualPrice: 25,
      icon: '🚀',
      description: 'AI-powered educational excellence'
    }
  }

  const calculatePricing = (students: number) => {
    const plan = planDetails[planId as keyof typeof planDetails]
    if (!plan || planId === 'core') {
      return {
        baseStudents: students,
        freeStudents: students,
        billableStudents: 0,
        monthlySubtotal: 0,
        gstAmount: 0,
        total: 0,
        pricePerStudent: 0
      }
    }
    
    // Add 50 free students for contingency
    const freeStudents = 50
    const billableStudents = Math.max(0, students - freeStudents)
    
    const monthlyTotal = billableStudents * plan.price
    const gst = monthlyTotal * 0.18
    const total = monthlyTotal + gst
    
    return {
      baseStudents: students,
      freeStudents: Math.min(students, freeStudents),
      billableStudents,
      monthlySubtotal: monthlyTotal,
      gstAmount: gst,
      total: total,
      pricePerStudent: plan.price
    }
  }

  const handleStudentCountSubmit = () => {
    const count = parseInt(studentCount)
    if (!count || count < 1) {
      addToast({
        type: 'error',
        title: 'Invalid Student Count',
        description: 'Please enter a valid number of students'
      })
      return
    }

    if (planId === 'core' && count > 70) {
      addToast({
        type: 'error',
        title: 'Limit Exceeded',
        description: 'Catalyst Core supports up to 70 students. Please choose Standard or AI Pro plan.'
      })
      return
    }

    setTotalStudents(count)
    const pricing = calculatePricing(count)
    setFinalPrice(pricing.total)
    setStep('checkout')
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // Razorpay Payment Integration
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_6ksqaVo0Vvdh5j',
      amount: Math.round(finalPrice * 100), // Amount in paise
      currency: 'INR',
      name: 'Catalyst School Management',
      description: `${plan.name} - ${billingCycle === 'annually' ? 'Annual' : 'Monthly'} Subscription`,
      image: '/logo.png',
      order_id: '', // Generate from backend
      handler: async function (response: any) {
        // Payment successful
        addToast({
          type: 'success',
          title: 'Payment Successful!',
          description: 'Your subscription has been activated successfully.'
        })
        
        // Save payment details (implement backend API)
        await savePaymentDetails({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          plan: planId,
          billingCycle,
          totalStudents,
          amount: finalPrice
        })
        
        setIsProcessing(false)
        router.push('/admin/settings')
      },
      prefill: {
        email: formData.billingEmail,
        contact: '',
      },
      notes: {
        gst_number: formData.gstNumber,
        total_students: totalStudents,
        plan: planId,
        billing_cycle: billingCycle
      },
      theme: {
        color: '#7C3AED',
        backdrop_color: 'rgba(0, 0, 0, 0.8)'
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false)
          addToast({
            type: 'error',
            title: 'Payment Cancelled',
            description: 'The payment process was cancelled.'
          })
        }
      }
    }
    
    if (typeof window !== 'undefined' && window.Razorpay) {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } else {
      addToast({
        type: 'error',
        title: 'Payment Error',
        description: 'Payment gateway is not loaded. Please refresh and try again.'
      })
      setIsProcessing(false)
    }
  }

  const savePaymentDetails = async (details: any) => {
    // Implement API call to save payment details
    console.log('Saving payment details:', details)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const plan = planDetails[planId as keyof typeof planDetails]

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="pt-6 text-center">
            <p className="text-white">Invalid plan selected. Please go back and select a plan.</p>
            <Button 
              onClick={() => router.push('/admin/subscription')}
              className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading checkout...</div>
      </div>
    )
  }

  if (step === 'student-count') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/subscription')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Configure Your Plan</h1>
                  <p className="text-sm text-gray-400 mt-1">Tell us about your school size</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Count Form */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <School className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">School Information</CardTitle>
                    <CardDescription className="text-gray-300">
                      Enter your total student count for accurate pricing
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-white font-semibold">Total Number of Students *</Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Include all current students + expected new admissions
                    </p>
                    <div className="relative">
                      <Input
                        type="number"
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-12 text-lg font-semibold"
                        placeholder="e.g., 250"
                        min="1"
                      />
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Bonus Info */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Gift className="h-5 w-5 text-emerald-400 mt-0.5" />
                      <div>
                        <h4 className="text-emerald-400 font-semibold text-sm">Bonus: 50 Extra Students FREE!</h4>
                        <p className="text-gray-300 text-sm mt-1">
                          We include 50 additional student accounts at no charge for sudden situations like new admissions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleStudentCountSubmit}
                    disabled={!studentCount || parseInt(studentCount) < 1}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 font-semibold"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Summary */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{plan.icon}</span>
                  <div>
                    <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {plan.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-white">
                    <span>Billing Cycle:</span>
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      {billingCycle === 'annually' ? 'Annual (Save 15%)' : 'Monthly'}
                    </Badge>
                  </div>
                  
                  {planId !== 'core' && (
                    <div className="flex justify-between items-center text-white">
                      <span>Price per student:</span>
                      <span className="font-semibold">₹{plan.price}/month</span>
                    </div>
                  )}

                  {planId === 'core' && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-blue-400 text-sm font-medium">
                        ✨ Core plan is completely FREE for up to 70 students!
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-gray-400 text-sm">
                      Final pricing will be calculated based on your student count
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const pricing = calculatePricing(totalStudents)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Enhanced Mobile Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 z-20">
        <div className={`max-w-5xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
          <div className={`${isMobile ? 'py-4' : 'py-6'}`}>
            {isMobile ? (
              /* Mobile Header Layout */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep('student-count')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 px-3 py-2"
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <div className="flex items-center space-x-1 text-xs">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="text-gray-300">Secure</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Complete Subscription</h1>
                    <p className="text-xs text-gray-300">Enterprise checkout</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Header Layout */
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('student-count')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Complete Your Subscription</h1>
                      <p className="text-sm text-gray-300 mt-1">Enterprise-grade secure checkout</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-gray-300">256-bit SSL Secure</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Side-by-Side Content Layout */}
      <div className={`relative z-10 ${isMobile ? 'px-3 py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'}`}>
        <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-5 gap-8'}`}>
          {/* Left Side - Payment Form (3 cols) */}
          <div className={`${isMobile ? 'order-2' : 'col-span-3'}`}>
            <Card className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl`}>
            <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10">
              <CardTitle className={`text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>Payment Information</CardTitle>
              <CardDescription className="text-gray-300">
                {isMobile ? 'Complete your subscription' : 'Complete your enterprise subscription setup'}
              </CardDescription>
            </CardHeader>
            <CardContent className={`${isMobile ? 'pt-4 px-4 pb-6' : 'pt-6'}`}>
              <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-5' : 'space-y-6'}`}>
                {/* Razorpay Payment Method Selection */}
                <div className="space-y-4">
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>Choose Payment Method</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/20 rounded-lg p-4 cursor-pointer hover:border-purple-400 transition-all duration-200 group">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                          <CreditCard className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-sm">Cards</h4>
                          <p className="text-gray-400 text-xs">Credit/Debit Cards</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-white/20 rounded-lg p-4 cursor-pointer hover:border-emerald-400 transition-all duration-200 group">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                          <Wallet className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-sm">UPI</h4>
                          <p className="text-gray-400 text-xs">Google Pay, PhonePe, Paytm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>Contact Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail" className={`text-white font-semibold ${isMobile ? 'text-sm' : ''}`}>
                      Billing Email *
                    </Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      placeholder={isMobile ? "school@example.edu" : "admin@yourschool.edu"}
                      value={formData.billingEmail}
                      onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                      className={`bg-white/10 border-white/20 text-white placeholder-gray-400 ${isMobile ? 'h-12 text-base' : ''}`}
                      style={isMobile ? { WebkitTapHighlightColor: 'transparent' } : {}}
                      required
                    />
                  </div>
                </div>

                {/* GST Information */}
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className={`text-white ${isMobile ? 'text-sm' : ''}`}>GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    type="text"
                    placeholder={isMobile ? "GST12345..." : "29ABCDE1234F1Z5"}
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    className={`bg-white/10 border-white/20 text-white placeholder-gray-400 ${isMobile ? 'h-12 text-base' : ''}`}
                    style={isMobile ? { WebkitTapHighlightColor: 'transparent' } : {}}
                  />
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>For tax invoice and compliance</p>
                </div>

                {/* Payment Summary Info */}
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-white/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="text-blue-400 font-semibold text-sm mb-2">Secure Payment with Razorpay</h5>
                      <ul className="text-gray-300 text-xs space-y-1">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>All card details are encrypted</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>PCI DSS Level 1 compliant</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>Supports all major cards and UPI</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Razorpay Payment Button */}
                <Button
                  type="submit"
                  disabled={isProcessing || !formData.billingEmail}
                  className={`w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white ${isMobile ? 'py-4 font-bold text-base' : 'py-5 font-bold text-lg'} shadow-xl hover:shadow-2xl transition-all duration-200 ${isMobile ? 'active:scale-98' : 'hover:scale-[1.02]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={isMobile ? { WebkitTapHighlightColor: 'transparent' } : {}}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className={`animate-spin -ml-1 mr-3 ${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isMobile ? 'Processing...' : 'Opening Secure Payment...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <Wallet className="h-5 w-5" />
                        <span>{isMobile ? 'Pay with Razorpay' : 'Proceed to Secure Payment'}</span>
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Mobile-Optimized Security Badges */}
            <div className={`${isMobile ? 'mt-4' : 'mt-6'} flex flex-wrap justify-center items-center ${isMobile ? 'gap-4' : 'gap-6'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center space-x-1 text-emerald-400">
                <Shield className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="font-medium">{isMobile ? 'PCI DSS' : 'PCI DSS Compliant'}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-400">
                <Lock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="font-medium">{isMobile ? 'SSL' : '256-bit SSL'}</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-400">
                <Award className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="font-medium">Enterprise</span>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary (2 cols) */}
          <div className={`${isMobile ? 'order-1' : 'col-span-2'}`}>
            <Card className={`bg-white/5 backdrop-blur-xl border border-white/10 ${isMobile ? '' : 'sticky top-28'}`}>
            <CardHeader className={`bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-b border-white/10 ${isMobile ? 'px-4 py-4' : ''}`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                <span className={`${isMobile ? 'text-2xl' : 'text-3xl'}`}>{plan.icon}</span>
                <div>
                  <CardTitle className={`text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>{plan.name}</CardTitle>
                  <CardDescription className={`text-gray-300 ${isMobile ? 'text-xs' : ''}`}>
                    {billingCycle === 'annually' ? 'Annual' : 'Monthly'} Subscription
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`${isMobile ? 'pt-4 px-4 pb-4' : 'pt-6'}`}>
              <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                {/* Mobile-Optimized Student Count Summary */}
                <div className={`bg-white/10 rounded-lg ${isMobile ? 'p-3' : 'p-4'} border border-white/20`}>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
                    <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                      <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-400`} />
                      <span className={`text-white font-semibold ${isMobile ? 'text-sm' : ''}`}>Students</span>
                    </div>
                    <span className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{totalStudents}</span>
                  </div>
                  
                  <div className={`${isMobile ? 'space-y-1 text-xs' : 'space-y-2 text-sm'}`}>
                    <div className="flex justify-between text-gray-300">
                      <span>Base students:</span>
                      <span>{pricing.baseStudents}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Free bonus students:</span>
                      <span>-{pricing.freeStudents}</span>
                    </div>
                    <div className={`flex justify-between text-white font-medium ${isMobile ? 'pt-1' : 'pt-2'} border-t border-white/20`}>
                      <span>Billable students:</span>
                      <span>{pricing.billableStudents}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile-Optimized Pricing Breakdown */}
                <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                  <h4 className={`text-white font-semibold ${isMobile ? 'text-sm' : ''}`}>Pricing Breakdown</h4>
                  
                  {planId === 'core' ? (
                    <div className={`bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                      <div className="text-center">
                        <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-blue-400 ${isMobile ? 'mb-1' : 'mb-2'}`}>FREE</div>
                        <p className={`text-blue-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>Core plan is completely free!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`flex justify-between text-gray-300 ${isMobile ? 'text-xs' : ''}`}>
                        <span>Price per student/month:</span>
                        <span>₹{pricing.pricePerStudent}</span>
                      </div>
                      <div className={`flex justify-between text-gray-300 ${isMobile ? 'text-xs' : ''}`}>
                        <span>Billable students:</span>
                        <span>{pricing.billableStudents} × ₹{pricing.pricePerStudent}</span>
                      </div>
                      <div className={`flex justify-between text-white ${isMobile ? 'text-xs' : ''}`}>
                        <span>Subtotal:</span>
                        <span>₹{Math.round(pricing.monthlySubtotal)}</span>
                      </div>
                      <div className={`flex justify-between text-gray-300 ${isMobile ? 'text-xs' : ''}`}>
                        <span>GST (18%):</span>
                        <span>₹{Math.round(pricing.gstAmount)}</span>
                      </div>
                      {billingCycle === 'annually' && (
                        <div className={`flex justify-between text-emerald-400 ${isMobile ? 'text-xs' : ''}`}>
                          <span>Annual discount (15%):</span>
                          <span>Included</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Mobile-Optimized Total */}
                <div className={`border-t border-white/20 ${isMobile ? 'pt-3' : 'pt-4'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-white`}>Monthly Total:</span>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent`}>
                      ₹{Math.round(pricing.total)}
                    </span>
                  </div>
                  {planId !== 'core' && (
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 ${isMobile ? 'mt-1' : 'mt-2'}`}>
                      Includes 50 bonus student accounts for growth
                    </p>
                  )}
                </div>

                {/* Mobile-Optimized Enterprise Benefits */}
                <div className={`bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <Gift className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-emerald-400 mt-0.5`} />
                    <div>
                      <h5 className={`text-emerald-400 font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>Enterprise Benefits</h5>
                      <ul className={`text-gray-300 ${isMobile ? 'text-xs mt-1 space-y-0.5' : 'text-xs mt-2 space-y-1'}`}>
                        <li>• Cancel anytime</li>
                        <li>• Priority support</li>
                        <li>• Data export included</li>
                        <li>• FERPA compliant</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <ClientWrapper>
      <UnifiedAuthGuard requiredRole="admin">
        <CheckoutContent />
      </UnifiedAuthGuard>
    </ClientWrapper>
  )
}
