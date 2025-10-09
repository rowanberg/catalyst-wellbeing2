'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { signUp } from '@/lib/redux/slices/authSlice'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError, ValidationError, AuthError } from '@/lib/utils/errorHandling'
import Link from 'next/link'
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, AlertCircle, CheckCircle, XCircle, UserPlus, ArrowRight, ArrowLeft, Shield, Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const registerSchema = z.object({
  schoolId: z.string().length(12, 'School ID must be exactly 12 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'parent', 'teacher', 'admin']),
  gradeLevel: z.string().optional(),
  className: z.string().optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [isVerifyingSchool, setIsVerifyingSchool] = useState(false)
  const [schoolVerified, setSchoolVerified] = useState(false)
  const [schoolError, setSchoolError] = useState('')
  
  // Parent-specific state
  const [children, setChildren] = useState<Array<{
    email: string
    name: string
    school: string
    verified: boolean
    loading: boolean
  }>>([])
  const [currentChildEmail, setCurrentChildEmail] = useState('')
  const [currentChildId, setCurrentChildId] = useState('')
  const [isVerifyingChild, setIsVerifyingChild] = useState(false)

  // Student-specific state
  const [availableClasses, setAvailableClasses] = useState<Array<{
    id: string
    class_name: string
    class_code: string
    subject: string
    room_number: string
    max_students: number
    current_students: number
  }>>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('')
  
  // Teacher-specific state
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [primaryGrade, setPrimaryGrade] = useState<string>('')
  const [gradeSubjects, setGradeSubjects] = useState<any[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading: authLoading, error: authError } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const schoolId = watch('schoolId')
  const selectedRole = watch('role')

  // Verify school ID when it changes
  useEffect(() => {
    if (schoolId && schoolId.length === 12) {
      verifySchool(schoolId)
    } else {
      setSchoolVerified(false)
      setSchoolName('')
      setSchoolError('')
    }
  }, [schoolId])

  // Fetch available grade levels when school is verified
  useEffect(() => {
    if (schoolVerified && schoolName) {
      fetchAvailableGradeLevels()
    }
  }, [schoolVerified, schoolName])

  // Load classes when school is verified and role is teacher
  useEffect(() => {
    if (schoolVerified && selectedRole === 'teacher' && schoolId) {
      loadAvailableClasses(schoolId)
    }
  }, [schoolVerified, selectedRole, schoolId])

  // Load classes when grade is selected for students
  useEffect(() => {
    if (schoolVerified && selectedRole === 'student' && schoolId && selectedGradeLevel) {
      loadAvailableClasses(schoolId, selectedGradeLevel)
    }
  }, [schoolVerified, selectedRole, schoolId, selectedGradeLevel])

  // Verify school function
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
        headers: { 'Content-Type': 'application/json' },
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
    } finally {
      setIsVerifyingSchool(false)
    }
  }

  // Fetch available grade levels
  const fetchAvailableGradeLevels = async () => {
    if (!schoolId) return

    try {
      setLoadingGrades(true)
      
      const schoolResponse = await fetch('/api/verify-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })

      if (!schoolResponse.ok) {
        throw new Error('Failed to verify school')
      }

      const schoolData = await schoolResponse.json()
      
      const response = await fetch('/api/admin/grade-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: schoolData.schoolUuid }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch grade levels')
      }

      const data = await response.json()
      setGradeSubjects(data.gradeLevels || [])
    } catch (error) {
      console.error('Error fetching grade levels:', error)
      setGradeSubjects([])
    } finally {
      setLoadingGrades(false)
    }
  }

  // Load available classes
  const loadAvailableClasses = async (schoolId: string, gradeLevel?: string) => {
    if (!schoolId) return

    setIsLoadingClasses(true)
    try {
      let url = ''
      if (selectedRole === 'teacher') {
        url = `/api/classes?school_id=${schoolId}`
      } else if (selectedRole === 'student' && gradeLevel) {
        url = `/api/registration/classes?schoolId=${schoolId}&gradeLevel=${gradeLevel}`
      }

      if (!url) return

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAvailableClasses(data.classes || [])
      } else {
        setAvailableClasses([])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      setAvailableClasses([])
    } finally {
      setIsLoadingClasses(false)
    }
  }

  // Verify student email for parents
  const verifyStudentEmail = async (email: string, studentId: string) => {
    if (!email || !studentId) return

    setIsVerifyingChild(true)
    try {
      const response = await fetch('/api/verify-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, studentId })
      })

      if (response.ok) {
        const data = await response.json()
        const student = data.student
        
        setChildren(prev => [...prev, {
          email: student.email,
          name: student.name,
          school: student.school,
          verified: true,
          loading: false
        }])
        
        setCurrentChildEmail('')
        setCurrentChildId('')
        addToast({ 
          title: 'Student Verified',
          description: `${student.name} from ${student.school}`,
          type: 'success'
        })
      } else {
        const errorData = await response.json()
        addToast({ 
          title: 'Error',
          description: errorData.error || 'Student not found',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error verifying student:', error)
      addToast({ 
        title: 'Error',
        description: 'Failed to verify student email',
        type: 'error'
      })
    } finally {
      setIsVerifyingChild(false)
    }
  }

  // Add child email
  const addChildEmail = () => {
    if (currentChildEmail && currentChildId && !children.find(c => c.email === currentChildEmail)) {
      verifyStudentEmail(currentChildEmail, currentChildId)
    }
  }

  // Remove child
  const removeChild = (email: string) => {
    setChildren(prev => prev.filter(c => c.email !== email))
  }

  // Handle grade selection
  const handleGradeSelection = (gradeId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedGrades(prev => [...prev, gradeId])
    } else {
      setSelectedGrades(prev => prev.filter(id => id !== gradeId))
      if (gradeId === primaryGrade) {
        setPrimaryGrade('')
      }
    }
  }

  // Handle primary grade selection
  const handlePrimaryGradeSelection = (gradeId: string) => {
    setPrimaryGrade(gradeId)
    if (!selectedGrades.includes(gradeId)) {
      setSelectedGrades(prev => [...prev, gradeId])
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    if (!schoolVerified) {
      setSubmitError('Please verify your school ID first')
      return
    }

    if (data.role === 'parent' && children.length === 0) {
      setSubmitError('Please add at least one child to your account')
      return
    }

    if (data.role === 'teacher' && selectedGrades.length === 0) {
      setSubmitError('Please select at least one grade level to teach')
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
        gradeLevel: data.gradeLevel,
        className: data.className
      }))
      
      if (signUp.fulfilled.match(result)) {
        addToast({
          type: 'success',
          title: 'Registration Successful',
          description: 'Please check your email to verify your account'
        })
        router.push('/login')
      } else if (signUp.rejected.match(result)) {
        const errorMessage = result.payload as string || 'Registration failed'
        setSubmitError(errorMessage)
        addToast({
          type: 'error',
          title: 'Registration Failed',
          description: errorMessage
        })
      }
    } catch (error) {
      const appError = handleError(error, 'register')
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

  const canProceedToStep2 = schoolVerified && watch('firstName') && watch('lastName') && watch('email') && watch('password') && watch('role')

  const handleNextStep = () => {
    if (canProceedToStep2) {
      setCurrentStep(2)
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(1)
  }

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      
      {/* Left Panel - Enterprise Branding */}
      <div className="lg:flex-1 relative overflow-hidden flex items-center justify-center p-8 lg:p-16">
        {/* Professional Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_transparent_20%,_rgba(0,0,0,0.3)_70%)]"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
        </div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 max-w-lg">
          {/* Enterprise Logo Section */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl mb-8 shadow-2xl border border-white/10">
              <GraduationCap className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-light text-white mb-3 tracking-tight">
              Catalyst
              <span className="text-indigo-400 font-semibold"> Platform</span>
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mb-6"></div>
            <p className="text-xl text-gray-300 font-light leading-relaxed">
              Enterprise Education Management System
            </p>
          </div>
          
          {/* Key Features with Professional Icons */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border border-white/10">
                <Shield className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Enterprise Security</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Bank-level encryption with FERPA & COPPA compliance</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border border-white/10">
                <Users className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Unified Ecosystem</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Seamlessly connect all stakeholders in one platform</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border border-white/10">
                <GraduationCap className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">AI-Powered Insights</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Advanced analytics for data-driven educational decisions</p>
              </div>
            </div>
          </div>
          
          {/* Enterprise Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">Trusted by leading institutions</p>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Schools</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">99.9%</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Uptime SLA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Enterprise Registration Form */}
      <div className="lg:flex-1 bg-white flex items-start justify-center p-4 lg:p-8 overflow-y-auto min-h-screen lg:min-h-0">
        <div className="w-full max-w-lg lg:max-w-xl">
          {/* Compact Professional Header */}
          <div className="mb-6 lg:mb-8">
            <h3 className="text-2xl lg:text-3xl font-light text-gray-900 mb-2">
              Join <span className="font-semibold text-indigo-600">Catalyst</span>
            </h3>
            <p className="text-gray-600 text-sm lg:text-base">
              Enterprise education management platform
            </p>
            
            {/* Premium Step Indicator */}
            <div className="mt-4 lg:mt-6">
              <div className="flex items-center justify-center">
                <div className="relative flex-1 max-w-sm mx-auto">
                  {/* Premium Background Track */}
                  <div className="absolute inset-0 flex items-center z-0">
                    <div className="h-1 w-full bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full shadow-inner"></div>
                  </div>
                  
                  {/* Animated Progress Line */}
                  <div className="absolute inset-0 flex items-center z-10">
                    <div 
                      className={`h-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 shadow-sm transition-all duration-700 ease-out ${
                        currentStep === 2 ? 'w-full' : 'w-1/2'
                      }`}
                      style={{
                        boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)'
                      }}
                    ></div>
                  </div>
                  
                  {/* Step Nodes */}
                  <div className="relative flex justify-between z-20">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center group">
                      <div className={`relative w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 transform ${
                        currentStep >= 1 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl border-2 border-white scale-110' 
                          : 'bg-white border-2 border-gray-300 text-gray-500 shadow-md hover:border-indigo-300'
                      }`}>
                        {currentStep > 1 ? (
                          <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 animate-in zoom-in duration-300" />
                        ) : (
                          <span className="font-bold">1</span>
                        )}
                        
                        {/* Premium Glow Effect */}
                        {currentStep >= 1 && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-50 blur-sm -z-10 animate-pulse"></div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <span className={`block text-xs lg:text-sm font-medium transition-colors duration-300 ${
                          currentStep >= 1 ? 'text-indigo-700' : 'text-gray-500'
                        }`}>
                          Basic Info
                        </span>
                        <span className="text-xs text-gray-400 hidden lg:block">Account Setup</span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center group">
                      <div className={`relative w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 transform ${
                        currentStep === 2 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl border-2 border-white scale-110' 
                          : currentStep > 2 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl border-2 border-white'
                          : 'bg-white border-2 border-gray-300 text-gray-500 shadow-md hover:border-indigo-300'
                      }`}>
                        {currentStep > 2 ? (
                          <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6" />
                        ) : (
                          <span className="font-bold">2</span>
                        )}
                        
                        {/* Premium Glow Effect */}
                        {currentStep === 2 && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-50 blur-sm -z-10 animate-pulse"></div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <span className={`block text-xs lg:text-sm font-medium transition-colors duration-300 ${
                          currentStep >= 2 ? 'text-indigo-700' : 'text-gray-500'
                        }`}>
                          Role Setup
                        </span>
                        <span className="text-xs text-gray-400 hidden lg:block">Profile Details</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Premium Progress Percentage */}
              <div className="mt-3 lg:mt-4 text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                  <span className="text-xs font-medium text-indigo-700">
                    Step {currentStep} of 2 • {currentStep === 1 ? '50' : '100'}% Complete
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 lg:space-y-6">
                {/* School ID Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-indigo-100">
                  <div className="flex items-center mb-3 lg:mb-4">
                    <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-600 mr-2" />
                    <h4 className="text-base lg:text-lg font-semibold text-gray-800">Institution Verification</h4>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School ID
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2">
                        <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('schoolId')}
                        type="text"
                        maxLength={12}
                        className={`w-full pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-3.5 text-base lg:text-lg font-mono tracking-wider border-2 rounded-lg lg:rounded-xl transition-all focus:outline-none ${
                          schoolVerified 
                            ? 'border-green-400 bg-green-50 focus:border-green-500' 
                            : schoolError 
                            ? 'border-red-400 bg-red-50 focus:border-red-500'
                            : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 lg:focus:ring-4 focus:ring-indigo-50'
                        }`}
                        placeholder="XXXX-XXXX-XXXX"
                      />
                      <div className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2">
                        {isVerifyingSchool ? (
                          <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-indigo-400/30 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : schoolVerified ? (
                          <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-500" />
                        ) : schoolId?.length === 12 && schoolError ? (
                          <XCircle className="h-5 w-5 lg:h-6 lg:w-6 text-red-500" />
                        ) : null}
                      </div>
                    </div>

                    {/* Professional School Information Display */}
                    {schoolVerified && schoolName && (
                      <div className="mt-4 animate-in slide-in-from-top-2 duration-500">
                        <div className="bg-white border-2 border-green-200 rounded-xl p-4 lg:p-5 shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                <GraduationCap className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800">Institution Verified</span>
                              </div>
                              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">{schoolName}</h3>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  <span>Secure & Verified Institution</span>
                                </p>
                                <p className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>FERPA Compliant Platform</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-green-100">
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-lg font-bold text-gray-900">500+</p>
                                <p className="text-xs text-gray-600">Students</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-gray-900">50+</p>
                                <p className="text-xs text-gray-600">Teachers</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-gray-900">20+</p>
                                <p className="text-xs text-gray-600">Classes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {errors.schoolId && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.schoolId.message}
                      </p>
                    )}
                    {schoolError && !schoolVerified && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {schoolError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h4 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('firstName')}
                          type="text"
                          className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all focus:outline-none text-sm"
                          placeholder="First name"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('lastName')}
                          type="text"
                          className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all focus:outline-none text-sm"
                          placeholder="Last name"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Credentials */}
                <div>
                  <h4 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Account Credentials</h4>
                  <div className="space-y-3 lg:space-y-4">
                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('email')}
                          type="email"
                          className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all focus:outline-none text-sm"
                          placeholder="your.email@school.edu"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full pl-9 pr-10 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all focus:outline-none text-sm"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.password.message}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-gray-500">Minimum 6 characters</div>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="bg-gray-50 rounded-xl p-4 lg:p-5 border border-gray-200">
                  <h4 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Account Type</h4>
                  <Select onValueChange={(value: any) => setValue('role', value)}>
                    <SelectTrigger className="w-full py-3 text-sm lg:text-base border-2 rounded-lg">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student" className="py-2">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          <span>Student</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="parent" className="py-2">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Parent/Guardian</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher" className="py-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>Teacher/Faculty</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" className="py-2">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          <span>Administrator</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.role.message}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 lg:pt-6">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!canProceedToStep2}
                    className="w-full py-3 lg:py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-lg lg:rounded-xl shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span className="text-sm lg:text-base">Continue to Role Setup</span>
                    <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Role-specific Information */}
            {currentStep === 2 && (
              <div className="space-y-4 lg:space-y-6">
                {/* Step 2 Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-indigo-100">
                  <h4 className="text-lg lg:text-xl font-semibold text-gray-800 mb-1 lg:mb-2">Configure Your Account</h4>
                  <p className="text-gray-600 text-sm lg:text-base">Complete your profile based on your role</p>
                </div>

                {/* Student-specific fields */}
                {selectedRole === 'student' && (
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-gray-200">
                    <div className="flex items-center mb-4 lg:mb-5">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg lg:rounded-xl flex items-center justify-center mr-3">
                        <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                      <h4 className="text-base lg:text-lg font-semibold text-gray-800">Academic Details</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Grade Level</Label>
                        <Select onValueChange={(value) => {
                          setValue('gradeLevel', value)
                          setSelectedGradeLevel(value)
                        }}>
                          <SelectTrigger className="h-11 lg:h-12 text-sm lg:text-base border-2 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-indigo-50">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeSubjects.length > 0 ? (
                              Array.from(new Set(gradeSubjects.map((grade: any) => grade.grade_level)))
                                .sort((a: any, b: any) => parseInt(a) - parseInt(b))
                                .map((gradeLevel: any) => (
                                  <SelectItem key={gradeLevel} value={gradeLevel} className="py-2">
                                    Grade {gradeLevel}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="" disabled>
                                {loadingGrades ? 'Loading...' : 'No grades available'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Class Section</Label>
                        {selectedGradeLevel ? (
                          isLoadingClasses ? (
                            <div className="flex items-center justify-center h-11 lg:h-12 border-2 border-gray-200 rounded-lg lg:rounded-xl bg-gray-50">
                              <LoadingSpinner size="sm" text="Loading..." />
                            </div>
                          ) : availableClasses.length > 0 ? (
                            <Select onValueChange={(value) => setValue('className', value)}>
                              <SelectTrigger className="h-11 lg:h-12 text-sm lg:text-base border-2 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-indigo-50">
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableClasses.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id} className="py-2">
                                    <div>
                                      <div className="font-medium text-sm">{cls.class_name}</div>
                                      {cls.subject && (
                                        <div className="text-xs text-gray-500">{cls.subject}</div>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="h-11 lg:h-12 px-3 bg-amber-50 border-2 border-amber-200 rounded-lg lg:rounded-xl flex items-center">
                              <AlertCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
                              <p className="text-xs lg:text-sm text-amber-800">No classes available</p>
                            </div>
                          )
                        ) : (
                          <div className="h-11 lg:h-12 px-3 bg-gray-50 border-2 border-gray-200 rounded-lg lg:rounded-xl flex items-center">
                            <p className="text-xs lg:text-sm text-gray-500">Select grade first</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent-specific fields */}
                {selectedRole === 'parent' && (
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-gray-200">
                    <div className="flex items-center mb-4 lg:mb-5">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg lg:rounded-xl flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                      <h4 className="text-base lg:text-lg font-semibold text-gray-800">Link Your Children</h4>
                    </div>
                    
                    <div className="space-y-3 lg:space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg lg:rounded-xl p-3 lg:p-4">
                        <p className="text-xs lg:text-sm text-blue-800">
                          Add your children's school accounts to monitor progress
                        </p>
                      </div>
                      
                      <div className="space-y-2 lg:space-y-3">
                        <Label className="text-sm font-medium text-gray-700 block">Add Child Account</Label>
                        <div className="flex gap-2 lg:gap-3">
                          <div className="flex-1">
                            <Input
                              value={currentChildEmail}
                              onChange={(e) => setCurrentChildEmail(e.target.value)}
                              type="email"
                              placeholder="Child's email"
                              disabled={isVerifyingChild}
                              className="h-10 lg:h-11 border-2 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-indigo-50 text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              value={currentChildId}
                              onChange={(e) => setCurrentChildId(e.target.value)}
                              type="text"
                              placeholder="Student ID"
                              disabled={isVerifyingChild}
                              className="h-10 lg:h-11 border-2 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-indigo-50 text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={addChildEmail}
                            disabled={!currentChildEmail || !currentChildId || isVerifyingChild}
                            className="h-10 lg:h-11 px-4 lg:px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg lg:rounded-xl shadow-lg transition-all"
                          >
                            {isVerifyingChild ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {children.length > 0 && (
                        <div className="space-y-2 lg:space-y-3">
                          <Label className="text-sm font-medium text-gray-700 block">
                            Linked Children ({children.length})
                          </Label>
                          {children.map((child, index) => (
                            <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg lg:rounded-xl">
                              <div className="flex items-center gap-2 lg:gap-3">
                                <div className="w-8 h-8 lg:w-9 lg:h-9 bg-green-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm lg:text-base">{child.name}</p>
                                  <p className="text-xs lg:text-sm text-gray-600">{child.email}</p>
                                  <p className="text-xs text-green-600">{child.school}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => removeChild(child.email)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher-specific fields */}
                {selectedRole === 'teacher' && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Teaching Assignments</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-sm text-purple-800">
                          Select the grade levels and subjects you'll be teaching this academic year
                        </p>
                      </div>
                      
                      {loadingGrades ? (
                        <div className="flex justify-center py-12">
                          <div className="text-center">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading available grade levels...</p>
                          </div>
                        </div>
                      ) : gradeSubjects.length > 0 ? (
                        <>
                          <Label className="text-sm font-medium text-gray-700 block">
                            Select Your Teaching Grades
                          </Label>
                          <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto p-1">
                            {gradeSubjects.map((grade: any) => (
                              <div
                                key={grade.id}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                                  selectedGrades.includes(grade.id)
                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-400 shadow-md'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                                onClick={() => handleGradeSelection(grade.id, !selectedGrades.includes(grade.id))}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-800">{grade.name}</h5>
                                    <p className="text-sm text-gray-600 mt-1">Grade {grade.grade_level}</p>
                                    {grade.subject && (
                                      <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg">
                                        {grade.subject}
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedGrades.includes(grade.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleGradeSelection(grade.id, e.target.checked);
                                      }}
                                      className="w-5 h-5 text-indigo-600 border-2 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                </div>
                                {selectedGrades.includes(grade.id) && primaryGrade === grade.id && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full shadow-md">
                                    Primary
                                  </div>
                                )}
                                {selectedGrades.includes(grade.id) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrimaryGradeSelection(grade.id);
                                    }}
                                    className={`mt-3 w-full py-2 text-xs font-medium rounded-lg transition-all ${
                                      primaryGrade === grade.id
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {primaryGrade === grade.id ? 'Primary Assignment' : 'Set as Primary'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {selectedGrades.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                              <p className="text-sm text-green-800">
                                ✓ {selectedGrades.length} grade level{selectedGrades.length !== 1 ? 's' : ''} selected
                                {primaryGrade && (
                                  <span className="ml-2">
                                    • Primary: {gradeSubjects.find((g: any) => g.id === primaryGrade)?.name}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">No grade levels available</p>
                          <p className="text-sm text-gray-500 mt-2">Please contact your school administrator</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Messages */}
                {(authError || submitError) && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Registration Error</p>
                      <p className="text-sm text-red-700 mt-1">{authError || submitError}</p>
                    </div>
                  </div>
                )}

                {/* Step 2 Action Buttons */}
                <div className="pt-6">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="px-6 py-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      <span>Previous Step</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || authLoading}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading || authLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Creating Your Account...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          <span className="text-base">Complete Registration</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 font-medium">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 font-medium">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
