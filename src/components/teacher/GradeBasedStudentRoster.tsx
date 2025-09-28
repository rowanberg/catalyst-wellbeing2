'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  GraduationCap, 
  Star, 
  Zap, 
  Heart, 
  TrendingUp, 
  Mail, 
  Phone, 
  User,
  Eye,
  UserCheck,
  BookOpen,
  Activity
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  grade: string
  xpPoints: number
  level: number
  streakDays: number
  mood: string
  wellbeingStatus: string
  parents: Array<{
    id: string
    name: string
    email: string
    phone: string
    relationship: string
  }>
}

const moodEmojis: Record<string, string> = {
  'happy': '😊',
  'excited': '🤩',
  'calm': '😌',
  'neutral': '😐',
  'tired': '😴',
  'sad': '😢',
  'anxious': '😰',
  'frustrated': '😤'
}

const wellbeingColors: Record<string, string> = {
  'thriving': 'bg-green-500',
  'doing-well': 'bg-blue-500',
  'managing': 'bg-yellow-500',
  'struggling': 'bg-orange-500',
  'needs-support': 'bg-red-500'
}

export default function GradeBasedStudentRoster() {
  const [grades, setGrades] = useState<any[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualSelection, setShowManualSelection] = useState(false)
  const [availableGrades] = useState([
    { grade_level: '1', subject: 'All Subjects' },
    { grade_level: '2', subject: 'All Subjects' },
    { grade_level: '3', subject: 'All Subjects' },
    { grade_level: '4', subject: 'All Subjects' },
    { grade_level: '5', subject: 'All Subjects' },
    { grade_level: '6', subject: 'All Subjects' },
    { grade_level: '7', subject: 'All Subjects' },
    { grade_level: '8', subject: 'All Subjects' },
    { grade_level: '9', subject: 'All Subjects' },
    { grade_level: '10', subject: 'All Subjects' },
    { grade_level: '11', subject: 'All Subjects' },
    { grade_level: '12', subject: 'All Subjects' }
  ])

  const { user } = useAppSelector((state) => state.auth)

  // Load teacher's grade assignments
  useEffect(() => {
    const loadGrades = async () => {
      try {
        const response = await fetch('/api/teacher/classes')
        if (response.ok) {
          const data = await response.json()
          setGrades(data.grades || [])
          // Auto-select first grade if available
          if (data.grades && data.grades.length > 0) {
            setSelectedGrade(data.grades[0].grade_level)
          }
        } else {
          setError('Failed to load grade assignments')
          setShowManualSelection(true)
        }
      } catch (error) {
        setLoading(false)
        setError('Error loading grade assignments')
        setShowManualSelection(true)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadGrades()
    }
  }, [user])

  // Load students when grade is selected
  useEffect(() => {
    if (!selectedGrade) return

    const loadStudents = async () => {
      setLoadingStudents(true)
      try {
        const response = await fetch(`/api/teacher/students?grade_level=${selectedGrade}`)
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
        } else {
          setError('Failed to load students')
        }
      } catch (error) {
        setLoadingStudents(false)
        setError('Error loading students')
      } finally {
        setLoadingStudents(false)
      }
    }

    if (selectedGrade) {
      loadStudents()
    }
  }, [selectedGrade])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Modern Loading Animation */}
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            className="relative w-20 h-20 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Outer rotating ring */}
            <motion.div
              className="absolute inset-0 border-4 border-gradient-to-r from-emerald-200 via-blue-200 to-purple-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            {/* Middle pulsing ring */}
            <motion.div
              className="absolute inset-2 border-3 border-transparent border-t-emerald-500 border-r-blue-500 border-b-purple-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner fast ring */}
            <motion.div
              className="absolute inset-4 border-2 border-transparent border-t-emerald-400 border-l-blue-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {/* Center icon with pulse */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 4, repeat: Infinity, ease: "linear" }
              }}
            >
              <GraduationCap className="w-8 h-8 text-emerald-600" />
            </motion.div>
          </motion.div>

          {/* Animated text */}
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.h3 
              className="text-xl font-semibold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading Your Classes
            </motion.h3>
            <motion.p 
              className="text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Gathering student information...
            </motion.p>
          </motion.div>

          {/* Floating dots animation */}
          <motion.div
            className="flex justify-center space-x-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400"
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            className="w-64 h-1 bg-slate-200 rounded-full overflow-hidden mt-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        {/* Loading skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * i, duration: 0.6 }}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                  <div className="space-y-2 flex-1">
                    <motion.div 
                      className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-md"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                    <motion.div 
                      className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-md w-2/3"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <motion.div 
                      key={j}
                      className="h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-md"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: (i * 0.2) + (j * 0.1) }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (error && !showManualSelection) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => setShowManualSelection(true)}
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Select Grade Levels Manually
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Manual Grade Selection or Error State */}
      {(showManualSelection || grades.length === 0) && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
              <GraduationCap className="h-5 w-5 text-orange-600" />
              Select Grade Level
            </CardTitle>
            <CardDescription>
              {error ? 'Unable to load your assigned grades. Please select a grade level to view students:' : 'Choose a grade level to view students:'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">⚠️ {error}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableGrades.map((grade) => (
                <Card 
                  key={grade.grade_level}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedGrade === grade.grade_level 
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedGrade(grade.grade_level)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900 text-sm">
                        Grade {grade.grade_level}
                      </h3>
                      <p className="text-xs text-gray-600">{grade.subject}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Grade Selector */}
      {!showManualSelection && grades.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Your Grade Levels
            </CardTitle>
            <CardDescription>
              Click on any grade level to view students in that class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grades.map((grade) => (
              <Card 
                key={`${grade.grade_level}-${grade.subject}`}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedGrade === grade.grade_level 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedGrade(grade.grade_level)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        Grade {grade.grade_level}
                      </h3>
                    </div>
                    {grade.is_primary_teacher && (
                      <Badge className="text-xs bg-green-500">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{grade.subject}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {grade.student_count} students
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      Click to view
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Grid */}
      {selectedGrade && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
              <Users className="h-5 w-5 text-green-600" />
              Students in Grade {selectedGrade}
              {grades.find(g => g.grade_level === selectedGrade) && (
                <span className="text-sm font-normal text-gray-600">
                  - {grades.find(g => g.grade_level === selectedGrade)?.subject}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Click on any student to view their details and parent information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-8">
                {/* Modern student loading animation */}
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    className="relative w-16 h-16 mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Animated rings */}
                    <motion.div
                      className="absolute inset-0 border-3 border-emerald-200 rounded-full"
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1.5, repeat: Infinity }
                      }}
                    />
                    <motion.div
                      className="absolute inset-2 border-2 border-transparent border-t-emerald-500 border-r-blue-500 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Center icon */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="w-6 h-6 text-emerald-600" />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.h4 
                      className="text-lg font-semibold text-emerald-700"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Loading Students
                    </motion.h4>
                    <p className="text-slate-600">Fetching student data...</p>
                  </motion.div>

                  {/* Bouncing dots */}
                  <motion.div
                    className="flex space-x-1 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-emerald-500 rounded-full"
                        animate={{ 
                          y: [0, -8, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>
                </div>

                {/* Student loading skeleton cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div
                      key={i}
                      className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i, duration: 0.5 }}
                    >
                      <div className="space-y-3">
                        {/* Header skeleton */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-10 h-10 bg-gradient-to-r from-emerald-200 to-blue-200 rounded-full"
                              animate={{ opacity: [0.4, 0.8, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                            />
                            <div className="space-y-2">
                              <motion.div 
                                className="h-4 w-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                              />
                              <motion.div 
                                className="h-3 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                              />
                            </div>
                          </div>
                          <motion.div 
                            className="w-8 h-8 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full"
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
                          />
                        </div>

                        {/* Stats skeleton */}
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex justify-between items-center">
                              <motion.div 
                                className="h-2 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, delay: (i * 0.1) + (j * 0.05) }}
                              />
                              <motion.div 
                                className="h-2 w-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, delay: (i * 0.1) + (j * 0.05) + 0.1 }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Button skeleton */}
                        <motion.div 
                          className="h-8 w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-md mt-3"
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Dialog key={student.id}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                <p className="text-sm text-gray-500">Grade {student.grade}</p>
                              </div>
                            </div>
                            <div className="text-2xl">
                              {moodEmojis[student.mood] || '😐'}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Wellbeing</span>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${wellbeingColors[student.wellbeingStatus] || 'bg-gray-400'}`}></div>
                                <span className="text-sm capitalize">{student.wellbeingStatus?.replace('-', ' ')}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">XP Points</span>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm font-medium">{student.xpPoints}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Level</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-blue-500" />
                                <span className="text-sm font-medium">{student.level}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Streak</span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-sm font-medium">{student.streakDays} days</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Parents</span>
                              <span className="text-sm font-medium">{student.parents.length}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>

                    {/* Student Details Modal */}
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          {student.name} - Student Details
                        </DialogTitle>
                        <DialogDescription>
                          Detailed information about the student and their parents (Read-only)
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Student Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Student Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Full Name</label>
                              <p className="text-gray-900">{student.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Email</label>
                              <p className="text-gray-900">{student.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Grade Level</label>
                              <p className="text-gray-900">Grade {student.grade}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Current Mood</label>
                              <p className="text-gray-900 flex items-center gap-1">
                                {moodEmojis[student.mood] || '😐'}
                                <span className="capitalize">{student.mood}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Academic Progress */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Academic Progress
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">XP Points</label>
                              <p className="text-gray-900 flex items-center gap-1">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                {student.xpPoints}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Current Level</label>
                              <p className="text-gray-900 flex items-center gap-1">
                                <Star className="h-4 w-4 text-blue-500" />
                                Level {student.level}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Streak Days</label>
                              <p className="text-gray-900 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                {student.streakDays} days
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Wellbeing Status</label>
                              <p className="text-gray-900 flex items-center gap-1">
                                <div className={`w-3 h-3 rounded-full ${wellbeingColors[student.wellbeingStatus] || 'bg-gray-400'}`}></div>
                                <span className="capitalize">{student.wellbeingStatus?.replace('-', ' ')}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Parent Information */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Parent/Guardian Information
                          </h3>
                          {student.parents.length > 0 ? (
                            <div className="space-y-4">
                              {student.parents?.map((parent: any, index: number) => (
                                <div key={parent.id} className="bg-white rounded-lg p-3 border border-green-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{parent.name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {parent.relationship || 'Guardian'}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-700">{parent.email}</span>
                                    </div>
                                    {parent.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-gray-500" />
                                        <span className="text-gray-700">{parent.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-sm">No parent information available</p>
                          )}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> This information is read-only. You cannot edit student details. 
                            Contact your school administrator for any updates needed.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-600">
                  {grades.length === 0 
                    ? "You haven't been assigned to any grade levels yet. Please contact your administrator."
                    : "This grade level doesn't have any students assigned yet."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {grades.length === 0 && !loading && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Grade Levels Assigned</h3>
            <p className="text-gray-600">
              You don't have any grade levels assigned yet. Contact your school administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
