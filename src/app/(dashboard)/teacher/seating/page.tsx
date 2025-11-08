'use client'

import { useState, useEffect, useCallback, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Search, 
  Filter,
  Check,
  User,
  Zap,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Home,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAppSelector } from '@/lib/redux/hooks'
import { useTeacherData } from '@/hooks/useTeacherData'
import Link from 'next/link'
import { LAYOUT_TEMPLATES, LayoutTemplate } from '@/lib/classroom-layouts'

interface ClassInfo {
  id: string
  class_name: string
  grade_level: string
  subject: string
  is_primary_teacher: boolean
}

interface Student {
  id: string
  first_name: string
  last_name: string
  avatar?: string
  xp: number
  behavior_tag?: 'needs_focus' | 'top_performer' | 'excellent' | 'average'
  attendance_rate?: number
  grade_level?: string
}

interface SeatAssignment {
  seatId: string
  student: Student | null
}

export default function SeatingChartPage() {
  const { user } = useAppSelector((state) => state.auth)
  
  // Use cached teacher data hook
  const { 
    data: teacherData, 
    loading: teacherLoading, 
    error: teacherError,
    loadStudentsForClass,
    studentsLoading
  } = useTeacherData({
    includeStudents: false,
    autoRefresh: false
  })
  
  const [primaryClass, setPrimaryClass] = useState<ClassInfo | null>(null)
  const [primaryClassId, setPrimaryClassId] = useState<string | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [seatAssignments, setSeatAssignments] = useState<Map<string, Student>>(new Map())
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null)
  const [draggedFromSeat, setDraggedFromSeat] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplate>(LAYOUT_TEMPLATES[0])
  const [error, setError] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'layout' | 'students'>('layout') // Mobile tab state
  const [showMobileMenu, setShowMobileMenu] = useState(false) // Mobile action menu state
  const [seatingChartId, setSeatingChartId] = useState<string | null>(null) // Database seating chart ID
  const [loadingChart, setLoadingChart] = useState(false) // Loading seating chart from database
  const [saving, setSaving] = useState(false) // Saving to database

  // Find primary class from cached teacher data
  useEffect(() => {
    if (!teacherLoading && teacherData?.assignedClasses) {
      const primary = teacherData.assignedClasses.find(cls => cls.is_primary_teacher)
      
      if (primary) {
        setPrimaryClass({
          id: primary.id,
          class_name: primary.class_name || primary.name,
          grade_level: primary.grade_level,
          subject: primary.subject || '',
          is_primary_teacher: true
        })
        setPrimaryClassId(primary.id)
      } else {
        setError('No primary class assigned')
      }
    }
  }, [teacherData, teacherLoading])

  // Fetch students when primary class is identified
  useEffect(() => {
    if (primaryClassId && loadStudentsForClass) {
      loadStudentsForClass(primaryClassId)
    }
  }, [primaryClassId, loadStudentsForClass])

  // Map students from hook data to local state
  useEffect(() => {
    if (teacherData?.students && teacherData.students.length > 0) {
      const studentsList: Student[] = teacherData.students.map((s: any) => {
        const totalXP = s.current_xp || s.xp || 0
        const attendanceRate = s.attendance_rate || 95

        // Determine behavior tag based on XP
        let behavior_tag: Student['behavior_tag'] = 'average'
        if (totalXP > 2500) behavior_tag = 'top_performer'
        else if (totalXP > 2000) behavior_tag = 'excellent'
        else if (totalXP < 1500) behavior_tag = 'needs_focus'

        return {
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          xp: totalXP,
          attendance_rate: attendanceRate,
          behavior_tag,
          grade_level: s.grade_level || primaryClass?.grade_level
        }
      })

      setAllStudents(studentsList)
      setUnassignedStudents(studentsList)
    }
  }, [teacherData?.students, primaryClass?.grade_level])

  // Load seating chart from database when class is loaded
  useEffect(() => {
    if (primaryClassId && allStudents.length > 0) {
      loadSeatingChartFromDatabase()
    }
  }, [primaryClassId, allStudents])

  // Load existing seating chart from database
  const loadSeatingChartFromDatabase = async () => {
    if (!primaryClassId) return

    try {
      setLoadingChart(true)
      console.log('📥 Loading seating chart for class:', primaryClassId)
      const response = await fetch(`/api/teacher/seating?class_id=${primaryClassId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load seating chart')
      }

      const data = await response.json()
      console.log('📊 Seating chart data received:', {
        hasChart: !!data.seatingChart,
        chartId: data.seatingChart?.id,
        layoutId: data.seatingChart?.layout_template_id,
        assignmentsCount: data.assignments?.length || 0
      })
      
      if (data.seatingChart) {
        // Load the layout
        const layout = LAYOUT_TEMPLATES.find(l => l.id === data.seatingChart.layout_template_id)
        if (layout) {
          console.log('✅ Layout found and applied:', layout.name)
          setSelectedLayout(layout)
        } else {
          console.warn('⚠️ Layout not found:', data.seatingChart.layout_template_id)
        }
        setSeatingChartId(data.seatingChart.id)

        // Load the seat assignments
        if (data.assignments && data.assignments.length > 0) {
          const assignmentsMap = new Map<string, Student>()
          
          data.assignments.forEach((assignment: any) => {
            const student = allStudents.find(s => s.id === assignment.student_id)
            if (student) {
              assignmentsMap.set(assignment.seat_id, student)
            } else {
              console.warn('⚠️ Student not found for assignment:', assignment.student_id)
            }
          })

          console.log('✅ Loaded assignments:', assignmentsMap.size, 'seats filled')
          setSeatAssignments(assignmentsMap)
          
          // Update unassigned students
          const assignedStudentIds = new Set(Array.from(assignmentsMap.values()).map(s => s.id))
          setUnassignedStudents(allStudents.filter(s => !assignedStudentIds.has(s.id)))
        } else {
          console.log('📝 No seat assignments found')
        }
      } else {
        console.log('📝 No existing seating chart found')
      }
    } catch (error) {
      console.error('❌ Error loading seating chart:', error)
    } finally {
      setLoadingChart(false)
    }
  }

  // Save seating chart to database
  const saveSeatingChartToDatabase = async () => {
    if (!primaryClassId) return null

    try {
      // Only create NEW chart if one doesn't exist
      // Otherwise, keep using the existing chart ID to preserve seat assignments
      if (seatingChartId) {
        console.log('📝 Using existing seating chart:', seatingChartId)
        return seatingChartId
      }

      const response = await fetch('/api/teacher/seating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: primaryClassId,
          layoutTemplateId: selectedLayout.id,
          layoutName: selectedLayout.name,
          rows: selectedLayout.rows,
          cols: selectedLayout.cols,
          totalSeats: selectedLayout.seatPattern.filter(s => s === 'seat').length,
          seatPattern: selectedLayout.seatPattern,
          name: `${selectedLayout.name} - ${new Date().toLocaleDateString()}`,
          description: selectedLayout.description
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save seating chart')
      }

      const data = await response.json()
      setSeatingChartId(data.seatingChart.id)
      return data.seatingChart.id
    } catch (error: any) {
      console.error('Error saving seating chart:', error)
      setError(error.message || 'Failed to save seating chart')
      throw error
    }
  }

  // Save seat assignments to database
  const saveAssignmentsToDatabase = async (chartId: string, method: string = 'manual') => {
    if (!chartId) return

    try {
      const assignments = Array.from(seatAssignments.entries()).map(([seatId, student]) => {
        // Parse seat ID to get row and col (e.g., "A1" -> row:0, col:0)
        const row = seatId.charCodeAt(0) - 65 // A=0, B=1, etc.
        const col = parseInt(seatId.substring(1)) - 1 // 1=0, 2=1, etc.
        
        return {
          studentId: student.id,
          seatId,
          rowIndex: row,
          colIndex: col
        }
      })

      const response = await fetch('/api/teacher/seating', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatingChartId: chartId,
          assignments,
          assignmentMethod: method
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save assignments')
      }

      return true
    } catch (error) {
      console.error('Error saving assignments:', error)
      throw error
    }
  }

  // Generate seat IDs (A1, A2, B1, B2, etc.)
  const generateSeatId = (row: number, col: number) => {
    const rowLetter = String.fromCharCode(65 + row) // A, B, C, D
    return `${rowLetter}${col + 1}`
  }

  const handleDragStartFromList = (student: Student) => {
    setDraggedStudent(student)
    setDraggedFromSeat(null)
  }

  const handleDragStartFromSeat = (student: Student, seatId: string) => {
    setDraggedStudent(student)
    setDraggedFromSeat(seatId)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnSeat = (seatId: string) => {
    if (!draggedStudent) return

    const newAssignments = new Map(seatAssignments)
    
    // Remove from old seat if moving
    if (draggedFromSeat) {
      newAssignments.delete(draggedFromSeat)
    }
    
    // Swap if seat is occupied
    const existingStudent = newAssignments.get(seatId)
    if (existingStudent) {
      setUnassignedStudents(prev => [...prev, existingStudent])
    }
    
    newAssignments.set(seatId, draggedStudent)
    setSeatAssignments(newAssignments)
    setUnassignedStudents(prev => prev.filter(s => s.id !== draggedStudent.id))
    
    setDraggedStudent(null)
    setDraggedFromSeat(null)
  }

  const handleDragEnd = () => {
    setDraggedStudent(null)
    setDraggedFromSeat(null)
  }

  const handleSave = async () => {
    if (!primaryClassId) return

    try {
      setSaving(true)
      
      // If no seating chart exists, create one first
      let chartId = seatingChartId
      if (!chartId) {
        chartId = await saveSeatingChartToDatabase()
        if (!chartId) {
          throw new Error('Failed to create seating chart')
        }
      }
      
      // Save assignments
      await saveAssignmentsToDatabase(chartId, 'manual')
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving seating arrangement:', error)
      setError('Failed to save seating arrangement')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSeatAssignments(new Map())
    setUnassignedStudents(allStudents)
    
    // If there's a seating chart in the database, clear it
    if (seatingChartId) {
      try {
        await saveAssignmentsToDatabase(seatingChartId, 'manual')
      } catch (error) {
        console.error('Error clearing assignments:', error)
      }
    }
  }

  const handleAutoArrange = async () => {
    // AI Auto-Arrange: Mix high and low performers, separate needs_focus students
    const topPerformers = allStudents.filter(s => s.behavior_tag === 'top_performer' || s.behavior_tag === 'excellent')
    const needsFocus = allStudents.filter(s => s.behavior_tag === 'needs_focus')
    const average = allStudents.filter(s => s.behavior_tag === 'average')
    
    const arranged: Student[] = []
    const maxLength = Math.max(topPerformers.length, needsFocus.length, average.length)
    
    // Alternate between categories for balanced distribution
    for (let i = 0; i < maxLength; i++) {
      if (topPerformers[i]) arranged.push(topPerformers[i])
      if (average[i]) arranged.push(average[i])
      if (needsFocus[i]) arranged.push(needsFocus[i])
    }
    
    const newAssignments = new Map<string, Student>()
    let seatIndex = 0
    
    for (let row = 0; row < selectedLayout.rows; row++) {
      for (let col = 0; col < selectedLayout.cols; col++) {
        const patternIndex = row * selectedLayout.cols + col
        if (selectedLayout.seatPattern[patternIndex] === 'seat' && seatIndex < arranged.length) {
          const seatId = generateSeatId(row, col)
          newAssignments.set(seatId, arranged[seatIndex])
          seatIndex++
        }
      }
    }
    
    setSeatAssignments(newAssignments)
    setUnassignedStudents(allStudents.slice(seatIndex))
    
    // Auto-save after AI arrangement
    try {
      setSaving(true)
      
      let chartId = seatingChartId
      if (!chartId) {
        chartId = await saveSeatingChartToDatabase()
      }
      
      if (chartId) {
        await saveAssignmentsToDatabase(chartId, 'ai_auto_arrange')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving auto-arranged seating:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handle layout change - save to database
  const handleLayoutChange = async (layoutId: string) => {
    const layout = LAYOUT_TEMPLATES.find(l => l.id === layoutId)
    if (!layout) return
    
    setSelectedLayout(layout)
    
    // Note: We intentionally DON'T clear seat assignments here anymore
    // This preserves student seating when teacher changes layout
    // Teacher can use Reset button if they want to clear assignments
  }

  const getInitials = (student: Student) => {
    return `${student.first_name[0]}${student.last_name[0]}`
  }

  const getBehaviorColor = (tag?: string) => {
    switch (tag) {
      case 'top_performer': return 'bg-green-100 text-green-700 border-green-200'
      case 'excellent': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'needs_focus': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getBehaviorLabel = (tag?: string) => {
    switch (tag) {
      case 'top_performer': return 'Top Performer'
      case 'excellent': return 'Excellent'
      case 'needs_focus': return 'Needs Focus'
      default: return 'Average'
    }
  }

  const filteredStudents = unassignedStudents
    .filter(s => 
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'xp': return b.xp - a.xp
        case 'attendance': return (b.attendance_rate || 0) - (a.attendance_rate || 0)
        case 'behavior':
          const order = { top_performer: 4, excellent: 3, average: 2, needs_focus: 1 }
          return (order[b.behavior_tag || 'average'] || 0) - (order[a.behavior_tag || 'average'] || 0)
        case 'name': return a.first_name.localeCompare(b.first_name)
        default: return 0
      }
    })

  const isLoading = teacherLoading || studentsLoading || loadingChart

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {loadingChart ? 'Loading seating chart...' : teacherLoading ? 'Loading classroom data...' : 'Loading students...'}
          </p>
        </div>
      </div>
    )
  }

  if ((error || teacherError) || !primaryClass) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
            No Primary Class Assigned
          </h3>
          <p className="text-gray-600 mb-6 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {error || teacherError || 'You need to be assigned as a primary teacher to a class to access seating arrangements.'}
          </p>
          <Link href="/teacher/students">
            <Button className="bg-blue-600 hover:bg-blue-700 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <Home className="h-4 w-4 mr-2" />
              Go to Students
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 lg:sticky lg:top-0 z-40">
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                  <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                    Seating Chart — {primaryClass?.class_name || 'Loading...'}
                  </h1>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    <Link href="/teacher" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/teacher/students" className="hover:text-blue-600 transition-colors">Students</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-gray-900">Seating Chart</span>
                  </div>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="lg:hidden flex items-center gap-2">
                <Button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 font-semibold border-gray-300"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <Filter className="h-3 w-3" />
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className={`h-8 px-3 font-semibold transition-all ${
                    saved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {saving ? (
                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : saved ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="h-9 font-semibold"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAutoArrange}
                  className="h-9 font-semibold text-purple-600 border-purple-200 hover:bg-purple-50"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Auto-Arrange
                </Button>
                <Select value={selectedLayout.id} onValueChange={handleLayoutChange}>
                  <SelectTrigger className="w-56 h-9 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{selectedLayout.countryFlag}</span>
                        <span className="truncate">{selectedLayout.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {LAYOUT_TEMPLATES.map((layout) => (
                      <SelectItem key={layout.id} value={layout.id}>
                        <span className="flex items-center gap-2">
                          <span className="text-base">{layout.countryFlag}</span>
                          <span>{layout.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className={`h-9 font-semibold transition-all ${
                    saved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Seating
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b-2 border-gray-200 shadow-sm">
          <div className="flex">
            <button
              onClick={() => setMobileView('layout')}
              className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
                mobileView === 'layout'
                  ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <div className="flex items-center justify-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span>Classroom</span>
              </div>
            </button>
            <button
              onClick={() => setMobileView('students')}
              className={`flex-1 py-3 px-4 text-sm font-bold transition-colors relative ${
                mobileView === 'students'
                  ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                <span>Students</span>
                {unassignedStudents.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                    {unassignedStudents.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Action Menu - Slide Down */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200"
            >
              <div className="p-4 space-y-3">
                {/* Layout Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    🏫 Classroom Layout
                  </label>
                  <Select value={selectedLayout.id} onValueChange={handleLayoutChange}>
                    <SelectTrigger className="w-full h-10 font-semibold bg-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{selectedLayout.countryFlag}</span>
                          <span className="text-sm truncate">{selectedLayout.name}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {LAYOUT_TEMPLATES.map((layout) => (
                        <SelectItem key={layout.id} value={layout.id}>
                          <span className="flex items-center gap-2">
                            <span className="text-base">{layout.countryFlag}</span>
                            <span className="text-sm">{layout.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1.5 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {selectedLayout.description}
                  </p>
                </div>

                {/* Quick Actions */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    ⚡ Quick Actions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        handleAutoArrange()
                        setShowMobileMenu(false)
                      }}
                      className="h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-lg"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-xs">AI Arrange</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        handleReset()
                        setShowMobileMenu(false)
                      }}
                      variant="outline"
                      className="h-12 border-2 border-gray-300 bg-white font-bold"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <RotateCcw className="h-5 w-5" />
                        <span className="text-xs">Reset All</span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Students</p>
                      <p className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{allStudents.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Assigned</p>
                      <p className="text-lg font-extrabold text-green-600" style={{ fontFamily: 'var(--font-jakarta)' }}>{seatAssignments.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Seats</p>
                      <p className="text-lg font-extrabold text-blue-600" style={{ fontFamily: 'var(--font-jakarta)' }}>{selectedLayout.seatPattern.filter(s => s === 'seat').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Classroom Grid */}
            <div className={`flex-1 ${
              mobileView === 'students' ? 'hidden lg:block' : ''
            }`}>
              <Card className="p-3 sm:p-6 lg:p-8 border-gray-200 shadow-lg bg-gradient-to-br from-white to-gray-50">
                {/* Desktop Recommendation Banner - Mobile Only */}
                <div className="lg:hidden mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-lg">💻</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        Pro Tip for Precise Arrangement
                      </p>
                      <p className="text-xs text-amber-800 font-medium leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        For detailed drag & drop positioning and advanced seating customization, we recommend using a desktop or laptop for the best experience.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                      Classroom Layout
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      Arrange students strategically
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-base">{selectedLayout.countryFlag}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'var(--font-dm-sans)' }}>Current Layout</p>
                      <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{selectedLayout.name}</p>
                    </div>
                  </div>
                </div>

                {/* Teacher's Desk Area */}
                <div className="mb-4 sm:mb-6 lg:mb-8 flex justify-center">
                  <div className="relative w-full max-w-2xl">
                    {/* Whiteboard - Responsive */}
                    <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl border-2 sm:border-3 lg:border-4 border-slate-600 shadow-xl sm:shadow-2xl">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-lg sm:text-2xl">📋</span>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base font-bold text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                          Interactive Whiteboard
                        </span>
                      </div>
                      <div className="hidden sm:flex mt-2 items-center justify-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                          <span className="text-xs font-semibold text-white/80" style={{ fontFamily: 'var(--font-dm-sans)' }}>📊 Visual Learning</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                          <span className="text-xs font-semibold text-white/80" style={{ fontFamily: 'var(--font-dm-sans)' }}>🎯 Focus Area</span>
                        </div>
                      </div>
                    </div>
                    {/* Teacher's Desk - Responsive */}
                    <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl border border-amber-300 sm:border-2 shadow-lg sm:shadow-xl hover:shadow-2xl transition-shadow">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-md sm:shadow-lg ring-2 sm:ring-4 ring-amber-200/50">
                          <span className="text-lg sm:text-xl lg:text-2xl">👨‍🏫</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm sm:text-base lg:text-lg font-extrabold text-amber-900 block" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                            Teacher's Desk
                          </span>
                          <p className="text-xs sm:text-sm text-amber-700 font-semibold truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {primaryClass?.class_name || 'Classroom'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend - Responsive */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg sm:rounded-xl border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="w-full sm:w-auto">
                      <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Performance Indicators</p>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 lg:gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm ring-1 sm:ring-2 ring-green-200 flex-shrink-0"></div>
                          <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>Top</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm ring-2 ring-blue-200"></div>
                          <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>Excellent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-sm ring-2 ring-gray-200"></div>
                          <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>Average</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm ring-2 ring-orange-200"></div>
                          <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>Focus</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>Layout Style</p>
                      <p className="text-xs lg:text-sm font-semibold text-gray-600" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {selectedLayout.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seats Grid - Responsive */}
                <div className="grid gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-white/50 rounded-lg sm:rounded-xl overflow-x-auto" style={{ gridTemplateColumns: `repeat(${selectedLayout.cols}, minmax(0, 1fr))` }}>
                  {Array.from({ length: selectedLayout.rows }).map((_, rowIndex) =>
                    Array.from({ length: selectedLayout.cols }).map((_, colIndex) => {
                      const patternIndex = rowIndex * selectedLayout.cols + colIndex
                      const isEmptySpace = selectedLayout.seatPattern[patternIndex] === 'empty'
                      
                      if (isEmptySpace) {
                        return <div key={`empty-${rowIndex}-${colIndex}`} className="aspect-square" />
                      }
                      const seatId = generateSeatId(rowIndex, colIndex)
                      const assignedStudent = seatAssignments.get(seatId)

                      return (
                        <Seat
                          key={seatId}
                          seatId={seatId}
                          student={assignedStudent}
                          getInitials={getInitials}
                          getBehaviorColor={getBehaviorColor}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDropOnSeat(seatId)}
                          onDragStart={() => assignedStudent && handleDragStartFromSeat(assignedStudent, seatId)}
                        />
                      )
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Right Sidebar - Unassigned Students */}
            <div className={`w-full lg:w-96 flex-shrink-0 ${
              mobileView === 'layout' ? 'hidden lg:block' : ''
            }`}>
              <Card className="p-4 sm:p-5 lg:p-6 border-gray-200 shadow-lg bg-gradient-to-br from-white to-blue-50/30 lg:sticky lg:top-24">
                {/* Desktop Recommendation - Mobile Only */}
                <div className="lg:hidden mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💻</span>
                    <p className="text-xs text-amber-800 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      Use desktop for precise drag & drop arrangement
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                        Student Pool
                      </h3>
                      <p className="text-xs text-gray-600 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {unassignedStudents.length} unassigned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-xs text-blue-700 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      Tap to view details • Use AI for quick setup
                    </p>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="space-y-3 mb-5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 font-medium"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-10 pl-9 font-semibold bg-white border-gray-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">📝 Sort by Name</SelectItem>
                        <SelectItem value="xp">⚡ Sort by XP</SelectItem>
                        <SelectItem value="attendance">📊 Sort by Attendance</SelectItem>
                        <SelectItem value="behavior">🎯 Sort by Behavior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Student List */}
                <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 custom-scrollbar" id="unassigned-zone">
                  {filteredStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      getInitials={getInitials}
                      getBehaviorColor={getBehaviorColor}
                      getBehaviorLabel={getBehaviorLabel}
                      onDragStart={() => handleDragStartFromList(student)}
                    />
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-900 font-bold mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {searchTerm ? 'No matches found' : 'All students assigned!'}
                      </p>
                      <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {searchTerm ? 'Try a different search term' : 'Great job organizing the classroom'}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Helper Bar - Responsive */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-t-2 border-blue-200 py-2 sm:py-3 lg:py-4 z-30 backdrop-blur-sm">
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Mobile Helper Bar */}
            <div className="lg:hidden flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Quick View • Use AI Auto-Arrange for instant setup
                </p>
              </div>
              <p className="text-[10px] text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                💻 For precise drag & drop positioning, please use desktop
              </p>
            </div>

            {/* Desktop Helper Bar */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    Quick Tips
                  </p>
                  <p className="text-xs text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Drag & drop students to seats • Use AI Auto-Arrange for smart placement • Changes save automatically
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-semibold text-green-800" style={{ fontFamily: 'var(--font-dm-sans)' }}>System Active</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Last saved</p>
                  <p className="text-xs font-bold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>

    </div>
  )
}

// Enhanced Seat Component with detailed student information
function Seat({ 
  seatId, 
  student,
  getInitials,
  getBehaviorColor,
  onDragOver,
  onDrop,
  onDragStart
}: { 
  seatId: string
  student?: Student
  getInitials: (s: Student) => string
  getBehaviorColor: (tag?: string) => string
  onDragOver: (e: DragEvent) => void
  onDrop: () => void
  onDragStart: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getBehaviorIndicatorColor = (tag?: string) => {
    switch (tag) {
      case 'top_performer': return 'bg-green-500'
      case 'excellent': return 'bg-blue-500'
      case 'needs_focus': return 'bg-orange-500'
      default: return 'bg-gray-400'
    }
  }

  const getAttendanceColor = (rate?: number) => {
    if (!rate) return 'bg-gray-400'
    if (rate >= 95) return 'bg-green-500'
    if (rate >= 85) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        draggable={!!student}
        onDragStart={(e) => {
          e.stopPropagation()
          onDragStart()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          onDragOver(e as any)
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop()
        }}
        className={`
          aspect-square rounded-xl border-2 transition-all duration-200 relative overflow-hidden
          ${student 
            ? 'bg-white border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-400 cursor-move' 
            : 'bg-gray-50 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        {/* Desk Surface Effect */}
        {student && (
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 opacity-50" />
        )}

        <div className="relative h-full p-1 sm:p-1.5 lg:p-2 flex flex-col items-center justify-center">
          {student ? (
            <>
              {/* Behavior Indicator Dot */}
              <div className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${getBehaviorIndicatorColor(student.behavior_tag)} shadow-sm`} />
              
              {/* Attendance Indicator Dot */}
              <div className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${getAttendanceColor(student.attendance_rate)} shadow-sm`} />

              {/* Student Avatar - Responsive */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs lg:text-base shadow-md mb-1 sm:mb-1.5 lg:mb-2 ring-1 sm:ring-2 ring-white">
                {getInitials(student)}
              </div>
              
              {/* Student Name - Responsive */}
              <p className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-gray-900 text-center truncate w-full px-0.5 sm:px-1" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                {student.first_name}
              </p>
              
              {/* Stats Row - Hide on small mobile, show on tablet+ */}
              <div className="hidden sm:flex items-center gap-1 lg:gap-2 mt-1">
                {/* XP Badge */}
                <div className="flex items-center gap-0.5 px-1 lg:px-1.5 py-0.5 bg-amber-50 rounded-full border border-amber-200">
                  <Zap className="h-2 w-2 lg:h-2.5 lg:w-2.5 text-amber-500" />
                  <span className="text-[8px] lg:text-[10px] font-bold text-amber-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {student.xp}
                  </span>
                </div>
                
                {/* Attendance Badge */}
                {student.attendance_rate && (
                  <div className="flex items-center gap-0.5 px-1 lg:px-1.5 py-0.5 bg-green-50 rounded-full border border-green-200">
                    <CheckCircle className="h-2 w-2 lg:h-2.5 lg:w-2.5 text-green-500" />
                    <span className="text-[8px] lg:text-[10px] font-bold text-green-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {student.attendance_rate}%
                    </span>
                  </div>
                )}
              </div>

              {/* Seat Label - Responsive */}
              <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 px-1 sm:px-1.5 py-0.5 bg-gray-100 rounded text-[7px] sm:text-[8px] lg:text-[9px] font-semibold text-gray-600">
                {seatId}
              </div>
            </>
          ) : (
            <>
              {/* Empty Desk - Responsive */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-1 sm:mb-1.5 lg:mb-2 border border-gray-300">
                <User className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-400" />
              </div>
              <p className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-gray-500" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {seatId}
              </p>
              <p className="hidden sm:block text-[8px] lg:text-[10px] text-gray-400 mt-0.5">Empty</p>
            </>
          )}
        </div>
      </div>

      {/* Hover Tooltip - Desktop only */}
      {student && showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl min-w-[160px]">
            <p className="font-bold mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {student.first_name} {student.last_name}
            </p>
            <div className="space-y-0.5 text-[10px]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <div className="flex justify-between">
                <span className="text-gray-400">XP:</span>
                <span className="font-semibold">{student.xp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Attendance:</span>
                <span className="font-semibold">{student.attendance_rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-semibold capitalize">{student.behavior_tag?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seat:</span>
                <span className="font-semibold">{seatId}</span>
              </div>
            </div>
          </div>
          {/* Tooltip Arrow */}
          <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Enhanced Student Card Component
function StudentCard({
  student,
  getInitials,
  getBehaviorColor,
  getBehaviorLabel,
  onDragStart
}: {
  student: Student
  getInitials: (s: Student) => string
  getBehaviorColor: (tag?: string) => string
  getBehaviorLabel: (tag?: string) => string
  onDragStart: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const getBehaviorGradient = (tag?: string) => {
    switch (tag) {
      case 'top_performer': return 'from-green-500 to-emerald-600'
      case 'excellent': return 'from-blue-500 to-indigo-600'
      case 'needs_focus': return 'from-orange-500 to-red-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        setIsDragging(true)
        onDragStart()
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`
        group relative overflow-hidden
        bg-gradient-to-br from-white to-gray-50
        rounded-xl sm:rounded-2xl border-2 border-gray-200
        p-3 sm:p-4 cursor-move
        hover:shadow-xl hover:border-blue-400
        transition-all duration-300
        touch-none select-none
        active:scale-95 active:opacity-75
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
      `}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getBehaviorGradient(student.behavior_tag)} opacity-0 group-hover:opacity-5 transition-opacity`} />
      
      <div className="relative">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar with behavior indicator ring - Responsive */}
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${getBehaviorGradient(student.behavior_tag)} flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg ring-2 sm:ring-4 ring-white group-hover:ring-blue-100 transition-all`}>
              {getInitials(student)}
            </div>
            {/* Drag indicator - Desktop only */}
            <div className="hidden sm:block absolute -right-1 -bottom-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <span className="text-white text-xs">⇄</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Name - Responsive */}
            <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate mb-1 sm:mb-1.5" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
              {student.first_name} {student.last_name}
            </p>
            
            {/* Stats Row - Responsive */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              {/* XP Badge */}
              <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-md sm:rounded-lg border border-amber-300 shadow-sm">
                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-800" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {student.xp}
                </span>
              </div>
              
              {/* Attendance Badge */}
              {student.attendance_rate && (
                <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-md sm:rounded-lg border border-green-300 shadow-sm">
                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                  <span className="text-[10px] sm:text-xs font-bold text-green-800" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {student.attendance_rate}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Behavior Badge - Responsive */}
            {student.behavior_tag && (
              <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r ${getBehaviorGradient(student.behavior_tag)} rounded-md sm:rounded-lg shadow-sm`}>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/80"></div>
                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {getBehaviorLabel(student.behavior_tag)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
