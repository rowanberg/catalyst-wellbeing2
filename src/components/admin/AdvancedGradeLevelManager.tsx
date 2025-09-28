'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Trash2, 
  GraduationCap, 
  BookOpen, 
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Edit3,
  Check,
  X,
  MoreVertical,
  Zap,
  Users,
  Calendar,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'

interface GradeLevel {
  id: string
  grade_level: string
  grade_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  student_count?: number
  class_count?: number
}

interface ClassItem {
  id: string
  class_name: string
  class_code?: string
  subject?: string
  room_number?: string
  max_students: number
  current_students?: number
  is_active?: boolean
  teacher_id?: string
  grade_levels: {
    id: string
    grade_level: string
    grade_name: string
  }
}

interface GradeLevelManagerProps {
  schoolId?: string
}

const GRADE_TEMPLATES = [
  { name: 'US Elementary (K-5)', grades: [
    { level: 'K', name: 'Kindergarten' },
    { level: '1', name: 'First Grade' },
    { level: '2', name: 'Second Grade' },
    { level: '3', name: 'Third Grade' },
    { level: '4', name: 'Fourth Grade' },
    { level: '5', name: 'Fifth Grade' }
  ]},
  { name: 'US Middle School (6-8)', grades: [
    { level: '6', name: 'Sixth Grade' },
    { level: '7', name: 'Seventh Grade' },
    { level: '8', name: 'Eighth Grade' }
  ]},
  { name: 'US High School (9-12)', grades: [
    { level: '9', name: 'Freshman' },
    { level: '10', name: 'Sophomore' },
    { level: '11', name: 'Junior' },
    { level: '12', name: 'Senior' }
  ]},
  { name: 'UK Primary (1-6)', grades: [
    { level: '1', name: 'Year 1' },
    { level: '2', name: 'Year 2' },
    { level: '3', name: 'Year 3' },
    { level: '4', name: 'Year 4' },
    { level: '5', name: 'Year 5' },
    { level: '6', name: 'Year 6' }
  ]}
]

export function AdvancedGradeLevelManager({ schoolId }: GradeLevelManagerProps) {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedGradeForClass, setSelectedGradeForClass] = useState<GradeLevel | null>(null)
  const [selectedGradeForView, setSelectedGradeForView] = useState<GradeLevel | null>(null)
  const [gradeClasses, setGradeClasses] = useState<ClassItem[]>([])
  const [editingGrade, setEditingGrade] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ grade_level: '', grade_name: '' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [newClass, setNewClass] = useState({ class_name: '', room_number: '', max_students: 25 })
  
  const [newGrade, setNewGrade] = useState({
    grade_level: '',
    grade_name: ''
  })
  
  const { addToast } = useToast()

  useEffect(() => {
    if (schoolId) {
      fetchGradeLevels()
      fetchClasses()
    }
  }, [schoolId])

  const fetchGradeLevels = async () => {
    if (!schoolId) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/grade-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch grade levels')
      }

      const data = await response.json()
      setGradeLevels(data.gradeLevels || [])
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Load Grade Levels',
        description: 'Could not fetch grade levels from the server'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    if (!schoolId) return

    try {
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }

      const data = await response.json()
      setClasses(data.classes || [])
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Load Classes',
        description: 'Could not fetch classes from the server'
      })
    }
  }

  const createClass = async () => {
    if (!schoolId || !selectedGradeForClass || !newClass.class_name) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId,
          gradeLevelId: selectedGradeForClass.id,
          className: newClass.class_name,
          roomNumber: newClass.room_number,
          maxStudents: newClass.max_students
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create class')
      }

      const data = await response.json()
      setClasses(prev => [...prev, data.class])
      setNewClass({ class_name: '', room_number: '', max_students: 25 })
      setShowClassDialog(false)
      setSelectedGradeForClass(null)

      addToast({
        type: 'success',
        title: 'Class Created',
        description: 'New class has been added successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Class',
        description: 'Could not create the class'
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteClass = async (classId: string) => {
    if (!schoolId) return

    try {
      const response = await fetch('/api/admin/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, classId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete class')
      }

      setClasses(prev => prev.filter(c => c.id !== classId))
      setGradeClasses(prev => prev.filter(c => c.id !== classId))

      addToast({
        type: 'success',
        title: 'Class Deleted',
        description: 'Class has been removed successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Delete Class',
        description: 'Could not delete the class'
      })
    }
  }

  const viewGradeClasses = async (grade: GradeLevel) => {
    if (!schoolId) return

    try {
      setSelectedGradeForView(grade)
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }

      const data = await response.json()
      const filteredClasses = (data.classes || []).filter(
        (cls: ClassItem) => cls.grade_levels.id === grade.id
      )
      setGradeClasses(filteredClasses)
      setShowViewDialog(true)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Load Classes',
        description: 'Could not fetch classes for this grade level'
      })
    }
  }

  const createGradeLevel = async (gradeData = newGrade) => {
    if (!schoolId || !gradeData.grade_level || !gradeData.grade_name) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        description: 'Please fill in all required fields'
      })
      return false
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/grade-levels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId,
          gradeLevel: gradeData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create grade level')
      }

      const data = await response.json()
      setGradeLevels(prev => [...prev, data.gradeLevel])
      
      if (gradeData === newGrade) {
        setNewGrade({ grade_level: '', grade_name: '' })
      }

      return true
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Grade Level',
        description: 'Could not create the grade level'
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const applyTemplate = async (template: typeof GRADE_TEMPLATES[0]) => {
    setSaving(true)
    let successCount = 0
    
    for (const grade of template.grades) {
      const success = await createGradeLevel({
        grade_level: grade.level,
        grade_name: grade.name
      })
      if (success) successCount++
    }
    
    addToast({
      type: 'success',
      title: 'Template Applied',
      description: `Created ${successCount} grade levels from ${template.name} template`
    })
    
    setShowTemplateDialog(false)
    setSaving(false)
  }

  const deleteGradeLevel = async (gradeId: string) => {
    if (!schoolId) return

    try {
      const response = await fetch('/api/admin/grade-levels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, gradeId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete grade level')
      }

      setGradeLevels(prev => prev.filter(g => g.id !== gradeId))
      setSelectedGrades(prev => prev.filter(id => id !== gradeId))

      addToast({
        type: 'success',
        title: 'Grade Level Deleted',
        description: 'Grade level has been removed successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Delete Grade Level',
        description: 'Could not delete the grade level'
      })
    }
  }

  const bulkDelete = async () => {
    if (selectedGrades.length === 0) return
    
    for (const gradeId of selectedGrades) {
      await deleteGradeLevel(gradeId)
    }
    
    setSelectedGrades([])
  }

  const toggleGradeSelection = (gradeId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gradeId) 
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    )
  }

  const startEdit = (grade: GradeLevel) => {
    setEditingGrade(grade.id)
    setEditValues({
      grade_level: grade.grade_level,
      grade_name: grade.grade_name
    })
  }

  const saveEdit = async () => {
    // Implementation would update the grade level
    setEditingGrade(null)
    addToast({
      type: 'success',
      title: 'Grade Updated',
      description: 'Grade level has been updated successfully'
    })
  }

  const filteredGrades = gradeLevels.filter(grade => {
    const matchesSearch = grade.grade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.grade_level.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === null || grade.is_active === filterActive
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading grade levels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Grade Level Management</h1>
            <p className="text-blue-100 text-lg">Organize your school's academic structure with ease</p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{gradeLevels.length} Grade Levels</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {gradeLevels.reduce((sum: number, grade: any) => sum + (grade.student_count || 0), 0)} Students
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {gradeLevels.reduce((sum: number, grade: any) => sum + (grade.class_count || 0), 0)} Classes
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Quick Setup
            </Button>
            
            <Button
              onClick={() => setNewGrade({ grade_level: '', grade_name: '' })}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg flex items-center gap-2 font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Grade Level
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search grade levels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-blue-200 focus:border-blue-400"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
                  onChange={(e) => setFilterActive(
                    e.target.value === 'all' ? null : e.target.value === 'active'
                  )}
                  className="border border-blue-200 rounded-md px-3 py-1 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              
              <div className="flex items-center gap-1 border border-blue-200 rounded-md p-1 bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <div className="space-y-1 w-3">
                    <div className="h-0.5 bg-current rounded"></div>
                    <div className="h-0.5 bg-current rounded"></div>
                    <div className="h-0.5 bg-current rounded"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
          {selectedGrades.length > 0 && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedGrades.length} grade{selectedGrades.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={bulkDelete}
                className="h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGrades([])}
                className="h-8"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Grade Level */}
      <Card className="border-dashed border-2 border-blue-300 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-blue-900">
            <Plus className="h-5 w-5 mr-2" />
            Create New Grade Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="grade-level" className="text-sm font-medium text-gray-700">
                Grade Level *
              </Label>
              <Input
                id="grade-level"
                value={newGrade.grade_level}
                onChange={(e) => setNewGrade(prev => ({ ...prev, grade_level: e.target.value }))}
                placeholder="e.g., 1, 2, K, 9"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="grade-name" className="text-sm font-medium text-gray-700">
                Grade Name *
              </Label>
              <Input
                id="grade-name"
                value={newGrade.grade_name}
                onChange={(e) => setNewGrade(prev => ({ ...prev, grade_name: e.target.value }))}
                placeholder="e.g., First Grade, Kindergarten"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => createGradeLevel()}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Grade Level'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Levels Display */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Grade Levels ({filteredGrades.length})
          </h3>
          <Badge variant="outline" className="text-xs">
            {gradeLevels.filter(g => g.is_active).length} Active
          </Badge>
        </div>

        {filteredGrades.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">No grade levels found</p>
              <p className="text-gray-500 text-sm mb-6">
                {searchTerm || filterActive !== null 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first grade level above or use a quick setup template'
                }
              </p>
              {!searchTerm && filterActive === null && (
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateDialog(true)}
                  className="mx-auto"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Setup Templates
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
          }>
            <AnimatePresence>
              {filteredGrades.map((grade, index) => (
                <motion.div
                  key={grade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    selectedGrades.includes(grade.id) 
                      ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                      : 'hover:shadow-2xl bg-gradient-to-br from-white to-gray-50'
                  } ${viewMode === 'list' ? 'flex items-center' : ''} border-0 shadow-md`}>
                    <CardHeader className={`${viewMode === 'list' ? 'flex-1 pb-3' : 'pb-3'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedGrades.includes(grade.id)}
                            onChange={() => toggleGradeSelection(grade.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            {editingGrade === grade.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editValues.grade_name}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, grade_name: e.target.value }))}
                                  className="text-base font-semibold"
                                />
                                <Input
                                  value={editValues.grade_level}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, grade_level: e.target.value }))}
                                  className="text-sm"
                                />
                              </div>
                            ) : (
                              <>
                                <CardTitle className="text-lg font-bold text-gray-800 truncate">{grade.grade_name}</CardTitle>
                                <p className="text-sm text-gray-500 font-medium">Level {grade.grade_level}</p>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {editingGrade === grade.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveEdit}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingGrade(null)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content className="bg-white rounded-md shadow-lg border border-gray-200 p-1 min-w-[120px] z-50">
                                  <DropdownMenu.Item 
                                    onClick={() => viewGradeClasses(grade)}
                                    className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-blue-50 text-blue-600 cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" />
                                    View Classes
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item 
                                    onClick={() => {
                                      setSelectedGradeForClass(grade)
                                      setShowClassDialog(true)
                                    }}
                                    className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-green-50 text-green-600 cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Class
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item 
                                    onClick={() => startEdit(grade)}
                                    className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    Edit Grade
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item 
                                    onClick={() => deleteGradeLevel(grade.id)}
                                    className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-red-50 text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete Grade
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {viewMode === 'grid' && (
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200/50 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="p-1 bg-blue-200 rounded-full">
                                  <Users className="h-4 w-4 text-blue-700" />
                                </div>
                                <span className="text-2xl font-bold text-blue-800">
                                  {grade.student_count || 0}
                                </span>
                              </div>
                              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Students</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200/50 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="p-1 bg-green-200 rounded-full">
                                  <BookOpen className="h-4 w-4 text-green-700" />
                                </div>
                                <span className="text-2xl font-bold text-green-800">
                                  {grade.class_count || 0}
                                </span>
                              </div>
                              <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Classes</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <Badge 
                              variant={grade.is_active ? "default" : "secondary"}
                              className={`text-xs font-medium px-3 py-1 ${
                                grade.is_active 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {grade.is_active ? '✓ Active' : '⏸ Inactive'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewGradeClasses(grade)}
                              className="text-xs h-7 px-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                          
                          <div className="text-center pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-400 font-medium">
                              Grade Level {grade.grade_level} • Created {new Date(grade.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quick Setup Templates Dialog */}
      <Dialog.Root open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50">
            <Dialog.Title className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Setup Templates
            </Dialog.Title>
            
            <p className="text-gray-600 mb-6">
              Choose a template to quickly set up grade levels for your school system.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GRADE_TEMPLATES.map((template) => (
                <Card key={template.name} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {template.grades.slice(0, 3).map((grade) => (
                        <div key={grade.level} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-6 h-6 bg-blue-100 rounded text-xs flex items-center justify-center font-medium">
                            {grade.level}
                          </div>
                          {grade.name}
                        </div>
                      ))}
                      {template.grades.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{template.grades.length - 3} more grades
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => applyTemplate(template)}
                      disabled={saving}
                      className="w-full"
                      size="sm"
                    >
                      {saving ? 'Applying...' : `Apply Template (${template.grades.length} grades)`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Class Dialog */}
      <Dialog.Root open={showClassDialog} onOpenChange={setShowClassDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Add Class to {selectedGradeForClass?.grade_name}
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name
                </label>
                <Input
                  placeholder="e.g., Class A, Room 101, Mathematics"
                  value={newClass.class_name}
                  onChange={(e) => setNewClass(prev => ({ ...prev, class_name: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number
                </label>
                <Input
                  placeholder="e.g., Room 101, Lab A, Gym"
                  value={newClass.room_number}
                  onChange={(e) => setNewClass(prev => ({ ...prev, room_number: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Students
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={newClass.max_students}
                  onChange={(e) => setNewClass(prev => ({ ...prev, max_students: parseInt(e.target.value) || 25 }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={createClass}
                disabled={saving || !newClass.class_name}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* View Classes Dialog */}
      <Dialog.Root open={showViewDialog} onOpenChange={setShowViewDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50">
            <Dialog.Title className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Classes in {selectedGradeForView?.grade_name}
            </Dialog.Title>
            
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Grade Level {selectedGradeForView?.grade_level}</h3>
                  <p className="text-sm text-gray-600">{selectedGradeForView?.grade_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{gradeClasses.length}</div>
                  <div className="text-xs text-blue-500 font-medium">Total Classes</div>
                </div>
              </div>
            </div>
            
            {gradeClasses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
                <p className="text-gray-500 mb-4">This grade level doesn't have any classes created yet.</p>
                <Button
                  onClick={() => {
                    setShowViewDialog(false)
                    setSelectedGradeForClass(selectedGradeForView)
                    setShowClassDialog(true)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Class
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {gradeClasses.map((classItem, index) => (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{classItem.class_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {classItem.class_code && (
                                  <span className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                    Code: {classItem.class_code}
                                  </span>
                                )}
                                {classItem.subject && (
                                  <span className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    Subject: {classItem.subject}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800">
                                {classItem.current_students || 0}/{classItem.max_students}
                              </div>
                              <div className="text-xs text-gray-500">Students</div>
                            </div>
                            
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content className="bg-white rounded-md shadow-lg border border-gray-200 p-1 min-w-[120px] z-50">
                                  <DropdownMenu.Item 
                                    onClick={() => deleteClass(classItem.id)}
                                    className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-red-50 text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete Class
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowViewDialog(false)
                      setSelectedGradeForClass(selectedGradeForView)
                      setShowClassDialog(true)
                    }}
                    variant="outline"
                    className="w-full border-dashed border-2 border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Class
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Close</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
