'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Gem, 
  Users, 
  Search, 
  Calendar, 
  TrendingUp, 
  Award, 
  Star, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Plus,
  Minus,
  Send,
  History,
  Target,
  Trophy,
  BookOpen,
  Heart,
  Zap,
  Crown,
  Sparkles,
  X,
  Check,
  CreditCard,
  Shield,
  Fingerprint,
  Gift
} from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  current_gems: number
  level: number
  xp: number
  class_name: string
  avatar_url?: string
}

interface CreditTransaction {
  id: string
  student_id: string
  teacher_id: string
  amount: number
  reason: string
  created_at: string
  student_name: string
}

interface MonthlyStats {
  total_issued: number
  remaining_allowance: number
  transactions_count: number
}

const MONTHLY_LIMIT = 7000
const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500]
const PRESET_REASONS = [
  'Excellent participation',
  'Outstanding homework',
  'Helping classmates',
  'Creative thinking',
  'Perfect attendance',
  'Leadership skills',
  'Academic improvement',
  'Positive behavior',
  'Extra effort',
  'Team collaboration'
]

// Google Pay-like Full Screen Payment Animation Component
function PaymentAnimation({ 
  isVisible, 
  onComplete, 
  studentName, 
  amount,
  success = true
}: { 
  isVisible: boolean
  onComplete: () => void
  studentName: string
  amount: number
  success?: boolean
}) {
  const [currentStep, setCurrentStep] = useState<'processing' | 'success' | 'error'>('processing')

  useEffect(() => {
    if (isVisible) {
      // First show processing for 1.5 seconds
      const processingTimer = setTimeout(() => {
        setCurrentStep(success ? 'success' : 'error')
      }, 1500)

      // Then show result and auto-close after appropriate time
      const completeTimer = setTimeout(() => {
        onComplete()
        setCurrentStep('processing') // Reset for next time
      }, success ? 4500 : 5000) // Show error a bit longer

      return () => {
        clearTimeout(processingTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isVisible, onComplete, success])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[100] bg-white"
        >
          {/* Google Pay-like Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50" />
          
          {/* Animated Background Circles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.1 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  delay: i * 0.3,
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className={`absolute rounded-full ${
                  i === 0 ? 'w-64 h-64 bg-blue-200 top-10 -left-20' :
                  i === 1 ? 'w-48 h-48 bg-green-200 bottom-20 -right-10' :
                  'w-56 h-56 bg-purple-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                }`}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
            {currentStep === 'processing' ? (
              // Processing Animation
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                {/* Processing Icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <CreditCard className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 mb-4"
                >
                  Processing Payment
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-gray-600 mb-2"
                >
                  Sending {amount} Mind Gems
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xl font-semibold text-gray-800"
                >
                  to {studentName}
                </motion.p>

                {/* Loading Dots */}
                <div className="flex justify-center space-x-2 mt-8">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{
                        delay: i * 0.2,
                        duration: 0.8,
                        repeat: Infinity,
                        repeatDelay: 0.4
                      }}
                      className="w-3 h-3 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            ) : currentStep === 'success' ? (
              // Success Animation
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="text-center"
              >
                {/* Success Checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                  className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.6, delay: 0.5 }}
                  >
                    <Check className="w-16 h-16 text-white stroke-[3]" />
                  </motion.div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Successfully Paid!
                  </h2>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Gem className="w-6 h-6 text-purple-500" />
                      <span className="text-2xl font-bold text-purple-600">
                        {amount} Mind Gems
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2">sent to</p>
                    
                    <p className="text-xl font-semibold text-gray-900 mb-4">
                      {studentName}
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Transaction Complete</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-6">
                    Closing automatically in a few seconds...
                  </p>
                </motion.div>

                {/* Floating Gems Animation */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0.8, 0],
                      x: [0, (Math.random() - 0.5) * 300],
                      y: [0, -150 - Math.random() * 100],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{ 
                      delay: 1.2 + i * 0.15,
                      duration: 2,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                  >
                    <Gem className={`w-8 h-8 ${
                      i % 3 === 0 ? 'text-purple-500' :
                      i % 3 === 1 ? 'text-blue-500' : 'text-emerald-500'
                    }`} />
                  </motion.div>
                ))}

                {/* Confetti-like Stars */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      x: [0, (Math.random() - 0.5) * 400],
                      y: [0, -200 - Math.random() * 150],
                      opacity: [0, 1, 0],
                      rotate: [0, 360]
                    }}
                    transition={{ 
                      delay: 1.5 + i * 0.1,
                      duration: 1.8,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </motion.div>
            ) : currentStep === 'error' ? (
              // Error Animation
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="text-center"
              >
                {/* Error Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                  className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.6, delay: 0.5 }}
                  >
                    <X className="w-16 h-16 text-white stroke-[3]" />
                  </motion.div>
                </motion.div>

                {/* Error Message */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Payment Failed
                  </h2>
                  
                  <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-red-200/50 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <span className="text-xl font-semibold text-red-600">
                        Transaction Failed
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">
                      Could not send {amount} Mind Gems
                    </p>
                    
                    <p className="text-lg font-medium text-gray-900 mb-4">
                      to {studentName}
                    </p>
                    
                    <div className="bg-white/80 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600 mb-2">Possible reasons:</p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        <li>• Monthly limit exceeded</li>
                        <li>• Network connection issue</li>
                        <li>• Server temporarily unavailable</li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <X className="w-5 h-5" />
                      <span className="font-medium">Please try again</span>
                    </div>
                  </div>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    onClick={onComplete}
                    className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Try Again
                  </motion.button>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Or returning automatically in a few seconds...
                  </p>
                </motion.div>

                {/* Floating X marks for failed animation */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0.8, 0],
                      x: [0, (Math.random() - 0.5) * 200],
                      y: [0, -100 - Math.random() * 80],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{ 
                      delay: 1.2 + i * 0.1,
                      duration: 1.5,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                  >
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function IssueCreditsPage() {
  return <IssueCreditsContent />
}

function IssueCreditsContent() {
  const { user, profile } = useAppSelector((state) => state.auth)
  
  // All state variables
  const [assignedClasses, setAssignedClasses] = useState<any[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState<any>({
    total_issued: 0,
    remaining_allowance: 2000,
    transactions_count: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('issue')

  // Load students for selected class
  const handleClassChange = useCallback(async (classId: string) => {
    if (!classId) {
      setStudents([])
      setFilteredStudents([])
      setSelectedStudent(null)
      setSelectedClass('')
      return
    }

    console.log('🔄 Loading students for class:', classId)
    setSelectedClass(classId)
    setSelectedStudent(null)
    setSearchTerm('')
    setLoading(true)
    
    try {
      // Get students from API
      const apiUrl = `/api/teacher/students?school_id=${user?.school_id || profile?.school_id}&class_id=${classId}`
      console.log('📡 API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API Response:', data)
        
        // Transform the API data to match our expected format
        const studentsWithGems = data.students?.map((student: any) => ({
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          current_gems: student.current_gems || 0,
          level: student.level || 1,
          xp: student.xp || 0,
          class_name: student.class_name,
          avatar_url: student.avatar_url
        })) || []
        
        console.log('📊 Processed students:', studentsWithGems.length, studentsWithGems)
        setStudents(studentsWithGems)
        setFilteredStudents(studentsWithGems)
      } else {
        console.error('❌ Failed to load students:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('❌ Error details:', errorData)
        toast.error('Failed to load students')
        setStudents([])
        setFilteredStudents([])
      }
    } catch (error) {
      console.error('❌ Error loading students:', error)
      toast.error('Error loading students')
      setStudents([])
      setFilteredStudents([])
    } finally {
      setLoading(false)
    }
  }, [user?.school_id, profile?.school_id])

  // Filter students based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(student =>
        `${student.first_name} ${student.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    }
  }, [students, searchTerm])

  // Load monthly statistics
  const loadMonthlyStats = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/teacher/credit-stats?teacher_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setMonthlyStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading monthly stats:', error)
    }
  }, [user?.id])

  // Load recent transactions
  const loadRecentTransactions = useCallback(async (limit = 10) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/teacher/recent-transactions?teacher_id=${user.id}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setRecentTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }, [user?.id])

  // Load assigned classes
  const loadAssignedClasses = useCallback(async () => {
    if (!user?.id) return

    console.log('🔄 Loading assigned classes for teacher:', user.id)
    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/assigned-classes?teacher_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Assigned classes loaded:', data.classes?.length || 0, data.classes)
        setAssignedClasses(data.classes || [])
      } else {
        console.error('❌ Failed to load assigned classes:', response.status, response.statusText)
        toast.error('Failed to load assigned classes')
      }
    } catch (error) {
      console.error('❌ Error loading assigned classes:', error)
      toast.error('Error loading assigned classes')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load students for selected class
  const loadStudentsForClass = useCallback(async (classId: string) => {
    if (!classId) {
      setStudents([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/students?class_id=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('Failed to load students for class')
        toast.error('Failed to load students')
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Error loading students')
    } finally {
      setLoading(false)
    }
  }, [])


  // Initialize data
  useEffect(() => {
    loadMonthlyStats()
    loadRecentTransactions()
    loadAssignedClasses()
  }, [loadMonthlyStats, loadRecentTransactions, loadAssignedClasses])

  // Handle credit submission
  const handleSubmitCredits = async () => {
    if (!selectedStudent || !creditAmount || !user?.id) return

    const amount = parseInt(creditAmount)
    if (amount <= 0 || amount > 500) {
      toast.error('Please enter a valid amount (1-500)')
      return
    }

    if (monthlyStats.total_issued + amount > MONTHLY_LIMIT) {
      toast.error(`This would exceed your monthly limit of ${MONTHLY_LIMIT} gems`)
      return
    }

    const finalReason = reason === 'custom' ? customReason : reason
    if (!finalReason.trim()) {
      toast.error('Please provide a reason for issuing credits')
      return
    }

    // Start animation immediately
    setSubmitting(true)
    setPaymentSuccess(true) // Assume success, will change if API fails
    setShowPaymentAnimation(true)

    // Make API call in background while animation plays
    try {
      const response = await fetch('/api/teacher/issue-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          teacher_id: user.id,
          amount,
          reason: finalReason.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Payment successful, animation already running')
        setPaymentSuccess(true)
        
        // Update student's gem count locally
        setStudents(prev => prev.map(student => 
          student.id === selectedStudent.id 
            ? { ...student, current_gems: (student.current_gems || 0) + amount }
            : student
        ))
        
        // Update filtered students as well
        setFilteredStudents(prev => prev.map(student => 
          student.id === selectedStudent.id 
            ? { ...student, current_gems: (student.current_gems || 0) + amount }
            : student
        ))
        
        // Reset form after animation completes
        setTimeout(() => {
          setSelectedStudent(null)
          setCreditAmount('')
          setReason('')
          setCustomReason('')
          
          // Refresh stats and transactions
          loadMonthlyStats()
          loadRecentTransactions()
        }, 4600) // Slightly after animation completes

      } else {
        // API failed - animation will show error state
        const error = await response.json()
        console.error('❌ Payment failed:', error.message)
        setPaymentSuccess(false)
        // Animation will handle showing the error and auto-closing
      }
    } catch (error) {
      console.error('❌ Error issuing credits:', error)
      setPaymentSuccess(false)
      // Animation will handle showing the error and auto-closing
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && assignedClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-200/30 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight 
              }}
              animate={{ 
                y: -20,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="text-center relative z-10 max-w-md mx-auto px-6">
          {/* Professional Logo Animation */}
          <motion.div
            className="relative w-24 h-24 mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-purple-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gem className="w-10 h-10 text-purple-600" />
            </motion.div>
          </motion.div>

          {/* Professional Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Mind Gems System
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Initializing your credit distribution platform
            </p>
            
            {/* Loading Steps */}
            <div className="space-y-3 mt-8">
              {[
                { step: 'Loading assigned classes', delay: 0 },
                { step: 'Preparing student data', delay: 0.5 },
                { step: 'Setting up gem system', delay: 1 }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + item.delay, duration: 0.4 }}
                  className="flex items-center justify-center space-x-3 text-sm text-gray-600"
                >
                  <motion.div
                    className="w-2 h-2 bg-purple-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: item.delay 
                    }}
                  />
                  <span>{item.step}</span>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-8 w-full max-w-xs mx-auto"
            >
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Preparing your dashboard...</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {/* Breadcrumb - Hidden on mobile */}
            <div className="hidden sm:flex items-center text-sm text-gray-500 mb-3">
              <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-gray-900 font-medium">Issue Credits</span>
            </div>
            
            {/* Main Header - Responsive */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              {/* Title Section */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                  <Gem className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Issue Mind Gems</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Reward students for their achievements and efforts</p>
                  <p className="text-xs text-gray-600 sm:hidden">Send gems to students</p>
                </div>
              </div>
              
              {/* Stats Cards - Responsive */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
                <div className="text-center sm:text-right">
                  <div className="text-xs sm:text-sm text-gray-500">Remaining</div>
                  <div className="text-sm sm:text-lg font-semibold text-gray-900">
                    <span className="text-blue-600">{monthlyStats.remaining_allowance.toLocaleString()}</span>
                    <span className="text-gray-400 hidden sm:inline"> / {MONTHLY_LIMIT.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-center sm:text-right">
                  <div className="text-xs sm:text-sm text-gray-500">Issued</div>
                  <div className="text-sm sm:text-lg font-semibold text-emerald-600">
                    {monthlyStats.total_issued.toLocaleString()}
                  </div>
                </div>
                
                {/* Progress Bar - Mobile Only */}
                <div className="sm:hidden w-16">
                  <div className="text-xs text-gray-500 mb-1">Usage</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((monthlyStats.total_issued / MONTHLY_LIMIT) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round((monthlyStats.total_issued / MONTHLY_LIMIT) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Step 1: Select Class */}
          {!selectedClass && (
            <div className="p-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose a Class</h2>
                <p className="text-gray-600">Select the class you want to send gems to</p>
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading classes...</p>
                  </div>
                ) : assignedClasses.length > 0 ? (
                  assignedClasses.map((cls) => (
                  <motion.button
                    key={cls.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClassChange(cls.id)}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {cls.grade_level || 'Grade N/A'} - {cls.class_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cls.current_students || cls.student_count || 0} students
                        </p>
                      </div>
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    </div>
                  </motion.button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No classes assigned</p>
                    <p className="text-sm">Contact your administrator to assign classes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction History - After Class Selection */}
          {selectedClass && !selectedStudent && (
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <History className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Transaction History</h3>
                    <p className="text-xs text-gray-500">View all your gem transactions</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('history')
                    loadRecentTransactions(50) // Load more transactions for history view
                  }}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Student */}
          {selectedClass && !selectedStudent && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedClass('')}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">Choose Student</h2>
                <div></div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-lg border-2 rounded-xl"
                />
              </div>

              {/* Students List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <motion.button
                      key={student.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedStudent(student)}
                      className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {student.first_name} {student.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">Level {student.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-blue-600 font-semibold">
                            <Gem className="h-4 w-4" />
                            {student.current_gems.toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500">gems</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">
                      {searchTerm ? 'Try adjusting your search' : 'No students in this class'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Payment Flow */}
          {selectedStudent && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedStudent(null)}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">Send Gems</h2>
                <div></div>
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <div className="flex items-center gap-1 text-blue-600">
                      <Gem className="h-4 w-4" />
                      <span className="font-semibold">{selectedStudent.current_gems.toLocaleString()} gems</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <Label className="text-lg font-semibold text-gray-900 mb-3 block">Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="text-3xl font-bold text-center py-6 border-2 rounded-xl"
                    min="1"
                    max="500"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    gems
                  </div>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[10, 25, 50, 100, 250, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant={creditAmount === amount.toString() ? "default" : "outline"}
                      onClick={() => setCreditAmount(amount.toString())}
                      className="py-3 font-semibold"
                      disabled={monthlyStats.remaining_allowance < amount}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="mb-6">
                <Label className="text-lg font-semibold text-gray-900 mb-3 block">Reason</Label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg"
                >
                  <option value="">Select a reason...</option>
                  {PRESET_REASONS.map((presetReason) => (
                    <option key={presetReason} value={presetReason}>
                      {presetReason}
                    </option>
                  ))}
                  <option value="custom">Custom reason...</option>
                </select>

                {reason === 'custom' && (
                  <Textarea
                    placeholder="Enter custom reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="mt-3 p-4 border-2 border-gray-200 rounded-xl"
                    rows={3}
                  />
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSubmitCredits}
                disabled={
                  submitting || 
                  !creditAmount || 
                  !reason || 
                  (reason === 'custom' && !customReason.trim()) ||
                  parseInt(creditAmount || '0') <= 0 ||
                  parseInt(creditAmount || '0') > 500 ||
                  monthlyStats.remaining_allowance < parseInt(creditAmount || '0')
                }
                className="w-full py-4 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Send {creditAmount || '0'} gems</span>
                    <Gem className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History View */}
      {activeTab === 'history' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          >
            {/* Mobile-Optimized History Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <History className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold truncate">Transaction History</h2>
                    <p className="text-purple-100 text-xs sm:text-sm hidden sm:block">All your gem transactions</p>
                    <p className="text-purple-100 text-xs sm:hidden">Gem transactions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('issue')}
                  className="text-white hover:bg-white/20 p-2 flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            {/* History Content */}
            <div className="p-4 sm:p-6">
              {/* Mobile-Optimized Summary Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-2 sm:mb-0">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-green-600 font-medium">Transactions</p>
                      <p className="text-lg sm:text-xl font-bold text-green-900 truncate">
                        {monthlyStats.transactions_count || recentTransactions.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mb-2 sm:mb-0">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-purple-600 font-medium">Remaining</p>
                      <p className="text-lg sm:text-xl font-bold text-purple-900 truncate">
                        {monthlyStats.remaining_allowance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile-Optimized Transactions List */}
              <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Transactions</h3>
                
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                          {transaction.student_name ? transaction.student_name.split(' ').map((n: string) => n[0]).join('') : 'ST'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {transaction.student_name || 'Unknown Student'}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                {transaction.reason || 'No reason provided'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm sm:text-lg">
                                <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
                                +{transaction.amount}
                              </div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                Completed
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No transactions yet</p>
                    <p className="text-sm">Start issuing gems to see your transaction history</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Animation */}
      <PaymentAnimation
        isVisible={showPaymentAnimation}
        onComplete={() => setShowPaymentAnimation(false)}
        studentName={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}
        amount={parseInt(creditAmount || '0')}
        success={paymentSuccess}
      />
    </div>
  )
}