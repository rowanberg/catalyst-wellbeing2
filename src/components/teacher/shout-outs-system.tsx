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
  avatar?: string
  grade?: string
  recentShoutOuts: number
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customMessage, setCustomMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ShoutOutTemplate | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchShoutOuts()
    fetchTemplates()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
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
        setShowCreateModal(false)
        fetchShoutOuts()
        fetchStudents() // Refresh to update recent shout-out counts
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
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Positive Shout-Outs</h1>
                <p className="text-lg text-gray-600">Recognize and celebrate student achievements</p>
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Shout-Out
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6 mb-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white mr-3">
                <User className="h-6 w-6" />
              </div>
              Select Student
            </h2>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.grade || 'Grade N/A'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-yellow-600">
                        <Star className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">{student.recentShoutOuts || 0}</span>
                      </div>
                      <p className="text-xs text-gray-500">recent</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Shout-Outs */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white mr-3">
                  <Award className="h-6 w-6" />
                </div>
                Recent Shout-Outs
              </h2>
              
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
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
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredShoutOuts.map((shoutOut, index) => (
                  <motion.div
                    key={shoutOut.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold border-2 ${getCategoryColor(shoutOut.category)}`}>
                          {getCategoryIcon(shoutOut.category)}
                          <span className="ml-2 capitalize">{shoutOut.category}</span>
                        </div>
                        {shoutOut.badge && (
                          <span className="text-2xl" title={shoutOut.badge}>{shoutOut.badge}</span>
                        )}
                        {shoutOut.isPublic && (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Public
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(shoutOut.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-3">{shoutOut.studentName}</h3>
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
                  <h2 className="text-2xl font-bold text-gray-900">Create Positive Shout-Out</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Student Selection in Modal */}
              {!selectedStudent && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Select a Student</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {students.map((student) => (
                      <motion.button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className="p-4 text-left border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="font-semibold text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.grade || 'Grade N/A'}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedStudent && (
                <>
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-full text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Recognizing</h3>
                          <p className="text-blue-700 font-semibold">{selectedStudent.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Change Student
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
