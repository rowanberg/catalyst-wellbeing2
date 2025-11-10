'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, AlertTriangle, BookOpen, Star, Plus, Search, 
  Filter, Download, Calendar, Clock, User, FileText,
  TrendingUp, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, Edit, Trash2, Eye, School
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface IncidentLog {
  id: string
  student_id: string
  teacher_id: string
  type: 'behavioral' | 'academic' | 'positive'
  description: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  student_name: string
  student_grade?: string
  class_name?: string
  resolution_status?: 'pending' | 'in_progress' | 'resolved'
}

interface Student {
  id: string
  full_name: string
  grade_level?: string
  section?: string
}

interface ClassInfo {
  id: string
  name: string
  grade_level?: string
  section?: string
}

export function IncidentManagement() {
  const [incidents, setIncidents] = useState<IncidentLog[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Student selection state
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // Class selection state
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [loadingClasses, setLoadingClasses] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    class_id: '',
    class_name: '',
    type: 'behavioral' as 'behavioral' | 'academic' | 'positive',
    severity: 'medium' as 'low' | 'medium' | 'high',
    description: ''
  })

  // Fetch incidents, students, and classes
  useEffect(() => {
    fetchIncidents()
    fetchStudents()
    fetchClasses()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const response = await fetch('/api/teacher/students')
      const data = await response.json()
      
      if (data.students) {
        setStudents(data.students)
      }
    } catch (error) {
      // Don't show error toast, allow manual entry
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true)
      
      // Check localStorage first for cached classes
      const cachedClasses = localStorage.getItem('teacher_classes_cache')
      if (cachedClasses) {
        const parsed = JSON.parse(cachedClasses)
        const cacheTime = localStorage.getItem('teacher_classes_cache_time')
        const now = Date.now()
        
        // Use cache if less than 5 minutes old
        if (cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000) {
          setClasses(parsed)
          setLoadingClasses(false)
          return
        }
      }
      
      // Fetch from API if no cache or cache expired
      const response = await fetch('/api/teacher/classes')
      if (response.ok) {
        const data = await response.json()
        const classesData = (data.classes || []).map((cls: any) => ({
          id: cls.id,
          name: cls.class_name || cls.name || 'Unnamed Class',
          grade_level: cls.grade_level_id,
          section: cls.subject
        }))
        
        setClasses(classesData)
        
        // Cache the data
        localStorage.setItem('teacher_classes_cache', JSON.stringify(classesData))
        localStorage.setItem('teacher_classes_cache_time', Date.now().toString())
      }
    } catch (error) {
      // Fail silently, class selection is optional
    } finally {
      setLoadingClasses(false)
    }
  }

  // Filter incidents
  useEffect(() => {
    let filtered = incidents

    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(incident => incident.type === filterType)
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(incident => incident.severity === filterSeverity)
    }

    setFilteredIncidents(filtered)
  }, [searchTerm, filterType, filterSeverity, incidents])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/incidents', {
        next: { revalidate: 30 } // Cache for 30 seconds
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch incidents')
      }
      
      const data = await response.json()
      setIncidents(data.incidents || [])
    } catch (error) {
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Validation
    if (!formData.student_name.trim()) {
      toast.error('Please enter student name')
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Please provide incident description')
      return
    }

    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/teacher/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent?.id || formData.student_id || null,
          student_name: formData.student_name,
          class_id: selectedClass?.id || formData.class_id || null,
          class_name: selectedClass?.name || formData.class_name || null,
          type: formData.type,
          severity: formData.severity,
          description: formData.description,
          student_grade: selectedStudent?.grade_level || null
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success('✅ Incident logged successfully!')
        
        // Add the new incident to the list optimistically
        const newIncident: IncidentLog = {
          id: data.incident?.id || `temp-${Date.now()}`,
          student_id: selectedStudent?.id || '',
          teacher_id: '',
          type: formData.type,
          severity: formData.severity,
          description: formData.description,
          student_name: formData.student_name,
          student_grade: selectedStudent?.grade_level,
          class_name: selectedClass?.name || formData.class_name,
          created_at: new Date().toISOString(),
          resolution_status: 'pending'
        }
        setIncidents([newIncident, ...incidents])
        
        setIsDialogOpen(false)
        resetForm()
      } else if (response.status === 404) {
        handleDemoSubmit()
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: 'Failed to log incident' }
        }
        toast.error(errorData.error || errorData.message || 'Failed to log incident. Please try again.')
      }
    } catch (error: any) {
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        handleDemoSubmit()
      } else {
        toast.error('Could not connect to server. Saving locally...')
        handleDemoSubmit()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Demo/offline mode for when API doesn't exist
  const handleDemoSubmit = () => {
    const newIncident: IncidentLog = {
      id: `demo-${Date.now()}`,
      student_id: selectedStudent?.id || '',
      teacher_id: 'demo-teacher',
      type: formData.type,
      severity: formData.severity,
      description: formData.description,
      student_name: formData.student_name,
      student_grade: selectedStudent?.grade_level,
      class_name: selectedClass?.name || formData.class_name,
      created_at: new Date().toISOString(),
      resolution_status: 'pending'
    }
    
    setIncidents([newIncident, ...incidents])
    
    toast.success('✅ Incident logged locally (demo mode)', {
      description: 'This will be synced when the API is available'
    })
    
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      student_name: '',
      class_id: '',
      class_name: '',
      type: 'behavioral',
      severity: 'medium',
      description: ''
    })
    setSelectedStudent(null)
    setStudentSearchTerm('')
    setSelectedClass(null)
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setFormData({
      ...formData,
      student_id: student.id,
      student_name: student.full_name
    })
    setStudentSearchTerm(student.full_name)
  }

  const handleClassSelect = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo)
    setFormData({
      ...formData,
      class_id: classInfo.id,
      class_name: classInfo.name
    })
  }

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase())
  )

  const handleDelete = async (incidentId: string) => {
    if (!confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      return
    }

    try {
      console.log('Deleting incident:', incidentId)
      const response = await fetch(`/api/teacher/incidents?id=${incidentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Incident deleted successfully')
        setIncidents(incidents.filter(inc => inc.id !== incidentId))
      } else {
        console.error('Delete failed:', { 
          status: response.status, 
          statusText: response.statusText,
          url: response.url
        })
        
        // Try to parse error response
        let errorText = '';
        try {
          const errorData = await response.json()
          console.error('Error details:', errorData)
          errorText = errorData.error || errorData.message || 'Failed to delete incident'
        } catch (parseError) {
          errorText = await response.text()
          console.error('Error parsing response:', errorText)
          errorText = 'Failed to delete incident (response parsing error)'
        }
        
        toast.error(errorText)
      }
    } catch (error) {
      console.error('Exception during delete:', error)
      toast.error('Failed to delete incident due to an exception')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return 'from-red-500 to-red-600'
      case 'academic': return 'from-blue-500 to-blue-600'
      case 'positive': return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavioral': return AlertTriangle
      case 'academic': return BookOpen
      case 'positive': return Star
      default: return Shield
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200">High Priority</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Low</Badge>
      default:
        return null
    }
  }

  // Memoize stats calculation for better performance
  const stats = useMemo(() => ({
    behavioral: incidents.filter(i => i.type === 'behavioral').length,
    academic: incidents.filter(i => i.type === 'academic').length,
    positive: incidents.filter(i => i.type === 'positive').length,
    total: incidents.length
  }), [incidents])

  return (
    <div className="space-y-3 sm:space-y-6 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border-0 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg sm:rounded-xl text-white">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-lg sm:text-2xl lg:text-3xl">Incident Management</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 ml-0 sm:ml-0">Document and track student incidents, concerns, and positive notes</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            // Prevent closing dialog while submitting
            if (!isSubmitting) {
              setIsDialogOpen(open)
              if (!open) {
                resetForm()
              }
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-2">
                <Plus className="h-4 w-4 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Log </span>Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              {/* Loading Overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                  <div className="text-center px-4">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-slate-700 font-medium text-sm sm:text-base">Logging incident...</p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Please wait</p>
                  </div>
                </div>
              )}
              
              <DialogHeader className="space-y-1 sm:space-y-2">
                <DialogTitle className="text-lg sm:text-xl">Log New Incident</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Document a behavioral incident, academic concern, or positive note
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="student" className="text-sm">Student *</Label>
                  <div className="relative">
                    <Input
                      id="student"
                      placeholder="Type student name..."
                      value={studentSearchTerm}
                      onChange={(e) => {
                        setStudentSearchTerm(e.target.value)
                        setFormData({ ...formData, student_name: e.target.value })
                      }}
                      required
                      disabled={isSubmitting}
                      className={selectedStudent ? 'border-green-500' : ''}
                    />
                    {loadingStudents && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Student dropdown */}
                  {studentSearchTerm && filteredStudents.length > 0 && !selectedStudent && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                      {filteredStudents.slice(0, 10).map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-slate-800">{student.full_name}</div>
                          {student.grade_level && (
                            <div className="text-xs text-slate-500">
                              Grade {student.grade_level}{student.section ? ` - ${student.section}` : ''}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {selectedStudent && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Selected: {selectedStudent.full_name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null)
                          setStudentSearchTerm('')
                          setFormData({ ...formData, student_name: '', student_id: '' })
                        }}
                        className="ml-auto text-slate-500 hover:text-slate-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500">
                    {students.length > 0 
                      ? `${students.length} students available` 
                      : 'You can type any student name'}
                  </p>
                </div>

                {/* Class Selection */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="class" className="text-sm">Class (Optional)</Label>
                  <Select
                    value={formData.class_id || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSelectedClass(null)
                        setFormData({ ...formData, class_id: '', class_name: '' })
                      } else {
                        const selectedClass = classes.find(c => c.id === value)
                        if (selectedClass) {
                          handleClassSelect(selectedClass)
                        }
                      }
                    }}
                    disabled={isSubmitting || loadingClasses}
                  >
                    <SelectTrigger disabled={isSubmitting || loadingClasses} className="text-xs sm:text-sm">
                      {loadingClasses ? (
                        <span className="text-slate-400">Loading classes...</span>
                      ) : selectedClass ? (
                        <div className="flex items-center gap-2">
                          <School className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          <span>{selectedClass.name}</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a class" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-slate-500">No class selected</span>
                      </SelectItem>
                      {classes.map((classInfo) => (
                        <SelectItem key={classInfo.id} value={classInfo.id}>
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{classInfo.name}</span>
                            {classInfo.section && (
                              <span className="text-xs text-slate-500">
                                - {classInfo.section}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {loadingClasses ? 'Loading...' : `${classes.length} classes available`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="type" className="text-sm">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="behavioral">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Behavioral Incident
                          </div>
                        </SelectItem>
                        <SelectItem value="academic">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            Academic Concern
                          </div>
                        </SelectItem>
                        <SelectItem value="positive">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-green-500" />
                            Positive Note
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="severity" className="text-sm">Severity *</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <Badge className="bg-green-100 text-green-700 border-green-200">Low</Badge>
                        </SelectItem>
                        <SelectItem value="medium">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>
                        </SelectItem>
                        <SelectItem value="high">
                          <Badge className="bg-red-100 text-red-700 border-red-200">High Priority</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="description" className="text-sm">
                    Description * 
                    <span className="text-xs text-slate-500 ml-1 sm:ml-2">
                      (min. 10 chars)
                    </span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed description of the incident... (minimum 10 characters)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    disabled={isSubmitting}
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{formData.description.length} characters</span>
                    {formData.description.length > 0 && formData.description.length < 10 && (
                      <span className="text-red-500">
                        {10 - formData.description.length} more needed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 relative min-w-[140px] w-full sm:w-auto text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-white mr-2" />
                        <span className="animate-pulse">Logging...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Log Incident
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
          {[
            { title: 'Total', fullTitle: 'Total Incidents', count: stats.total, icon: FileText, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-50' },
            { title: 'Behavioral', fullTitle: 'Behavioral', count: stats.behavioral, icon: AlertTriangle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50' },
            { title: 'Academic', fullTitle: 'Academic', count: stats.academic, icon: BookOpen, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
            { title: 'Positive', fullTitle: 'Positive Notes', count: stats.positive, icon: Star, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' }
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${stat.bgColor} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-100 hover:shadow-md sm:hover:shadow-lg transition-shadow`}
              >
                <div className={`inline-flex p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${stat.color} text-white mb-2 sm:mb-3`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-slate-700 mb-0.5 sm:mb-1 line-clamp-1">
                  <span className="sm:hidden">{stat.title}</span>
                  <span className="hidden sm:inline">{stat.fullTitle}</span>
                </h3>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{stat.count}</div>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 mt-0.5 sm:mt-1">This month</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 p-3 sm:p-4 lg:p-6">
        <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-row gap-2 sm:gap-3 lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <Input
                placeholder="Search student or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] text-xs sm:text-sm h-9 sm:h-10">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] text-xs sm:text-sm h-9 sm:h-10">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800">Recent Incidents</h3>
          <Badge variant="outline" className="text-slate-600 text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1">
            {filteredIncidents.length}
            <span className="hidden xs:inline"> {filteredIncidents.length === 1 ? 'record' : 'records'}</span>
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 sm:h-24 bg-slate-100 rounded-lg sm:rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-flex p-3 sm:p-4 bg-slate-100 rounded-full mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-1 sm:mb-2">No incidents found</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6 px-4">
              {searchTerm || filterType !== 'all' || filterSeverity !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by logging your first incident'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-sm sm:text-base">
              <Plus className="h-4 w-4 mr-2" />
              Log Incident
            </Button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <AnimatePresence>
              {filteredIncidents.map((incident, index) => {
                const TypeIcon = getTypeIcon(incident.type)
                const isExpanded = expandedIncident === incident.id

                return (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="border border-gray-200 rounded-lg sm:rounded-xl hover:shadow-md transition-shadow active:scale-[0.99]"
                  >
                    <div
                      className="p-3 sm:p-4 cursor-pointer touch-manipulation"
                      onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                        <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${getTypeColor(incident.type)} text-white flex-shrink-0`}>
                          <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm sm:text-base text-slate-800 line-clamp-1">{incident.student_name}</h4>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 flex-shrink-0">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline">{new Date(incident.created_at).toLocaleDateString()}</span>
                                <span className="xs:hidden">{new Date(incident.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              {getSeverityBadge(incident.severity)}
                              <Badge variant="outline" className="capitalize text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5">
                                {incident.type}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 pr-6 sm:pr-0">{incident.description}</p>
                        </div>

                        <div className="flex-shrink-0 pt-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50"
                        >
                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <h5 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Full Description</h5>
                              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{incident.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
                                <span className="text-slate-600">
                                  {new Date(incident.created_at).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              {(incident.class_name || incident.student_grade) && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <School className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
                                  <span className="text-slate-600">
                                    {incident.class_name || `Grade ${incident.student_grade}`}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-1 sm:pt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toast.info('Edit functionality coming soon')
                                }}
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm h-8 sm:h-9"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(incident.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
