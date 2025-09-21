'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  student_name: string
  student_id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  created_at: string
  remedy_due_date: string | null
}

interface Student {
  id: string
  name: string
  email: string
  grade: string
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
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

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

  useEffect(() => {
    fetchBlackMarks()
    fetchStudents()
  }, [])

  const fetchBlackMarks = async () => {
    try {
      const response = await fetch('/api/teacher/black-marks')
      if (response.ok) {
        const data = await response.json()
        setBlackMarks(data.blackMarks)
      }
    } catch (error) {
      console.error('Error fetching black marks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      // Get students from all grades for this teacher's school
      const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
      const allStudents: Student[] = []
      
      for (const grade of grades) {
        const response = await fetch(`/api/teacher/students?grade_level=${grade}`)
        if (response.ok) {
          const data = await response.json()
          allStudents.push(...data.students)
        }
      }
      
      setStudents(allStudents)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleCreateBlackMark = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/teacher/black-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    const matchesSearch = mark.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mark.title.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Black Mark Management</h2>
          <p className="text-gray-600">Track and manage student disciplinary actions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Issue Black Mark
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Issue New Black Mark</DialogTitle>
              <DialogDescription>
                Create a disciplinary record with clear remedial actions for the student.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateBlackMark} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student">Student</Label>
                  <Select value={formData.studentId} onValueChange={(value) => setFormData({...formData, studentId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} (Grade {student.grade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Issue Black Mark
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Black Marks</p>
                <p className="text-2xl font-bold text-gray-900">{blackMarks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-red-600">
                  {blackMarks.filter(bm => bm.status === 'active').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {blackMarks.filter(bm => bm.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {blackMarks.filter(bm => bm.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by student name or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
              <SelectTrigger className="w-40">
                <SelectValue />
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
        </CardContent>
      </Card>

      {/* Black Marks List */}
      <div className="space-y-4">
        {filteredBlackMarks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Black Marks Found</h3>
              <p className="text-gray-600">
                {blackMarks.length === 0 
                  ? "No black marks have been issued yet."
                  : "No black marks match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBlackMarks.map((blackMark) => {
            const StatusIcon = getStatusIcon(blackMark.status)
            const category = CATEGORIES.find(cat => cat.value === blackMark.category)
            const severity = SEVERITIES.find(sev => sev.value === blackMark.severity)
            
            return (
              <motion.div
                key={blackMark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{blackMark.title}</h3>
                      <Badge className={getStatusColor(blackMark.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {blackMark.status.replace('_', ' ')}
                      </Badge>
                      {category && (
                        <Badge className={category.color}>
                          {category.label}
                        </Badge>
                      )}
                      {severity && (
                        <Badge className={severity.color}>
                          {severity.label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <User className="h-4 w-4 mr-1" />
                      <span className="font-medium">{blackMark.student_name}</span>
                      <span className="mx-2">•</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(blackMark.created_at).toLocaleDateString()}</span>
                      {blackMark.remedy_due_date && (
                        <>
                          <span className="mx-2">•</span>
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Due: {new Date(blackMark.remedy_due_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-4">{blackMark.description}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
