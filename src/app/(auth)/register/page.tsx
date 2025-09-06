'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { signUp } from '@/lib/redux/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError, AuthError, ValidationError } from '@/lib/utils/errorHandling'
import Link from 'next/link'
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, Users, UserCheck, Shield, AlertCircle, CheckCircle, XCircle, UserPlus, ArrowLeft, Sparkles, Heart, Star, Zap, Trophy, Target } from 'lucide-react'

const registerSchema = z.object({
  schoolId: z.string().length(12, 'School ID must be exactly 12 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'parent', 'teacher']),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [isVerifyingSchool, setIsVerifyingSchool] = useState(false)
  const [schoolVerified, setSchoolVerified] = useState(false)
  const [schoolError, setSchoolError] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading: authLoading, error: authError } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const schoolId = watch('schoolId')

  // Verify school ID when it changes
  const verifySchool = async (schoolId: string) => {
    if (!schoolId.trim()) {
      setSchoolVerified(false)
      setSchoolName('')
      setSchoolError('')
      return
    }

    setIsVerifyingSchool(true)
    setSchoolError('')

    try {
      const response = await fetch('/api/verify-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolId }),
      })

      if (!response.ok) {
        throw new ValidationError('SCHOOL_VERIFICATION_FAILED', `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.schoolName) {
        setSchoolName(data.schoolName)
        setSchoolVerified(true)
        addToast({
          type: 'success',
          title: 'School Verified',
          description: `Found: ${data.schoolName}`
        })
      } else {
        throw new ValidationError('SCHOOL_NOT_FOUND', data.message || 'School not found')
      }
    } catch (error) {
      const appError = handleError(error, 'school verification')
      setSchoolError(appError.message)
      setSchoolVerified(false)
      setSchoolName('')
      addToast({
        type: 'error',
        title: 'School Verification Failed',
        description: appError.message
      })
    } finally {
      setIsVerifyingSchool(false)
    }
  }

  // Trigger verification when school ID changes
  useEffect(() => {
    if (schoolId && schoolId.length === 12) {
      verifySchool(schoolId)
    } else {
      setSchoolVerified(false)
      setSchoolName('')
      setSchoolError('')
    }
  }, [schoolId])

  const onSubmit = async (data: RegisterForm) => {
    if (!schoolVerified) {
      setSchoolError('Please verify your school ID first')
      addToast({
        type: 'error',
        title: 'School Verification Required',
        description: 'Please verify your school ID before registering'
      })
      return
    }

    setIsLoading(true)
    setSubmitError(null)

    try {
      const result = await dispatch(signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        schoolId: data.schoolId,
      }))

      if (signUp.fulfilled.match(result)) {
        // Successful registration
        const userRole = result.payload.profile?.role || result.payload.user?.role
        addToast({
          type: 'success',
          title: 'Registration Successful!',
          description: `Welcome to Catalyst! Redirecting to your ${userRole} dashboard...`
        })
        
        // Redirect based on role to correct dashboard paths
        setTimeout(() => {
          switch (userRole) {
            case 'student':
              window.location.href = '/student'
              break
            case 'parent':
              window.location.href = '/parent'
              break
            case 'teacher':
              window.location.href = '/teacher'
              break
            case 'admin':
              window.location.href = '/admin'
              break
            default:
              window.location.href = '/login'
          }
        }, 1500) // Give time for the success toast to show
      } else if (signUp.rejected.match(result)) {
        // Handle registration error
        const errorMessage = result.payload as string || 'Registration failed'
        setSubmitError(errorMessage)
        addToast({
          type: 'error',
          title: 'Registration Failed',
          description: errorMessage
        })
      }
    } catch (error) {
      const appError = handleError(error, 'registration')
      setSubmitError(appError.message)
      addToast({
        type: 'error',
        title: 'Registration Error',
        description: appError.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `radial-gradient(circle at 25% 25%, #00f5ff 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #ff6b6b 2px, transparent 2px)`,
          backgroundSize: '50px 50px',
          animation: 'float 20s ease-in-out infinite'
        }}></div>

        {/* Floating Interactive Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-bounce"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-spin"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-1/3 text-white/20 animate-float">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="absolute bottom-32 right-1/4 text-white/20 animate-float-delayed">
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute top-1/2 left-16 text-white/20 animate-bounce">
          <Zap className="w-7 h-7" />
        </div>
        <div className="absolute bottom-1/3 right-20 text-white/20 animate-pulse">
          <Heart className="w-5 h-5" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Star className="w-3 h-3 text-yellow-800" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
            Join Your School's Catalyst Journey! 🚀
          </h1>
          <p className="text-lg text-white/80 mb-6">
            Unlock your potential, earn XP, collect gems, and build amazing habits with your classmates!
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white">Earn XP & Levels</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white">Daily Quests</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-white">Wellbeing Focus</span>
            </div>
          </div>
        </div>

        {/* Enhanced Glassmorphism Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <UserPlus className="w-6 h-6 text-pink-400" />
              Create Your Account
            </CardTitle>
            <CardDescription className="text-white/70 text-base">
              Join thousands of students already improving their wellbeing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* School ID Field */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  School ID
                </Label>
                <div className="relative group">
                  <Input
                    {...register('schoolId')}
                    type="text"
                    maxLength={12}
                    className="w-full pl-12 pr-16 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover-glow"
                    placeholder="Enter your 12-character school ID"
                  />
                  <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {isVerifyingSchool ? (
                      <LoadingSpinner className="h-5 w-5 text-pink-400 animate-spin" />
                    ) : schoolId && schoolId.length === 12 ? (
                      schoolVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-400 animate-pulse" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 animate-bounce" />
                      )
                    ) : null}
                  </div>
                </div>
              </div>
              {schoolVerified && schoolName && (
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-emerald-200 text-sm">✓ {schoolName}</p>
                </div>
              )}
              {errors.schoolId && (
                <p className="text-red-300 text-sm">{errors.schoolId?.message}</p>
              )}
              {schoolError && (
                <p className="text-red-300 text-sm">{schoolError}</p>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    {...register('firstName')}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="First name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    {...register('lastName')}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="Last name"
                  />
                </div>
              </div>
              {errors.firstName && (
                <p className="text-red-300 text-sm">{errors.firstName?.message}</p>
              )}
              {errors.lastName && (
                <p className="text-red-300 text-sm">{errors.lastName?.message}</p>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-red-300 text-sm">{errors.email?.message}</p>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Create a password"
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

              {/* Role Field */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={(value) => setValue('role', value as 'student' | 'parent' | 'teacher')}>
                  <SelectTrigger className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.role && (
                <p className="text-red-300 text-sm">{errors.role?.message}</p>
              )}

              {/* Error Message */}
              {(authError || submitError) && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{authError || submitError}</span>
                </div>
              )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !schoolVerified}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="Creating account..." />
              ) : !schoolVerified ? (
                <div className="flex items-center justify-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Verify School ID First</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </div>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/80">Already have an account?</span>
              </div>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm group w-full"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
