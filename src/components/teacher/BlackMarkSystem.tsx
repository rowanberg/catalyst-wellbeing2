'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { toast } from 'sonner'
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  MessageSquare,
  AlertCircle,
  BookOpen,
  Users,
  Shield,
  Target
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BlackMark {
  id: string
  student_id: string
  student_name: string
  teacher_id: string
  school_id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  remedy_description: string
  remedy_type: string
  remedy_due_date: string | null
  remedy_completed_at: string | null
  teacher_notes: string | null
  student_response: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  grade_level: string
  class_name: string
  current_gems?: number
  level?: number
  xp?: number
}

interface AssignedClass {
  id: string
  class_name: string
  class_code: string
  subject: string
  grade_level: string
  total_students: number
}

const CATEGORIES = [
  { value: 'behavioral', label: 'Behavioral', icon: Users, color: 'bg-red-100 text-red-800' },
  { value: 'academic', label: 'Academic', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  { value: 'attendance', label: 'Attendance', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'conduct', label: 'Conduct', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  { value: 'safety', label: 'Safety', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' }
]

const SEVERITIES = [
  { value: 'minor', label: 'Minor', color: 'bg-green-100 text-green-800' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'major', label: 'Major', color: 'bg-orange-100 text-orange-800' },
  { value: 'severe', label: 'Severe', color: 'bg-red-100 text-red-800' }
]

const REMEDY_TYPES = [
  { value: 'assignment', label: 'Written Assignment', icon: FileText },
  { value: 'community_service', label: 'Community Service', icon: Users },
  { value: 'reflection', label: 'Reflection Essay', icon: MessageSquare },
  { value: 'apology', label: 'Formal Apology', icon: MessageSquare },
  { value: 'behavior_plan', label: 'Behavior Plan', icon: Target },
  { value: 'parent_meeting', label: 'Parent Meeting', icon: Users },
  { value: 'detention', label: 'Detention', icon: Clock },
  { value: 'counseling', label: 'Counseling Session', icon: MessageSquare }
]

export default function BlackMarkSystem() {
  const [blackMarks, setBlackMarks] = useState<BlackMark[]>([])
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedBlackMark, setSelectedBlackMark] = useState<BlackMark | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    category: '',
    severity: 'minor',
    remedyDescription: '',
    remedyType: '',
    remedyDueDate: ''
  })

  // Get user from Redux (same pattern as other teacher components)
  const { user, profile } = useAppSelector((state) => state.auth)

  useEffect(() => {
    fetchBlackMarks()
    if (user?.id) {
      fetchAssignedClasses()
    }
  }, [user?.id])

  const fetchBlackMarks = async () => {
    try {
      const response = await fetch('/api/teacher/black-marks', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setBlackMarks(data.blackMarks || [])
      } else {
        console.error('Failed to fetch black marks:', response.status)
      }
    } catch (error) {
      console.error('Error fetching black marks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedClasses = async () => {
    if (!user?.id) return
    
    console.log('🔍 Fetching assigned classes for teacher:', user.id)
    try {
      const response = await fetch(`/api/teacher/assigned-classes?teacher_id=${user.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Assigned classes loaded:', data.classes)
        setAssignedClasses(data.classes || [])
      } else {
        console.error('❌ Failed to load assigned classes:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching assigned classes:', error)
    }
  }

  const fetchStudentsForClass = async (classId: string) => {
    if (!classId) {
      setStudents([])
      return
    }

    setLoadingStudents(true)
    try {
      const schoolId = user?.school_id || profile?.school_id
      const apiUrl = `/api/teacher/students?school_id=${schoolId}&class_id=${classId}`
      console.log('🔍 Fetching students from:', apiUrl)
      
      const response = await fetch(apiUrl, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Students loaded:', data.students)
        
        // Transform the API data to match our expected format
        const transformedStudents: Student[] = data.students?.map((student: any) => ({
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          grade_level: student.grade_level,
          class_name: student.class_name,
          current_gems: student.current_gems || 0,
          level: student.level || 1,
          xp: student.xp || 0
        })) || []
        
        setStudents(transformedStudents)
      } else {
        console.error('Failed to load students')
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  // Handle class selection change
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setFormData({ ...formData, studentId: '' }) // Reset student selection
    fetchStudentsForClass(classId)
  }

  const handleCreateBlackMark = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/teacher/black-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setFormData({
          studentId: '',
          title: '',
          description: '',
          category: '',
          severity: 'minor',
          remedyDescription: '',
          remedyType: '',
          remedyDueDate: ''
        })
        fetchBlackMarks()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create black mark')
      }
    } catch (error) {
      console.error('Error creating black mark:', error)
      alert('Failed to create black mark')
    }
  }

  const filteredBlackMarks = blackMarks.filter(mark => {
    const matchesSearch = (mark.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (mark.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || mark.status === filterStatus
    const matchesCategory = filterCategory === 'all' || mark.category === filterCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return AlertCircle
      case 'in_progress': return Clock
      case 'completed': return CheckCircle
      case 'resolved': return CheckCircle
      default: return AlertCircle
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-bold text-gray-900">Black Marks</h1>
              <p className="text-[10px] sm:text-sm text-gray-500">{filteredBlackMarks.length} filtered • {blackMarks.length} total</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-10 px-2.5 sm:px-4 flex-shrink-0">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm">New Record</span>
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Issue New Black Mark</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateBlackMark} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class">Select Class</Label>
                  <Select value={selectedClassId} onValueChange={handleClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} - Grade {cls.grade_level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="student">Student</Label>
                  <Select 
                    value={formData.studentId} 
                    onValueChange={(value) => setFormData({...formData, studentId: value})}
                    disabled={!selectedClassId || loadingStudents}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedClassId ? "Select class first" : loadingStudents ? "Loading..." : "Select student"} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} (Grade {student.grade_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((sev) => (
                        <SelectItem key={sev.value} value={sev.value}>
                          {sev.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="remedyType">Remedy Type</Label>
                <Select value={formData.remedyType} onValueChange={(value) => setFormData({...formData, remedyType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select remedy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMEDY_TYPES.map((remedy) => (
                      <SelectItem key={remedy.value} value={remedy.value}>
                        {remedy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Provide detailed information about the incident..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="remedyDescription">Remedy Instructions</Label>
                <Textarea
                  id="remedyDescription"
                  value={formData.remedyDescription}
                  onChange={(e) => setFormData({...formData, remedyDescription: e.target.value})}
                  placeholder="Explain what the student needs to do to resolve this black mark..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="remedyDueDate">Remedy Due Date (Optional)</Label>
                <Input
                  id="remedyDueDate"
                  type="date"
                  value={formData.remedyDueDate}
                  onChange={(e) => setFormData({...formData, remedyDueDate: e.target.value})}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                  Issue Black Mark
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      {/* Desktop: 2-Column Layout | Mobile: Stacked */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          
          {/* LEFT SIDEBAR - Stats & Filters (Desktop: Sticky | Mobile: Top) */}
          <aside className="lg:col-span-3 space-y-4 mb-6 lg:mb-0">
            
            {/* Compact Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-600">Active</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{blackMarks.filter(bm => bm.status === 'active').length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-xs text-gray-600">Progress</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{blackMarks.filter(bm => bm.status === 'in_progress').length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{blackMarks.filter(bm => bm.status === 'completed').length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600">Resolved</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{blackMarks.filter(bm => bm.status === 'resolved').length}</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm border-gray-200"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA - Records List */}
          <main className="lg:col-span-9">

            {/* Records List */}
            <div className="space-y-3">
              {filteredBlackMarks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No Records Found</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    {blackMarks.length === 0 
                      ? "No disciplinary records yet. Click Issue to create one."
                      : "Try adjusting your filters to see more results."
                    }
                  </p>
                </div>
              ) : (
                filteredBlackMarks.map((blackMark) => {
                  const StatusIcon = getStatusIcon(blackMark.status)
                  const category = CATEGORIES.find(cat => cat.value === blackMark.category)
                  const severity = SEVERITIES.find(sev => sev.value === blackMark.severity)
                  
                  return (
                    <motion.div
                      key={blackMark.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      whileTap={{ scale: 0.99 }}
                      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex gap-2.5 p-2.5 sm:p-3">
                        {/* Enhanced Status Indicator Stripe */}
                        <div className={`w-1.5 rounded-full flex-shrink-0 transition-all ${
                          blackMark.status === 'active' ? 'bg-gradient-to-b from-red-500 to-red-600' :
                          blackMark.status === 'in_progress' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600' :
                          blackMark.status === 'completed' ? 'bg-gradient-to-b from-blue-500 to-blue-600' : 'bg-gradient-to-b from-green-500 to-green-600'
                        }`} />
                        
                        {/* Main Content */}
                        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                          {/* Top Row: Title & Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                              {/* Category Icon */}
                              <div className="flex-shrink-0 mt-0.5">
                                {blackMark.category === 'behavioral' && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                                {blackMark.category === 'academic' && <FileText className="h-3.5 w-3.5 text-blue-500" />}
                                {blackMark.category === 'attendance' && <Calendar className="h-3.5 w-3.5 text-purple-500" />}
                                {blackMark.category === 'conduct' && <User className="h-3.5 w-3.5 text-orange-500" />}
                                {blackMark.category === 'safety' && <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />}
                              </div>
                              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1 flex-1 leading-tight">{blackMark.title}</h3>
                            </div>
                            {severity && (
                              <Badge className={`${severity.color} text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 font-medium flex-shrink-0`}>
                                {severity.label}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Student & Date - Compact */}
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-600">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-gray-700 truncate">{blackMark.student_name}</span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <div className="items-center gap-0.5 hidden sm:flex">
                              <Calendar className="h-2.5 w-2.5 text-gray-400" />
                              <span className="text-[10px] text-gray-500">{new Date(blackMark.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            {blackMark.remedy_due_date && (
                              <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
                                <Clock className="h-3 w-3 text-orange-500" />
                                <span className="text-[10px] text-orange-600 font-medium">{new Date(blackMark.remedy_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons - Compact */}
                          <div className="flex gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedBlackMark(blackMark)
                                setIsViewDialogOpen(true)
                              }}
                              className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedBlackMark(blackMark)
                                setIsUpdateDialogOpen(true)
                              }}
                              className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                              <Edit className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Update</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </main>

          {/* View Details Dialog - Enhanced Mobile */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>View Black Mark Details</DialogTitle>
          </DialogHeader>
          {selectedBlackMark && (
            <div>
              {/* Header with Status Stripe */}
              <div className={`h-1 ${
                selectedBlackMark.status === 'active' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                selectedBlackMark.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                selectedBlackMark.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-green-600'
              }`} />
              
              <div className="p-4 space-y-4">
                {/* Title Section */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {selectedBlackMark.category === 'behavioral' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {selectedBlackMark.category === 'academic' && <FileText className="h-5 w-5 text-blue-500" />}
                      {selectedBlackMark.category === 'attendance' && <Calendar className="h-5 w-5 text-purple-500" />}
                      {selectedBlackMark.category === 'conduct' && <User className="h-5 w-5 text-orange-500" />}
                      {selectedBlackMark.category === 'safety' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{selectedBlackMark.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(selectedBlackMark.status)}>
                          <span className="text-[10px] font-medium">{selectedBlackMark.status.replace('_', ' ')}</span>
                        </Badge>
                        {SEVERITIES.find(s => s.value === selectedBlackMark.severity) && (
                          <Badge className={SEVERITIES.find(s => s.value === selectedBlackMark.severity)?.color}>
                            <span className="text-[10px] font-medium">{SEVERITIES.find(s => s.value === selectedBlackMark.severity)?.label}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Info Card */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">{selectedBlackMark.student_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(selectedBlackMark.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {selectedBlackMark.remedy_due_date && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Due {new Date(selectedBlackMark.remedy_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedBlackMark.description}</p>
                </div>

                {/* Remedy Details */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wide">Remedial Action</h4>
                  </div>
                  <p className="text-sm text-orange-900 mb-2 leading-relaxed">{selectedBlackMark.remedy_description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                      <span className="text-[10px] font-medium">{REMEDY_TYPES.find(r => r.value === selectedBlackMark.remedy_type)?.label}</span>
                    </Badge>
                  </div>
                </div>

                {/* Close Button */}
                <Button 
                  onClick={() => setIsViewDialogOpen(false)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog - Enhanced Mobile */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Update Black Mark Status</DialogTitle>
          </DialogHeader>
          {selectedBlackMark && (
            <div>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-900">{selectedBlackMark.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedBlackMark.student_name}</p>
              </div>
              
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select New Status</p>
                
                {/* Status Options as Cards */}
                <div className="space-y-2">
                  {[
                    { value: 'active', label: 'Active', icon: AlertCircle, color: 'red', desc: 'Issue is active' },
                    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'yellow', desc: 'Student working on it' },
                    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'blue', desc: 'Remedy completed' },
                    { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'green', desc: 'Fully resolved' }
                  ].map((status) => {
                    const Icon = status.icon
                    const isSelected = selectedBlackMark.status === status.value
                    return (
                      <button
                        key={status.value}
                        disabled={isUpdating}
                        onClick={async () => {
                          setIsUpdating(true)
                          
                          // Optimistic update - update UI immediately
                          const previousStatus = selectedBlackMark.status
                          const updatedMark = { ...selectedBlackMark, status: status.value }
                          setSelectedBlackMark(updatedMark)
                          
                          // Update the list optimistically
                          setBlackMarks(prev => prev.map(bm => 
                            bm.id === selectedBlackMark.id ? updatedMark : bm
                          ))
                          
                          try {
                            const response = await fetch(`/api/teacher/black-marks/${selectedBlackMark.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ status: status.value })
                            })

                            if (response.ok) {
                              toast.success(`Status updated to ${status.label}!`)
                              setIsUpdateDialogOpen(false)
                              // Refresh to get latest data from server
                              fetchBlackMarks()
                            } else {
                              // Revert optimistic update on error
                              setSelectedBlackMark({ ...selectedBlackMark, status: previousStatus })
                              setBlackMarks(prev => prev.map(bm => 
                                bm.id === selectedBlackMark.id ? { ...bm, status: previousStatus } : bm
                              ))
                              const error = await response.json()
                              toast.error(error.error || 'Failed to update status')
                            }
                          } catch (error) {
                            // Revert optimistic update on error
                            setSelectedBlackMark({ ...selectedBlackMark, status: previousStatus })
                            setBlackMarks(prev => prev.map(bm => 
                              bm.id === selectedBlackMark.id ? { ...bm, status: previousStatus } : bm
                            ))
                            console.error('Error updating status:', error)
                            toast.error('Failed to update status. Please try again.')
                          } finally {
                            setIsUpdating(false)
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all touch-manipulation ${
                          isUpdating ? 'opacity-50 cursor-not-allowed' :
                          isSelected 
                            ? `border-${status.color}-500 bg-${status.color}-50` 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                          isUpdating && isSelected ? 'animate-pulse' : ''
                        } ${
                          status.color === 'red' ? 'bg-red-100' :
                          status.color === 'yellow' ? 'bg-yellow-100' :
                          status.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            status.color === 'red' ? 'text-red-600' :
                            status.color === 'yellow' ? 'text-yellow-600' :
                            status.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{status.label}</span>
                            {isSelected && (
                              <div className={`w-2 h-2 rounded-full ${
                                status.color === 'red' ? 'bg-red-500' :
                                status.color === 'yellow' ? 'bg-yellow-500' :
                                status.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{status.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Cancel Button */}
                <Button 
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                  className="w-full mt-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  )
}
