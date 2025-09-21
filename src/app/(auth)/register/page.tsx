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
  gradeLevel: z.string().optional(),
  className: z.string().optional(),
  classIds: z.array(z.string()).optional(),
  primaryClassId: z.string().optional(),
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
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [primaryClass, setPrimaryClass] = useState<string>('')
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('')
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

  // Fetch available grade levels when school is verified
  useEffect(() => {
    if (schoolVerified && schoolName) {
      fetchAvailableGradeLevels()
    }
  }, [schoolVerified, schoolName])

  const fetchAvailableGradeLevels = async () => {
    if (!schoolId) return

    try {
      setLoadingGrades(true)
      
      // Get school UUID from school code
      const schoolResponse = await fetch('/api/verify-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })

      if (!schoolResponse.ok) {
        throw new Error('Failed to verify school')
      }

      const schoolData = await schoolResponse.json()
      
      // Fetch grade levels using school UUID
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

  // Load available classes for students when grade is selected
  const loadAvailableClasses = async (schoolId: string, gradeLevel?: string) => {
    if (!schoolId) return

    // For teachers, use existing logic
    if (selectedRole === 'teacher') {
      setIsLoadingClasses(true)
      try {
        const response = await fetch(`/api/classes?school_id=${schoolId}`)
        if (response.ok) {
          const data = await response.json()
          setAvailableClasses(data.classes || [])
        } else {
          console.error('Failed to load classes')
          setAvailableClasses([])
        }
      } catch (error) {
        console.error('Error loading classes:', error)
        setAvailableClasses([])
      } finally {
        setIsLoadingClasses(false)
      }
      return
    }

    // For students, load classes by grade level
    if (selectedRole === 'student' && gradeLevel) {
      setIsLoadingClasses(true)
      try {
        console.log('Loading classes for:', { schoolId, gradeLevel })
        const response = await fetch(`/api/registration/classes?schoolId=${schoolId}&gradeLevel=${gradeLevel}`)
        if (response.ok) {
          const data = await response.json()
          setAvailableClasses(data.classes || [])
          if (data.classes && data.classes.length > 0) {
            addToast({
              type: 'success',
              title: 'Classes Loaded',
              description: `Found ${data.classes.length} class${data.classes.length !== 1 ? 'es' : ''} for Grade ${gradeLevel}`
            })
          }
        } else {
          console.error('Failed to load classes - Response not OK:', response.status, response.statusText)
          const errorData = await response.text()
          console.error('Error response:', errorData)
          setAvailableClasses([])
          addToast({
            type: 'error',
            title: 'Failed to Load Classes',
            description: `Could not load classes for Grade ${gradeLevel}. Please try again.`
          })
        }
      } catch (error) {
        console.error('Error loading classes:', error)
        setAvailableClasses([])
        addToast({
          type: 'error',
          title: 'Network Error',
          description: 'Unable to connect to server. Please check your connection.'
        })
      } finally {
        setIsLoadingClasses(false)
      }
    }
  }

  // Handle class selection
  const handleClassSelection = (classId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedClasses(prev => [...prev, classId])
    } else {
      setSelectedClasses(prev => prev.filter(id => id !== classId))
      // If removing primary class, clear primary selection
      if (classId === primaryClass) {
        setPrimaryClass('')
      }
    }
  }

  // Handle primary class selection
  const handlePrimaryClassSelection = (classId: string) => {
    setPrimaryClass(classId)
    // Ensure primary class is also selected
    if (!selectedClasses.includes(classId)) {
      setSelectedClasses(prev => [...prev, classId])
    }
  }

  // Handle grade selection
  const handleGradeSelection = (gradeId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedGrades(prev => [...prev, gradeId])
    } else {
      setSelectedGrades(prev => prev.filter(id => id !== gradeId))
      // If this was the primary grade, clear it
      if (primaryGrade === gradeId) {
        setPrimaryGrade('')
      }
    }
  }

  // Handle primary grade selection
  const handlePrimaryGradeSelection = (gradeId: string) => {
    setPrimaryGrade(gradeId)
  }

  // Verify student email and ID
  const verifyStudentEmail = async (email: string, studentId: string) => {
    if (!email || !studentId) return

    setIsVerifyingChild(true)
    try {
      // Test if API routes are working
      const testResponse = await fetch('/api/test-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      })
      
      console.log('Test API response:', testResponse.status)
      
      const response = await fetch('/api/verify-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, studentId })
      })

      if (response.ok) {
        const data = await response.json()
        const student = data.student
        
        // Add verified student to children list
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

  // Add child email and ID
  const addChildEmail = () => {
    if (currentChildEmail && currentChildId && !children.find(c => c.email === currentChildEmail)) {
      verifyStudentEmail(currentChildEmail, currentChildId)
    }
  }

  // Remove child from list
  const removeChild = (email: string) => {
    setChildren(prev => prev.filter(c => c.email !== email))
  }

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

  const onSubmit = async (data: RegisterForm) => {
    if (!schoolVerified) {
      setSubmitError('Please verify your school ID first')
      return
    }

    // For parents, ensure at least one child is added
    if (data.role === 'parent' && children.length === 0) {
      setSubmitError('Please add at least one child to your account')
      return
    }

    // For teachers, ensure at least one grade is selected
    if (data.role === 'teacher' && selectedGrades.length === 0) {
      setSubmitError('Please select at least one grade level to teach')
      return
    }

    setIsLoading(true)
    setSubmitError(null)
    
    try {
      const result = await dispatch(signUp({
        schoolId: data.schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        gradeLevel: data.gradeLevel,
        className: data.className,
      })).unwrap()

      if (result.user) {
        // If teacher, assign grade levels
        if (data.role === 'teacher' && selectedGrades.length > 0) {
          console.log('Attempting to assign grade levels for teacher:', data.email)
          console.log('Grade levels to assign:', selectedGrades)
          
          // Add a small delay to ensure teacher profile is created
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          try {
            const response = await fetch('/api/classes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                teacherId: result.user.id,
                gradeAssignments: selectedGrades.map(gradeId => {
                  const grade = gradeSubjects.find(g => g.id === gradeId)
                  return {
                    id: gradeId,
                    grade_level: grade?.grade_level,
                    subject: grade?.subject
                  }
                }),
                primaryGradeId: primaryGrade
              })
            })

            const responseData = await response.json()
            console.log('Grade assignment API response:', { status: response.status, data: responseData })

            if (!response.ok) {
              console.error('Failed to assign grade levels:', responseData)
              setSubmitError(`Warning: Account created but failed to assign grade levels: ${responseData.error}`)
            } else {
              console.log('Successfully assigned grade levels:', responseData)
            }
          } catch (error) {
            console.error('Error assigning grade levels:', error)
            setSubmitError('Warning: Account created but failed to assign grade levels due to network error')
          }
        }

        // If parent, save parent-child relationships
        if (data.role === 'parent' && children.length > 0) {
          console.log('Attempting to save parent-child relationships for:', data.email)
          console.log('Children to link:', children.map(c => ({ email: c.email, name: c.name })))
          
          // Add a small delay to ensure parent profile is created
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          try {
            const response = await fetch('/api/parent-child-relationships', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                parentEmail: data.email,
                childrenEmails: children.map(c => c.email)
              })
            })

            const responseData = await response.json()
            console.log('Parent-child API response:', { status: response.status, data: responseData })

            if (!response.ok) {
              console.error('Failed to save parent-child relationships:', responseData)
              
              // Retry once after another delay if parent not found
              if (response.status === 404 && responseData.error?.includes('Parent profile not found')) {
                console.log('Parent profile not found, retrying in 3 seconds...')
                await new Promise(resolve => setTimeout(resolve, 3000))
                
                const retryResponse = await fetch('/api/parent-child-relationships', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({
                    parentEmail: data.email,
                    childrenEmails: children.map(c => c.email)
                  })
                })
                
                const retryData = await retryResponse.json()
                console.log('Retry API response:', { status: retryResponse.status, data: retryData })
                
                if (!retryResponse.ok) {
                  setSubmitError(`Warning: Account created but failed to link children: ${retryData.error}`)
                } else {
                  console.log('Successfully saved parent-child relationships on retry:', retryData)
                }
              } else {
                setSubmitError(`Warning: Account created but failed to link children: ${responseData.error}`)
              }
            } else {
              console.log('Successfully saved parent-child relationships:', responseData)
            }
          } catch (error) {
            console.error('Error saving parent-child relationships:', error)
            setSubmitError('Warning: Account created but failed to link children due to network error')
          }
        }

        router.push('/login?message=Registration successful! Please check your email to verify your account.')
      }
    } catch (error) {
      const handledError = handleError(error)
      if (handledError instanceof ValidationError) {
        setSubmitError(handledError.message)
      } else if (handledError instanceof AuthError) {
        setSubmitError(handledError.message)
      } else {
        setSubmitError('Registration failed. Please try again.')
      }
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
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin"></div>
                      </div>
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

              {/* Parent-specific fields - Children Management */}
              {selectedRole === 'parent' && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-400" />
                    <Label className="text-emerald-400 font-semibold">Add Your Children</Label>
                  </div>
                  
                  {/* Add child email and ID inputs */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={currentChildEmail}
                        onChange={(e) => setCurrentChildEmail(e.target.value)}
                        type="email"
                        className="flex-1 pl-4 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                        placeholder="Enter your child's email address"
                        disabled={isVerifyingChild}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={currentChildId}
                        onChange={(e) => setCurrentChildId(e.target.value)}
                        type="text"
                        className="flex-1 pl-4 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                        placeholder="Enter your child's student ID"
                        disabled={isVerifyingChild}
                      />
                      <Button
                        type="button"
                        onClick={addChildEmail}
                        disabled={!currentChildEmail || !currentChildId || isVerifyingChild}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isVerifyingChild ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-white/60 text-xs">
                      Both email address and student ID are required to verify your child's account
                    </p>
                  </div>

                  {/* Display verified children */}
                  {children.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-white/80">Verified Children:</Label>
                      {children.map((child, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {child.verified ? (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{child.name}</p>
                              <p className="text-white/60 text-sm">{child.email}</p>
                              <p className="text-emerald-400 text-sm">{child.school}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeChild(child.email)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {children.length === 0 && (
                    <p className="text-white/60 text-sm text-center py-4">
                      Enter your child's email address to verify and add them to your account.
                    </p>
                  )}
                </div>
              )}

              {/* Teacher-specific fields - Grade Level Selection */}
              {selectedRole === 'teacher' && schoolVerified && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-400" />
                    <Label className="text-blue-400 font-semibold">Select Your Grade Levels</Label>
                  </div>
                  
                  {isVerifyingSchool ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                      </div>
                      <div>
                        <p className="text-blue-400 font-medium text-sm">Verifying School</p>
                        <p className="text-blue-300/70 text-xs">Please wait while we validate your school ID...</p>
                      </div>
                    </div>
                  ) : schoolVerified ? (
                    gradeSubjects.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-white/70 text-sm">
                          Select the grade levels and subjects you will be teaching. Choose one as your primary assignment.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {gradeSubjects.map((grade) => (
                            <div
                              key={grade.id}
                              className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                selectedGrades.includes(grade.id)
                                  ? 'bg-blue-500/20 border-blue-400/50 shadow-lg'
                                  : 'bg-white/5 border-white/20 hover:bg-white/10'
                              }`}
                              onClick={() => handleGradeSelection(grade.id, !selectedGrades.includes(grade.id))}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{grade.name}</h4>
                                  <p className="text-white/60 text-xs">Grade {grade.grade_level}</p>
                                  {grade.subject && (
                                    <p className="text-blue-300 text-xs">{grade.subject}</p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedGrades.includes(grade.id)}
                                    onChange={(e) => handleGradeSelection(grade.id, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  {selectedGrades.includes(grade.id) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePrimaryGradeSelection(grade.id)
                                      }}
                                      className={`text-xs px-2 py-1 rounded transition-colors ${
                                        primaryGrade === grade.id
                                          ? 'bg-yellow-500 text-yellow-900'
                                          : 'bg-white/20 text-white/80 hover:bg-white/30'
                                      }`}
                                    >
                                      {primaryGrade === grade.id ? 'Primary' : 'Set Primary'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {selectedGrades.length > 0 && (
                          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                            <p className="text-blue-200 text-sm">
                              ✓ Selected {selectedGrades.length} grade level{selectedGrades.length !== 1 ? 's' : ''}
                              {primaryGrade && (
                                <span className="ml-2">
                                  • Primary: {gradeSubjects.find(g => g.id === primaryGrade)?.name}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : loadingGrades ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-white/60 text-sm">Loading grade levels...</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <GraduationCap className="h-12 w-12 text-white/30 mx-auto mb-3" />
                        <p className="text-white/60 text-sm">
                          No grade levels available for this school yet.
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          Contact your school administrator to set up grade levels.
                        </p>
                      </div>
                    )
                  ) : null}
                </div>
              )}

              {/* Student-specific fields */}
              {watch('role') === 'student' && schoolVerified && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-400" />
                    <Label className="text-emerald-400 font-semibold">Select Your Grade and Class</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Grade (Standard)</Label>
                      <Select onValueChange={(value) => {
                        setValue('gradeLevel', value)
                        setSelectedGradeLevel(value)
                        setAvailableClasses([]) // Clear previous classes
                        setValue('className', '') // Clear selected class
                      }}>
                        <SelectTrigger className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeSubjects.length > 0 ? (
                            // Get unique grade levels from the school's grade subjects
                            Array.from(new Set(gradeSubjects.map(grade => grade.grade_level)))
                              .sort((a, b) => parseInt(a) - parseInt(b))
                              .map(gradeLevel => (
                                <SelectItem key={gradeLevel} value={gradeLevel}>
                                  Grade {gradeLevel}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="" disabled>
                              {loadingGrades ? 'Loading grades...' : 'No grades available'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Class</Label>
                      {selectedGradeLevel ? (
                        isLoadingClasses ? (
                          <div className="flex items-center justify-center py-3 bg-white/10 border border-white/20 rounded-xl">
                            <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mr-2"></div>
                            <span className="text-white/60 text-sm">Loading classes...</span>
                          </div>
                        ) : availableClasses.length > 0 ? (
                          <Select onValueChange={(value) => setValue('className', value)}>
                            <SelectTrigger className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm transition-all duration-200">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableClasses.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.class_name} {cls.subject && `- ${cls.subject}`}
                                  {cls.room_number && ` (Room ${cls.room_number})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="py-3 px-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                            <p className="text-yellow-200 text-sm">No classes available for Grade {selectedGradeLevel}</p>
                            <p className="text-yellow-300/70 text-xs mt-1">Contact your school administrator</p>
                          </div>
                        )
                      ) : (
                        <div className="py-3 px-4 bg-white/5 border border-white/20 rounded-xl">
                          <p className="text-white/60 text-sm">Select a grade first</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedGradeLevel && availableClasses.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3">
                      <p className="text-emerald-200 text-sm">
                        ✓ {availableClasses.length} class{availableClasses.length !== 1 ? 'es' : ''} available for Grade {selectedGradeLevel}
                      </p>
                    </div>
                  )}
                </div>
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
