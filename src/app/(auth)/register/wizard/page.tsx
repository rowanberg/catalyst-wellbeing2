'use client'

import React, { useState } from 'react'
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
  ScrollText
} from 'lucide-react'

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

export default function SchoolRegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [schoolCode, setSchoolCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const router = useRouter()

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-4 sm:py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="absolute top-10 sm:top-20 left-4 sm:left-20 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 sm:bottom-40 right-4 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-2 sm:mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">School Registration Wizard</h1>
            <p className="text-white/80 text-base sm:text-lg px-2">Let's get your school set up on Catalyst</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-6 sm:mb-8">
            {/* Mobile: Vertical Progress */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white/80 text-sm">
                  Step {currentStep} of {steps.length}
                </div>
                <div className="text-white/80 text-sm">
                  {Math.round((currentStep / steps.length) * 100)}%
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 text-white'
                }`}>
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6" })}
                </div>
                <h3 className="text-white font-semibold mt-2">{steps[currentStep - 1].title}</h3>
                <p className="text-white/70 text-sm">{steps[currentStep - 1].description}</p>
              </div>
            </div>

            {/* Desktop: Horizontal Progress */}
            <div className="hidden sm:flex items-center justify-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 text-white' 
                      : 'border-white/30 text-white/60'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-white/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Terms & Conditions */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6 hidden sm:block">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Terms & Conditions</h2>
                  <p className="text-white/80 text-sm sm:text-base">Please review and accept our terms before proceeding</p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                        <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">Terms & Conditions for School Registration</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium w-full sm:w-auto"
                      >
                        Read Full Terms
                      </button>
                    </div>
                    
                    <div className="text-white/80 text-sm space-y-2 mb-4">
                      <p>By registering your school with Catalyst Wellbeing App, you agree to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Provide accurate school and administrator information</li>
                        <li>Ensure proper data handling and student privacy protection</li>
                        <li>Use the platform for educational and wellbeing purposes only</li>
                        <li>Maintain updated user records and parental consent</li>
                        <li>Comply with subscription terms and payment obligations</li>
                        <li>Understand the 7-day trial period with 100 member login limit</li>
                      </ul>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        {...register('termsAccepted')}
                        type="checkbox"
                        id="termsAccepted"
                        className="mt-1 w-4 h-4 text-indigo-600 bg-white/10 border-white/30 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <label htmlFor="termsAccepted" className="text-white/90 text-sm">
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-indigo-300 hover:text-indigo-200 underline"
                        >
                          Terms & Conditions
                        </button>
                        {' '}and confirm that I am authorized to register this school.
                      </label>
                    </div>
                    {errors.termsAccepted && (
                      <p className="text-red-300 text-sm mt-2">{errors.termsAccepted?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: School Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">School Information</h2>
                  <p className="text-white/80">Tell us about your school</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium block">School Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-white/60" />
                      </div>
                      <input
                        {...register('schoolName')}
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                        placeholder="Enter your school name"
                      />
                    </div>
                    {errors.schoolName && (
                      <p className="text-red-300 text-sm">{errors.schoolName?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium block">School Address</label>
                    <div className="relative">
                      <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                        <MapPin className="h-5 w-5 text-white/60" />
                      </div>
                      <textarea
                        {...register('address')}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 resize-none"
                        placeholder="Enter complete school address"
                      />
                    </div>
                    {errors.address && (
                      <p className="text-red-300 text-sm">{errors.address?.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium block">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          {...register('phone')}
                          type="tel"
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                          placeholder="School phone number"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-300 text-sm">{errors.phone?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium block">School Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          {...register('schoolEmail')}
                          type="email"
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                          placeholder="School email address"
                        />
                      </div>
                      {errors.schoolEmail && (
                        <p className="text-red-300 text-sm">{errors.schoolEmail?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Administrator Account */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Administrator Account</h2>
                  <p className="text-white/80">Create your admin account to manage the school</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium block">First Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          {...register('adminFirstName')}
                          type="text"
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                          placeholder="Administrator first name"
                        />
                      </div>
                      {errors.adminFirstName && (
                        <p className="text-red-300 text-sm">{errors.adminFirstName?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium block">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          {...register('adminLastName')}
                          type="text"
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                          placeholder="Administrator last name"
                        />
                      </div>
                      {errors.adminLastName && (
                        <p className="text-red-300 text-sm">{errors.adminLastName?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium block">Admin Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-white/60" />
                      </div>
                      <input
                        {...register('adminEmail')}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                        placeholder="Administrator email address"
                      />
                    </div>
                    {errors.adminEmail && (
                      <p className="text-red-300 text-sm">{errors.adminEmail?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium block">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-white/60" />
                      </div>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                        placeholder="Create a secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-300 text-sm">{errors.password?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Review & Complete</h2>
                  <p className="text-white/80">Please review your information before submitting</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      School Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">School Name:</span>
                        <p className="text-white">{watchedFields.schoolName}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Email:</span>
                        <p className="text-white">{watchedFields.schoolEmail}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Phone:</span>
                        <p className="text-white">{watchedFields.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-white/60">Address:</span>
                        <p className="text-white">{watchedFields.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Administrator
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Name:</span>
                        <p className="text-white">{watchedFields.adminFirstName} {watchedFields.adminLastName}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Email:</span>
                        <p className="text-white">{watchedFields.adminEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-red-200 text-sm text-center">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 sm:mt-8">
              {/* Mobile Navigation */}
              <div className="block sm:hidden space-y-3">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
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
                
                <div className="flex space-x-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200 backdrop-blur-sm text-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                  )}
                  
                  <Link
                    href="/login"
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200 backdrop-blur-sm text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:flex justify-between items-center">
                <div className="flex space-x-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center space-x-2 py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                  )}
                  
                  <Link
                    href="/login"
                    className="flex items-center space-x-2 py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                  </Link>
                </div>

                <div>
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center space-x-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
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
            </div>
          </form>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Terms & Conditions for School Registration</span>
                  <span className="sm:hidden">Terms & Conditions</span>
                </h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] p-4 sm:p-6">
              <div className="prose prose-gray max-w-none">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                  <p className="text-blue-800 font-medium">
                    📜 Terms & Conditions for School Registration (Admins/Principals)
                  </p>
                </div>

                <div className="space-y-6 text-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                    <p>By registering your school with Catalyst Wellbeing App, you agree to abide by these Terms & Conditions on behalf of your institution.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Eligibility</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Only authorized school representatives (principal, administrator, or designated staff) can register the school.</li>
                      <li>The school is responsible for providing accurate details during registration.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Account & Access</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The school will be provided with an admin account to create and manage teacher, student, and parent accounts.</li>
                      <li>Schools must ensure login details are not misused or shared outside their institution.</li>
                      <li>The school is responsible for maintaining updated user records (e.g., new admissions, transfers).</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Data Responsibility</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Schools are responsible for the accuracy of data entered (students, parents, teachers).</li>
                      <li>Schools must ensure parental consent for student participation, especially for minors.</li>
                      <li>Catalyst Wellbeing App ensures secure data storage, but the school is accountable for its proper and ethical use.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Use of Services</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Schools agree to use the app strictly for educational, wellbeing, and communication purposes.</li>
                      <li>Misuse (sharing harmful content, commercial use, unauthorized third-party sharing) is prohibited.</li>
                      <li>Schools are responsible for moderating communications between their staff, students, and parents.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6. AI & Reports</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The school can access Whiskers AI reports, student summaries, and wellbeing analytics.</li>
                      <li>These insights are supportive tools and should not replace teacher/parent judgment.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Payments & Subscription</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Schools agree to the chosen subscription plan and payment terms.</li>
                      <li>Delayed or non-payment may result in account suspension.</li>
                      <li>First 7 days trial for knowing about the platform for all schools, after which normal billing applies.</li>
                      <li>Only 100 members can login with your school ID during the trial period.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">8. Liability & Limitations</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Catalyst is not responsible for any misuse of data by school staff.</li>
                      <li>Catalyst provides tools for wellbeing but is not a medical/therapeutic service.</li>
                      <li>Responsibility for safeguarding students lies with the school.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">9. Termination</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Schools may request account closure anytime.</li>
                      <li>Catalyst reserves the right to suspend/remove schools violating the terms.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">10. Consent</h3>
                    <p className="mb-2">By registering, the school confirms:</p>
                    <ul className="list-none space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✅</span>
                        <span>They are authorized to act on behalf of the institution.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✅</span>
                        <span>They agree to ensure safe and ethical use of the platform.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="modalTermsRead"
                    checked={hasReadTerms}
                    onChange={(e) => setHasReadTerms(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <label htmlFor="modalTermsRead" className="text-sm text-gray-700">
                    I have read and understood all terms and conditions
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (hasReadTerms) {
                        setShowTermsModal(false)
                        // Auto-check the terms checkbox in the form
                        const termsCheckbox = document.getElementById('termsAccepted') as HTMLInputElement
                        if (termsCheckbox) {
                          termsCheckbox.checked = true
                          termsCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
                        }
                      }
                    }}
                    disabled={!hasReadTerms}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    Accept Terms
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
