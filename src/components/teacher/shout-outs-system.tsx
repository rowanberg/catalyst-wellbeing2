'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  User
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

  useEffect(() => {
    fetchStudents()
    fetchShoutOuts()
    fetchTemplates()
  }, [])

  const fetchTeacherClasses = async () => {
    try {
      setLoadingClasses(true)
      console.log('🔍 Fetching teacher profile...')
      
      // Use the same pattern as other parts of the app - get user from auth first
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Not authenticated')
      }
      
      // Use the working /api/get-profile endpoint like other parts of the app
      const profileResponse = await fetch('/api/get-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      
      console.log('📋 Profile response status:', profileResponse.status)
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text()
        console.error('❌ Profile API error:', profileResponse.status, errorText)
        throw new Error(`Failed to fetch profile: ${profileResponse.status} - ${errorText}`)
      }
      
      const profileData = await profileResponse.json()
      console.log('✅ Profile data received:', profileData)
      const teacherId = profileData.id

      console.log('🔍 Fetching teacher classes for ID:', teacherId)
      console.log('🔗 API URL (same as teacher students page):', `/api/teacher/class-assignments`)
      
      // Use the same pattern as teacher students page - let API get teacher_id from session
      const response = await fetch(`/api/teacher/class-assignments`)
      
      console.log('📋 Response status:', response.status)
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Classes data received:', data)
        console.log('📊 Number of assignments:', data.assignments?.length || 0)
        console.log('📋 Assignment details:', data.assignments)
        setTeacherClasses(data.assignments || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Class assignments API error:', response.status, errorText)
        console.error('❌ Error response body:', errorText)
      }
    } catch (error: any) {
      console.error('❌ Error fetching teacher classes:', error)
      // Show user-friendly error
      alert('Unable to load classes. Please make sure you are logged in as a teacher.')
    } finally {
      setLoadingClasses(false)
    }
  }

  const fetchStudentsByClass = async (classId: string, schoolId: string) => {
    try {
      setLoadingStudents(true)
      const response = await fetch(`/api/teacher/students?school_id=${schoolId}&class_id=${classId}`)
      if (response.ok) {
        const data = await response.json()
        const formattedStudents = data.students.map((student: any) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          first_name: student.first_name,
          last_name: student.last_name,
          grade: student.grade_level || 'N/A',
          class_id: student.class_id,
          class_name: student.class_name,
          recentShoutOuts: 0 // This would come from shout-outs API
        }))
        setStudents(formattedStudents)
      }
    } catch (error: any) {
      console.error('Error fetching students by class:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchStudents = async () => {
    // This is now handled by fetchStudentsByClass
    // Keep for backward compatibility with existing shout-outs display
    try {
      const response = await fetch('/api/teacher/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error: any) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchShoutOuts = async () => {
    try {
      const response = await fetch('/api/teacher/shout-outs')
      if (response.ok) {
        const data = await response.json()
        setShoutOuts(data.shoutOuts)
      }
    } catch (error: any) {
      console.error('Error fetching shout-outs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/teacher/shout-out-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error)
    }
  }

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
        setCustomMessage('')
        setSelectedTemplate(null)
        setSelectedStudent(null)
        setSelectedClass(null)
        setModalStep('classes')
        setShowCreateModal(false)
        fetchShoutOuts()
        // Refresh students if we have a selected class
        if (selectedClass) {
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const profileResponse = await fetch('/api/get-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
              })
              const profileData = await profileResponse.json()
              const schoolId = profileData.school_id
              await fetchStudentsByClass(selectedClass.class_id, schoolId)
            }
          } catch (error) {
            console.error('Error refreshing students:', error)
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending shout-out:', error)
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredShoutOuts = shoutOuts.filter(shoutOut =>
    selectedCategory === 'all' || shoutOut.category === selectedCategory
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Professional Header Section */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Positive Shout-Outs</h1>
                <p className="text-white/90 text-sm sm:text-base">Recognize and celebrate student achievements</p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="px-4 sm:px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl border border-white/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="font-medium">Create Shout-Out</span>
            </motion.button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{shoutOuts.length}</div>
              <div className="text-xs sm:text-sm text-white/80">Total Shout-Outs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{students.length}</div>
              <div className="text-xs sm:text-sm text-white/80">Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{shoutOuts.filter(s => s.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length}</div>
              <div className="text-xs sm:text-sm text-white/80">This Week</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{Math.round((shoutOuts.filter(s => s.isPublic).length / Math.max(shoutOuts.length, 1)) * 100)}%</div>
              <div className="text-xs sm:text-sm text-white/80">Public</div>
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
                  <motion.button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student)
                      setShowCreateModal(true)
                    }}
                    className="p-3 text-left border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">{student.name}</div>
                    <div className="text-xs text-gray-500 truncate">{student.grade || 'Grade N/A'}</div>
                    <div className="flex items-center mt-1">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-gray-600">{student.recentShoutOuts || 0}</span>
                    </div>
                  </motion.button>
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
            <h2 className="text-xl font-bold flex items-center">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white mr-3">
                <Award className="h-6 w-6" />
              </div>
              Recent Shout-Outs
            </h2>
            
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
            
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredShoutOuts.map((shoutOut, index) => (
                <motion.div
                  key={shoutOut.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold border ${getCategoryColor(shoutOut.category)}`}>
                        {getCategoryIcon(shoutOut.category)}
                        <span className="ml-2 capitalize">{shoutOut.category}</span>
                      </div>
                      {shoutOut.badge && (
                        <span className="text-xl" title={shoutOut.badge}>{shoutOut.badge}</span>
                      )}
                      {shoutOut.isPublic && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Public
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(shoutOut.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{shoutOut.studentName}</h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">{shoutOut.message}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">by {shoutOut.teacherName}</span>
                    <div className="flex items-center text-red-500 bg-red-50 px-3 py-1 rounded-full">
                      <Heart className="h-4 w-4 mr-1" />
                      <span className="text-sm font-semibold">{shoutOut.reactions || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
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
              className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
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

              {/* Step 1: Class Selection */}
              {modalStep === 'classes' && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Select Your Class</h3>
                  {loadingClasses ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {teacherClasses.map((classAssignment) => (
                        <motion.button
                          key={classAssignment.id}
                          onClick={async () => {
                            setSelectedClass(classAssignment)
                            setModalStep('students')
                            // Get school_id from profile using the working API
                            try {
                              const { createClient } = await import('@supabase/supabase-js')
                              const supabase = createClient(
                                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                              )
                              const { data: { user } } = await supabase.auth.getUser()
                              if (user) {
                                const profileResponse = await fetch('/api/get-profile', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user.id }),
                                })
                                const profileData = await profileResponse.json()
                                const schoolId = profileData.school_id
                                await fetchStudentsByClass(classAssignment.class_id, schoolId)
                              }
                            } catch (error) {
                              console.error('Error fetching profile for school ID:', error)
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

              {/* Step 2: Student Selection */}
              {modalStep === 'students' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">Select a Student</h3>
                    <button
                      onClick={() => {
                        setModalStep('classes')
                        setSelectedClass(null)
                        setStudents([])
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      ← Back to Classes
                    </button>
                  </div>
                  
                  {selectedClass && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-900">{selectedClass.classes?.class_name}</div>
                      <div className="text-xs text-blue-700">{selectedClass.classes?.subject} • Grade {selectedClass.classes?.grade_levels?.grade_level}</div>
                    </div>
                  )}

                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {students.map((student) => (
                        <motion.button
                          key={student.id}
                          onClick={() => {
                            setSelectedStudent(student)
                            setModalStep('create')
                          }}
                          className="p-4 text-left border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="font-semibold text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-600">{student.grade}</div>
                          <div className="flex items-center mt-1">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-gray-600">{student.recentShoutOuts} recent</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  
                  {!loadingStudents && students.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg font-medium mb-2">No students found</p>
                      <p className="text-sm">This class doesn't have any students assigned yet.</p>
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
