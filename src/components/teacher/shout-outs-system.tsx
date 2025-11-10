'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { toast } from 'sonner'
import { 
  Star, 
  Heart, 
  Trophy, 
  Zap, 
  Target, 
  Users, 
  Plus, 
  Send, 
  Search,
  Filter,
  Award,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  XCircle
} from 'lucide-react'

interface Student {
  id: string
  name: string
  first_name: string
  last_name: string
  avatar?: string
  grade?: string
  class_id: string
  class_name: string
  recentShoutOuts: number
}

interface TeacherClass {
  id: string
  class_id: string
  is_primary_teacher: boolean
  subject: string
  classes: {
    id: string
    class_name: string
    class_code: string
    subject: string
    room_number: string
    current_students: number
    max_students: number
    grade_levels: {
      grade_level: string
    }
  }
}

interface ShoutOut {
  id: string
  studentId: string
  studentName: string
  teacherName: string
  category: 'academic' | 'behavior' | 'kindness' | 'effort' | 'leadership' | 'creativity'
  message: string
  isPublic: boolean
  createdAt: string
  reactions: number
  badge?: string
}

interface ShoutOutTemplate {
  id: string
  category: string
  title: string
  message: string
  badge: string
  icon: string
}

// Memoized ShoutOut Card for better performance
const ShoutOutCard = memo(({ shoutOut, getCategoryColor, getCategoryIcon }: {
  shoutOut: ShoutOut
  getCategoryColor: (category: string) => string
  getCategoryIcon: (category: string) => JSX.Element
}) => {
  const formattedDate = useMemo(() => {
    const date = new Date(shoutOut.createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }, [shoutOut.createdAt])

  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCategoryColor(shoutOut.category)}`}>
            {getCategoryIcon(shoutOut.category)}
            <span className="ml-1.5 capitalize">{shoutOut.category}</span>
          </div>
          {shoutOut.badge && (
            <span className="text-lg" title={shoutOut.badge}>{shoutOut.badge}</span>
          )}
          {shoutOut.isPublic && (
            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium">
              <CheckCircle className="h-3 w-3 mr-1" />
              Public
            </span>
          )}
        </div>
        <div className="flex items-center text-gray-500 text-xs sm:text-sm">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          {formattedDate}
        </div>
      </div>
      
      <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">{shoutOut.studentName}</h3>
      <p className="text-gray-700 text-sm sm:text-base mb-3 leading-relaxed line-clamp-3">{shoutOut.message}</p>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs sm:text-sm text-gray-600 font-medium truncate mr-2">by {shoutOut.teacherName}</span>
        <div className="flex items-center text-red-500 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0">
          <Heart className="h-3.5 w-3.5 mr-1 fill-red-500" />
          <span className="text-xs sm:text-sm font-semibold">{shoutOut.reactions || 0}</span>
        </div>
      </div>
    </div>
  )
})

ShoutOutCard.displayName = 'ShoutOutCard'

export default function ShoutOutsSystem() {
  const [students, setStudents] = useState<Student[]>([])
  const [shoutOuts, setShoutOuts] = useState<ShoutOut[]>([])
  const [templates, setTemplates] = useState<ShoutOutTemplate[]>([])
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customMessage, setCustomMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ShoutOutTemplate | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [sending, setSending] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalStep, setModalStep] = useState<'classes' | 'students' | 'create'>('classes')
  const [displayLimit, setDisplayLimit] = useState(10)

  // Get user from Redux (same pattern as other teacher components)
  const { user } = useAppSelector((state) => state.auth)

  const fetchTeacherClasses = useCallback(async () => {
    try {
      setLoadingClasses(true)
      
      if (!user?.id) {
        toast.error('Please log in to view classes')
        setLoadingClasses(false)
        return
      }
      
      const response = await fetch(`/api/teacher/class-assignments`)
      
      if (response.ok) {
        const data = await response.json()
        setTeacherClasses(data.assignments || [])
      } else {
        toast.error('Failed to load classes')
      }
    } catch (error: any) {
      toast.error('Unable to load classes. Please try again.')
    } finally {
      setLoadingClasses(false)
    }
  }, [user?.id])

  const fetchStudentsByClass = useCallback(async (classId: string, schoolId: string) => {
    try {
      setLoadingStudents(true)
      
      const response = await fetch(`/api/teacher/students?school_id=${schoolId}&class_id=${classId}`, {
        next: { revalidate: 30 }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.students && Array.isArray(data.students)) {
          const formattedStudents = data.students.map((student: any) => ({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            first_name: student.first_name,
            last_name: student.last_name,
            grade: student.grade_level || 'N/A',
            class_id: student.class_id,
            class_name: student.class_name,
            recentShoutOuts: 0
          }))
          setStudents(formattedStudents)
        } else {
          setStudents([])
        }
      } else {
        toast.error('Failed to load students')
        setStudents([])
      }
    } catch (error: any) {
      toast.error('Error loading students')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [])


  const fetchShoutOuts = useCallback(async () => {
    try {
      const response = await fetch('/api/teacher/shout-outs', {
        next: { revalidate: 30 }
      })
      if (response.ok) {
        const data = await response.json()
        setShoutOuts(data.shoutOuts || [])
      }
    } catch (error: any) {
      toast.error('Failed to load shout-outs')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/teacher/shout-out-templates', {
        next: { revalidate: 300 }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error: any) {
      // Templates are optional, fail silently
    }
  }, [])

  // Load initial data
  useEffect(() => {
    fetchShoutOuts()
    fetchTemplates()
  }, [fetchShoutOuts, fetchTemplates])

  const sendShoutOut = async () => {
    if (!selectedStudent || (!customMessage.trim() && !selectedTemplate)) return

    setSending(true)
    try {
      const response = await fetch('/api/teacher/send-shout-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          category: selectedTemplate?.category || 'effort',
          message: customMessage.trim() || selectedTemplate?.message || '',
          isPublic,
          templateId: selectedTemplate?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`✨ Shout-out sent to ${selectedStudent.name}!`, {
          description: `+${data.xpAwarded || 50} XP awarded`
        })
        
        setCustomMessage('')
        setSelectedTemplate(null)
        setSelectedStudent(null)
        setSelectedClass(null)
        setModalStep('classes')
        setShowCreateModal(false)
        fetchShoutOuts()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Failed to send shout-out', {
          description: errorData.error || 'Please try again'
        })
      }
    } catch (error: any) {
      toast.error('Failed to send shout-out', {
        description: 'Check your internet connection'
      })
    } finally {
      setSending(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <Trophy className="h-4 w-4" />
      case 'behavior': return <Star className="h-4 w-4" />
      case 'kindness': return <Heart className="h-4 w-4" />
      case 'effort': return <Target className="h-4 w-4" />
      case 'leadership': return <Users className="h-4 w-4" />
      case 'creativity': return <Sparkles className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'behavior': return 'bg-green-100 text-green-700 border-green-200'
      case 'kindness': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'effort': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'leadership': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'creativity': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Memoize filtered lists for performance
  const filteredStudents = useMemo(() => 
    students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]
  )

  const filteredShoutOuts = useMemo(() => 
    shoutOuts.filter(shoutOut =>
      selectedCategory === 'all' || shoutOut.category === selectedCategory
    ), [shoutOuts, selectedCategory]
  )

  // Memoize stats calculations
  const stats = useMemo(() => ({
    thisWeek: shoutOuts.filter(s => 
      s.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    ).length,
    publicPercentage: Math.round(
      (shoutOuts.filter(s => s.isPublic).length / Math.max(shoutOuts.length, 1)) * 100
    )
  }), [shoutOuts])

  // Paginated shout-outs for better performance
  const displayedShoutOuts = useMemo(() => 
    filteredShoutOuts.slice(0, displayLimit),
    [filteredShoutOuts, displayLimit]
  )

  const hasMoreShoutOuts = filteredShoutOuts.length > displayLimit

  const loadMore = useCallback(() => {
    setDisplayLimit(prev => prev + 10)
  }, [])

  // Reset display limit when filter changes
  useEffect(() => {
    setDisplayLimit(10)
  }, [selectedCategory])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 mb-6 animate-pulse">
          <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Professional Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden mb-6 sm:mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
        <div className="relative z-10">
          {/* Title Section */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
              <Award className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Positive Shout-Outs</h1>
              <p className="text-white/90 text-xs sm:text-sm lg:text-base mt-0.5">Recognize and celebrate student achievements</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-colors">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{shoutOuts.length}</div>
              <div className="text-xs sm:text-sm text-white/80 mt-0.5">Total Shout-Outs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-colors">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{students.length}</div>
              <div className="text-xs sm:text-sm text-white/80 mt-0.5">Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-colors">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.thisWeek}</div>
              <div className="text-xs sm:text-sm text-white/80 mt-0.5">This Week</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-colors">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.publicPercentage}%</div>
              <div className="text-xs sm:text-sm text-white/80 mt-0.5">Public</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Student Selection Bar - Mobile First */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Quick Student Selection</h2>
            </div>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>
            
            <motion.button
              onClick={() => {
                setShowCreateModal(true)
                setModalStep('classes')
                fetchTeacherClasses()
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center shadow-md text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Quick Create
            </motion.button>
          </div>
          
          {/* Student Grid - Easy Selection */}
          {searchTerm && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {filteredStudents.slice(0, 12).map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student)
                      setShowCreateModal(true)
                    }}
                    className="p-3 text-left border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">{student.name}</div>
                    <div className="text-xs text-gray-500 truncate">{student.grade || 'Grade N/A'}</div>
                    <div className="flex items-center mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-xs text-gray-600">{student.recentShoutOuts || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
              {filteredStudents.length > 12 && (
                <div className="text-center mt-3">
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {filteredStudents.length} students →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        {/* Recent Shout-Outs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white mr-3">
                  <Award className="h-6 w-6" />
                </div>
                Recent Shout-Outs
              </h2>
              <p className="text-sm text-gray-500 mt-1 ml-14">
                Showing {displayedShoutOuts.length} of {filteredShoutOuts.length} shout-outs
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="behavior">Behavior</option>
                <option value="kindness">Kindness</option>
                <option value="effort">Effort</option>
                <option value="leadership">Leadership</option>
                <option value="creativity">Creativity</option>
              </select>
            </div>
          </div>
            
          <div className="space-y-3">
            {displayedShoutOuts.map((shoutOut) => (
              <ShoutOutCard key={shoutOut.id} shoutOut={shoutOut} getCategoryColor={getCategoryColor} getCategoryIcon={getCategoryIcon} />
            ))}
            
            {hasMoreShoutOuts && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                >
                  Load More ({filteredShoutOuts.length - displayLimit} remaining)
                </button>
              </div>
            )}
            
            {filteredShoutOuts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-12 w-12 opacity-50" />
                </div>
                <p className="text-lg font-medium mb-2">No shout-outs yet</p>
                <p className="text-sm">Start recognizing your students!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Shout-Out Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl border-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Hidden on Mobile */}
              <div className="hidden sm:flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Positive Shout-Out</h2>
                    <p className="text-sm text-gray-600">
                      {modalStep === 'classes' && 'Step 1: Select a class'}
                      {modalStep === 'students' && 'Step 2: Choose a student'}
                      {modalStep === 'create' && 'Step 3: Write your shout-out'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setModalStep('classes')
                    setSelectedClass(null)
                    setSelectedStudent(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Mobile Close Button - Top Right */}
              <div className="sm:hidden flex justify-end mb-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setModalStep('classes')
                    setSelectedClass(null)
                    setSelectedStudent(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Step 1: Class Selection */}
              {modalStep === 'classes' && (
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Select Your Class</h3>
                  {loadingClasses ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {teacherClasses.map((classAssignment) => (
                        <motion.button
                          key={classAssignment.id}
                          onClick={async () => {
                            setSelectedClass(classAssignment)
                            setModalStep('students')
                            
                            if (!user?.id) {
                              toast.error('Please log in to continue')
                              return
                            }
                            
                            try {
                              const profileResponse = await fetch('/api/get-profile', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user.id }),
                              })
                              
                              if (profileResponse.ok) {
                                const profileData = await profileResponse.json()
                                await fetchStudentsByClass(classAssignment.class_id, profileData.school_id)
                              } else {
                                toast.error('Failed to load class data')
                              }
                            } catch (error) {
                              toast.error('Error loading students')
                            }
                          }}
                          className="p-4 text-left border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{classAssignment.classes?.class_name}</div>
                              <div className="text-sm text-gray-600">
                                {classAssignment.classes?.subject} • Grade {classAssignment.classes?.grade_levels?.grade_level}
                              </div>
                              <div className="text-xs text-gray-500">
                                Room {classAssignment.classes?.room_number} • {classAssignment.classes?.current_students} students
                              </div>
                            </div>
                            <div className="text-right">
                              {classAssignment.is_primary_teacher && (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {!loadingClasses && teacherClasses.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="bg-blue-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-12 w-12 text-blue-400" />
                      </div>
                      <p className="text-lg font-medium mb-2 text-gray-800">No Classes Assigned Yet</p>
                      <p className="text-sm text-gray-600 mb-4">You need to be assigned to classes before you can create shout-outs for students.</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">To get started:</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>• Contact your school administrator</p>
                          <p>• Visit the <a href="/teacher/students" className="text-blue-600 hover:text-blue-800 underline">Teacher Students</a> page</p>
                          <p>• Request class assignments</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Enhanced Student Selection */}
              {modalStep === 'students' && (
                <div className="space-y-3">
                  {/* Search Bar - Top Priority */}
                  {!loadingStudents && students.length > 0 && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-300 text-base font-medium"
                          autoFocus
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                          >
                            <XCircle className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 font-medium">
                          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} {searchTerm ? 'found' : 'available'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Compact Class Info + Back Button */}
                  {selectedClass && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                          <GraduationCap className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-blue-900 text-sm leading-tight truncate">{selectedClass.classes?.class_name}</div>
                          <div className="text-xs text-blue-600 mt-0.5 hidden sm:block">{selectedClass.classes?.subject} • Grade {selectedClass.classes?.grade_levels?.grade_level}</div>
                        </div>
                        <div className="text-right flex-shrink-0 px-2">
                          <div className="text-xl font-bold text-blue-600 leading-none">{students.length}</div>
                          <div className="text-[10px] text-blue-600 uppercase tracking-wide mt-0.5">students</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setModalStep('classes')
                          setSelectedClass(null)
                          setStudents([])
                          setSearchTerm('')
                        }}
                        className="ml-2.5 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 px-3 py-2 hover:bg-blue-100 rounded-lg transition-all duration-200 flex-shrink-0 font-medium"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back</span>
                      </button>
                    </div>
                  )}

                  {loadingStudents ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                        <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
                      </div>
                      <p className="mt-4 text-gray-600 font-medium">Loading students...</p>
                      <p className="text-sm text-gray-400 mt-1">Please wait</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredStudents.map((student, index) => {
                        // Generate initials and color for avatar
                        const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase() || 'ST'
                        const colors = [
                          'bg-gradient-to-br from-blue-500 to-blue-600',
                          'bg-gradient-to-br from-purple-500 to-purple-600',
                          'bg-gradient-to-br from-green-500 to-green-600',
                          'bg-gradient-to-br from-orange-500 to-orange-600',
                          'bg-gradient-to-br from-pink-500 to-pink-600',
                          'bg-gradient-to-br from-indigo-500 to-indigo-600'
                        ]
                        const colorClass = colors[index % colors.length]
                        
                        return (
                          <motion.button
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(student)
                              setModalStep('create')
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="group relative p-3.5 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative flex items-center gap-3">
                              {/* Avatar with initials */}
                              <div className={`flex-shrink-0 w-11 h-11 ${colorClass} rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md`}>
                                {initials}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate text-[15px] leading-tight">
                                  {student.name}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                  <GraduationCap className="h-3 w-3" />
                                  Grade {student.grade}
                                </div>
                                
                                {/* Stats */}
                                <div className="flex items-center gap-2.5 mt-1.5">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium">{student.recentShoutOuts}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                    <Sparkles className="h-3 w-3" />
                                    Ready
                                  </div>
                                </div>
                              </div>
                              
                              {/* Arrow indicator */}
                              <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors">
                                <ArrowRight className="h-4.5 w-4.5" />
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                  
                  {!loadingStudents && students.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="bg-blue-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-12 w-12 text-blue-400" />
                      </div>
                      <p className="text-lg font-medium mb-2 text-gray-800">No students found</p>
                      <p className="text-sm text-gray-600">This class doesn't have any students assigned yet.</p>
                    </div>
                  )}
                  
                  {!loadingStudents && students.length > 0 && filteredStudents.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2 text-gray-800">No matching students</p>
                      <p className="text-sm text-gray-600">Try adjusting your search term</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 3: Create Shout-Out */}
              {modalStep === 'create' && selectedStudent && (
                <>
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-full text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Recognizing</h3>
                          <p className="text-blue-700 font-semibold">{selectedStudent?.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setModalStep('students')
                          setSelectedStudent(null)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        ← Back to Students
                      </button>
                    </div>
                  </div>
                  
                  {/* Template Selection */}
                  <div className="mb-8">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Choose a Template (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <motion.div
                          key={template.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedTemplate?.id === template.id
                              ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex items-center mb-2">
                            <span className="text-lg mr-2">{template.icon}</span>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
                              {getCategoryIcon(template.category)}
                              <span className="ml-1">{template.category}</span>
                            </div>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
                          <p className="text-sm text-gray-600">{template.message}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Message */}
                  <div className="mb-8">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      {selectedTemplate ? 'Add Custom Message (Optional)' : 'Write Your Message'}
                    </h3>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder={selectedTemplate ? 'Add additional details...' : 'Write a positive message about this student...'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      rows={5}
                      maxLength={500}
                    />
                    <div className="text-sm text-gray-500 mt-2 flex justify-between">
                      <span>{customMessage.length}/500 characters</span>
                      <span className={customMessage.length > 400 ? 'text-orange-500' : ''}>
                        {customMessage.length > 400 ? 'Almost at limit' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Visibility Settings */}
                  <div className="mb-8">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Visibility</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="visibility"
                          checked={isPublic}
                          onChange={() => setIsPublic(true)}
                          className="mr-3 w-4 h-4"
                        />
                        <div>
                          <span className="font-medium">Public</span>
                          <p className="text-sm text-gray-600">Visible to student, parents, and other teachers</p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="visibility"
                          checked={!isPublic}
                          onChange={() => setIsPublic(false)}
                          className="mr-3 w-4 h-4"
                        />
                        <div>
                          <span className="font-medium">Private</span>
                          <p className="text-sm text-gray-600">Visible only to student and parents</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Send Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={sendShoutOut}
                      disabled={(!customMessage.trim() && !selectedTemplate) || sending}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 flex items-center font-medium shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="h-5 w-5 mr-2" />
                      )}
                      Send Shout-Out
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
