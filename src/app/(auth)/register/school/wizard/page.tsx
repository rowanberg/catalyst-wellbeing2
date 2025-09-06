'use client'

import { useState } from 'react'
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
  ChevronRight,
  Users,
  Shield
} from 'lucide-react'

const schoolSchema = z.object({
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
      title: 'School Information',
      description: 'Basic details about your school',
      icon: Building2,
      fields: ['schoolName', 'address', 'phone', 'schoolEmail']
    },
    {
      id: 2,
      title: 'Administrator Account',
      description: 'Create your admin account',
      icon: Shield,
      fields: ['adminFirstName', 'adminLastName', 'adminEmail', 'password']
    },
    {
      id: 3,
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
    if (isValid && currentStep < 3) {
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
      setError('An error occurred during registration')
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">School Registration Wizard</h1>
            <p className="text-white/80 text-lg">Let's get your school set up on Catalyst</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
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

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: School Information */}
            {currentStep === 1 && (
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

            {/* Step 2: Administrator Account */}
            {currentStep === 2 && (
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

            {/* Step 3: Review */}
            {currentStep === 3 && (
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
            <div className="flex justify-between items-center mt-8">
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
                {currentStep < 3 ? (
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
          </form>
        </div>
      </div>
    </div>
  )
}
