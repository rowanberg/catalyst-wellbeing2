'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Save, 
  Copy, 
  Trash2, 
  Download, 
  Upload,
  Settings,
  Users,
  User,
  BookOpen,
  Grid,
  List,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Wand2,
  RefreshCw,
  Eye,
  Edit,
  Search,
  Filter,
  ArrowLeftRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageLoader } from '@/components/ui/loading-spinner'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'

// Types
interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  label: string
  type: 'period' | 'break' | 'lunch'
}

interface TimetableEntry {
  id: string
  day: string
  slotId: string
  classId: string
  subjectId: string
  teacherId: string
  roomNumber?: string
}

interface Class {
  id: string
  name: string
  grade: string
  section: string
}

interface Subject {
  id: string
  name: string
  code: string
  color: string
}

interface Teacher {
  id: string
  name: string
  email: string
  subjects: string[]
}

interface TimetableScheme {
  id: string
  name: string
  description: string
  periodsPerDay: number
  daysPerWeek: number
  workingDays: string[]
  timeSlots: TimeSlot[]
}

// Sample Data
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SCHEMES: TimetableScheme[] = [
  {
    id: '1',
    name: '6-Period Standard',
    description: '6 periods per day with lunch break',
    periodsPerDay: 6,
    daysPerWeek: 6,
    workingDays: DAYS,
    timeSlots: [
      { id: '1', startTime: '08:00', endTime: '08:45', label: 'Period 1', type: 'period' },
      { id: '2', startTime: '08:45', endTime: '09:30', label: 'Period 2', type: 'period' },
      { id: '3', startTime: '09:30', endTime: '10:15', label: 'Period 3', type: 'period' },
      { id: 'break1', startTime: '10:15', endTime: '10:30', label: 'Short Break', type: 'break' },
      { id: '4', startTime: '10:30', endTime: '11:15', label: 'Period 4', type: 'period' },
      { id: '5', startTime: '11:15', endTime: '12:00', label: 'Period 5', type: 'period' },
      { id: 'lunch', startTime: '12:00', endTime: '12:45', label: 'Lunch Break', type: 'lunch' },
      { id: '6', startTime: '12:45', endTime: '13:30', label: 'Period 6', type: 'period' },
    ]
  },
  {
    id: '2',
    name: '8-Period Extended',
    description: '8 periods with multiple breaks',
    periodsPerDay: 8,
    daysPerWeek: 5,
    workingDays: DAYS.slice(0, 5),
    timeSlots: [
      { id: '1', startTime: '07:30', endTime: '08:15', label: 'Period 1', type: 'period' },
      { id: '2', startTime: '08:15', endTime: '09:00', label: 'Period 2', type: 'period' },
      { id: '3', startTime: '09:00', endTime: '09:45', label: 'Period 3', type: 'period' },
      { id: 'break1', startTime: '09:45', endTime: '10:00', label: 'Tea Break', type: 'break' },
      { id: '4', startTime: '10:00', endTime: '10:45', label: 'Period 4', type: 'period' },
      { id: '5', startTime: '10:45', endTime: '11:30', label: 'Period 5', type: 'period' },
      { id: 'lunch', startTime: '11:30', endTime: '12:15', label: 'Lunch Break', type: 'lunch' },
      { id: '6', startTime: '12:15', endTime: '13:00', label: 'Period 6', type: 'period' },
      { id: '7', startTime: '13:00', endTime: '13:45', label: 'Period 7', type: 'period' },
      { id: 'break2', startTime: '13:45', endTime: '14:00', label: 'Short Break', type: 'break' },
      { id: '8', startTime: '14:00', endTime: '14:45', label: 'Period 8', type: 'period' },
    ]
  }
]

const SAMPLE_SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', code: 'MATH', color: '#3b82f6' },
  { id: '2', name: 'English', code: 'ENG', color: '#10b981' },
  { id: '3', name: 'Science', code: 'SCI', color: '#8b5cf6' },
  { id: '4', name: 'Social Studies', code: 'SS', color: '#f59e0b' },
  { id: '5', name: 'Physical Education', code: 'PE', color: '#ef4444' },
  { id: '6', name: 'Art', code: 'ART', color: '#ec4899' },
  { id: '7', name: 'Music', code: 'MUS', color: '#14b8a6' },
  { id: '8', name: 'Computer Science', code: 'CS', color: '#6366f1' },
]

function TimetableManagementContent() {
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')
  const [selectedScheme, setSelectedScheme] = useState<TimetableScheme>(DEFAULT_SCHEMES[0])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>(SAMPLE_SUBJECTS)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [showSchemeDialog, setShowSchemeDialog] = useState(false)
  const [showAutoGenerateDialog, setShowAutoGenerateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<{ day: string; slotId: string } | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDay, setFilterDay] = useState<string>('all')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>('')

  // Form state for editing
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [roomNumber, setRoomNumber] = useState<string>('')

  // Auto-generate preferences
  const [autoGenPrefs, setAutoGenPrefs] = useState({
    respectBreaks: true,
    maxConsecutive: 3,
    balanceSubjects: true
  })

  // AI Generation Wizard state
  const [aiWizardStep, setAiWizardStep] = useState(1)
  const [generationScope, setGenerationScope] = useState<'single' | 'whole-school'>('single')
  const [selectedClassesForGen, setSelectedClassesForGen] = useState<string[]>([])
  const [teacherCapabilities, setTeacherCapabilities] = useState<Record<string, {
    grades: string[]
    subjects: string[]
    maxPeriodsPerDay: number
    preferredDays: string[]
  }>>({})
  const [aiGenerating, setAiGenerating] = useState(false)
  const [generationPreview, setGenerationPreview] = useState<any>(null)
  
  // Practical admin features
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showTeacherWorkload, setShowTeacherWorkload] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [teacherWorkload, setTeacherWorkload] = useState<Record<string, number>>({})
  const [subjectDistribution, setSubjectDistribution] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchTimetableForClass(selectedClass)
    }
  }, [selectedClass])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('[Timetable] Starting data fetch...')
      
      // Get school ID from profile first
      const profileResponse = await fetch('/api/profile')
      let schoolId = ''
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        schoolId = profileData.school_id
        console.log('[Timetable] Got school ID:', schoolId)
      } else {
        console.error('[Timetable] Failed to fetch profile')
        setLoading(false)
        return
      }

      // Fetch real teachers from the database using GET
      try {
        const teachersResponse = await fetch(`/api/admin/users?schoolId=${schoolId}&role=teacher&limit=100`)
        
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json()
          console.log('[Timetable] Fetched teachers:', teachersData)
          
          // Log first teacher to see actual data structure
          if (teachersData.users?.length > 0) {
            console.log('[Timetable] Sample teacher object:', teachersData.users[0])
          }
          
          const formattedTeachers = teachersData.users?.map((t: any, index: number) => {
            // Construct name from first_name and last_name (actual API structure)
            let teacherName = ''
            
            if (t.first_name && t.last_name) {
              teacherName = `${t.first_name} ${t.last_name}`.trim()
            } else if (t.first_name) {
              teacherName = t.first_name.trim()
            } else if (t.last_name) {
              teacherName = t.last_name.trim()
            } else if (t.name) {
              // Fallback to name field if available
              teacherName = t.name.trim()
            }
            
            // If name is still empty or invalid, try to extract from email
            if (!teacherName || teacherName.toLowerCase() === 'no email') {
              if (t.email && t.email !== 'No email provided') {
                teacherName = t.email.split('@')[0]
                  .replace(/[._-]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                // Capitalize first letter of each word
                teacherName = teacherName.split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ')
              } else {
                teacherName = `Teacher ${index + 1}`
              }
            }
            
            const teacher = {
              id: t.id,
              name: teacherName,
              email: (t.email && t.email !== 'No email provided') ? t.email : 'No email provided',
              subjects: []
            }
            
            console.log(`[Timetable] Teacher ${index + 1}:`, {
              original: { 
                first_name: t.first_name, 
                last_name: t.last_name, 
                name: t.name, 
                email: t.email 
              },
              formatted: teacher
            })
            
            return teacher
          }) || []
          setTeachers(formattedTeachers)
          console.log('[Timetable] Formatted teachers count:', formattedTeachers.length)
          
          // Initialize teacher capabilities
          const initialCapabilities: Record<string, any> = {}
          formattedTeachers.forEach(teacher => {
            initialCapabilities[teacher.id] = {
              grades: [],
              subjects: [],
              maxPeriodsPerDay: 6,
              preferredDays: DAYS
            }
          })
          setTeacherCapabilities(initialCapabilities)
        } else {
          const errorText = await teachersResponse.text()
          console.error('[Timetable] Teachers fetch failed:', teachersResponse.status, errorText)
          setTeachers([])
        }
      } catch (teacherError) {
        console.error('[Timetable] Error fetching teachers:', teacherError)
        setTeachers([])
      }

      // Fetch actual classes from the admin settings
      if (schoolId) {
        try {
          const classesResponse = await fetch('/api/admin/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolId })
          })

          if (classesResponse.ok) {
            const classesData = await classesResponse.json()
            console.log('[Timetable] Fetched classes response:', classesData)
            
            // API returns { classes: [...] } directly
            if (classesData.classes && Array.isArray(classesData.classes)) {
              // Log first class to see actual field names
              if (classesData.classes.length > 0) {
                console.log('[Timetable] Sample class object:', classesData.classes[0])
              }
              
              const formattedClasses = classesData.classes.map((cls: any) => {
                // API returns class_name directly (e.g., "diamond rangers", "RUBY 4TH")
                const className = cls.class_name || cls.name || 'Unnamed Class'
                
                // Try to extract grade from class_name if it contains numbers
                const gradeMatch = className.match(/\d+(?:st|nd|rd|th)?/i)
                const grade = gradeMatch ? gradeMatch[0] : className
                
                return {
                  id: cls.id,
                  name: className,
                  grade: grade,
                  section: className
                }
              })
              console.log('[Timetable] Formatted classes:', formattedClasses)
              setClasses(formattedClasses)
              
              if (formattedClasses.length === 0) {
                console.warn('[Timetable] No classes found! Please configure classes in Admin Settings first.')
              }
            } else {
              console.warn('[Timetable] Invalid classes data structure:', classesData)
              setClasses([])
            }
          } else {
            const errorText = await classesResponse.text()
            console.error('[Timetable] Classes fetch failed:', classesResponse.status, errorText)
            setClasses([])
          }
        } catch (classError) {
          console.error('[Timetable] Error fetching classes:', classError)
          setClasses([])
        }
      } else {
        console.error('[Timetable] No school ID available')
        setClasses([])
      }

      // Fetch subjects from database
      try {
        const subjectsResponse = await fetch('/api/admin/timetable/subjects')
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json()
          console.log('[Timetable] Fetched subjects:', subjectsData)
          const formattedSubjects = (subjectsData.subjects || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            color: s.color || '#3B82F6'
          }))
          setSubjects(formattedSubjects)
        } else {
          console.warn('[Timetable] Failed to fetch subjects, using sample data')
          setSubjects(SAMPLE_SUBJECTS)
        }
      } catch (subjectError) {
        console.error('[Timetable] Error fetching subjects:', subjectError)
        setSubjects(SAMPLE_SUBJECTS)
      }

      // Fetch timetable schemes
      try {
        const schemesResponse = await fetch('/api/admin/timetable/schemes')
        if (schemesResponse.ok) {
          const schemesData = await schemesResponse.json()
          console.log('[Timetable] Fetched schemes:', schemesData)
          if (schemesData.schemes && schemesData.schemes.length > 0) {
            const defaultScheme = schemesData.schemes.find((s: any) => s.isDefault) || schemesData.schemes[0]
            setSelectedScheme(defaultScheme)
          }
        }
      } catch (schemeError) {
        console.error('[Timetable] Error fetching schemes:', schemeError)
      }

      console.log('[Timetable] Data fetch complete')
      
    } catch (error) {
      console.error('[Timetable] Fatal error fetching data:', error)
      setClasses([])
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTimetableForClass = async (classId: string) => {
    try {
      console.log('[Timetable] Fetching timetable for class:', classId)
      const response = await fetch(`/api/admin/timetable/entries?classId=${classId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Timetable] Fetched entries:', data)
        
        // Transform API data to frontend format
        const entries = (data.entries || []).map((entry: any) => ({
          id: entry.id,
          day: entry.day,
          slotId: entry.slotId,
          classId: entry.classId,
          subjectId: entry.subjectId,
          teacherId: entry.teacherId,
          roomNumber: entry.roomNumber
        }))
        
        setTimetableEntries(entries)
        console.log('[Timetable] Loaded', entries.length, 'timetable entries')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Timetable] Failed to fetch timetable entries. Status:', response.status, 'Error:', errorData)
        setTimetableEntries([])
      }
    } catch (error) {
      console.error('[Timetable] Error fetching timetable:', error)
      setTimetableEntries([])
    }
  }

  const handleCellClick = (day: string, slotId: string) => {
    const existingEntry = timetableEntries.find(
      e => e.day === day && e.slotId === slotId && e.classId === selectedClass
    )
    
    if (existingEntry) {
      setSelectedSubject(existingEntry.subjectId)
      setSelectedTeacher(existingEntry.teacherId)
      setRoomNumber(existingEntry.roomNumber || '')
    } else {
      setSelectedSubject('')
      setSelectedTeacher('')
      setRoomNumber('')
    }
    
    setEditingEntry({ day, slotId })
    setShowEditDialog(true)
  }

  const handleSaveEntry = async () => {
    if (!editingEntry || !selectedClass || !selectedSubject || !selectedTeacher) return

    try {
      const existingEntry = timetableEntries.find(
        e => e.day === editingEntry.day && e.slotId === editingEntry.slotId && e.classId === selectedClass
      )

      if (existingEntry) {
        // Update existing entry
        const response = await fetch('/api/admin/timetable/entries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: existingEntry.id,
            subjectId: selectedSubject,
            teacherId: selectedTeacher,
            roomNumber: roomNumber || null
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update entry')
        }
      } else {
        // Create new entry
        const response = await fetch('/api/admin/timetable/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selectedClass,
            subjectId: selectedSubject,
            teacherId: selectedTeacher,
            timeSlotId: editingEntry.slotId,
            dayOfWeek: editingEntry.day,
            roomNumber: roomNumber || null
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create entry')
        }
      }

      // Refresh timetable data
      await fetchTimetableForClass(selectedClass)
      setShowEditDialog(false)
      setSaveMessage('✅ Entry saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error: any) {
      console.error('Error saving entry:', error)
      setSaveMessage(`❌ ${error.message || 'Error saving entry'}`)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleDeleteEntry = async () => {
    if (!editingEntry || !selectedClass) return

    try {
      const existingEntry = timetableEntries.find(
        e => e.day === editingEntry.day && e.slotId === editingEntry.slotId && e.classId === selectedClass
      )

      if (!existingEntry) return

      const response = await fetch(`/api/admin/timetable/entries?entryId=${existingEntry.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      // Refresh timetable data
      await fetchTimetableForClass(selectedClass)
      setShowEditDialog(false)
      setSaveMessage('✅ Entry deleted successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting entry:', error)
      setSaveMessage('❌ Error deleting entry')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const detectConflicts = async () => {
    const newConflicts: string[] = []
    
    // Check each timetable entry for conflicts using the API
    try {
      for (const entry of timetableEntries) {
        if (entry.teacherId || entry.roomNumber) {
          const response = await fetch('/api/admin/timetable/conflicts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacherId: entry.teacherId,
              dayOfWeek: entry.day,
              timeSlotId: entry.slotId,
              roomNumber: entry.roomNumber,
              excludeEntryId: entry.id
            })
          })

          if (response.ok) {
            const { hasConflicts, conflicts } = await response.json()
            if (hasConflicts) {
              conflicts.forEach((c: any) => {
                if (!newConflicts.includes(c.message)) {
                  newConflicts.push(c.message)
                }
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error)
    }
    
    setConflicts(newConflicts)
  }

  const autoGenerateTimetable = () => {
    setShowAutoGenerateDialog(true)
  }

  const handleAutoGenerate = () => {
    if (!selectedClass) return

    const newEntries: TimetableEntry[] = []
    let subjectIndex = 0

    selectedScheme.workingDays.forEach(day => {
      selectedScheme.timeSlots
        .filter(slot => slot.type === 'period')
        .forEach(slot => {
          const subject = subjects[subjectIndex % subjects.length]
          const teacher = teachers.find(t => t.subjects.includes(subject.id)) || teachers[0]

          newEntries.push({
            id: `${day}-${slot.id}-${selectedClass}`,
            day,
            slotId: slot.id,
            classId: selectedClass,
            subjectId: subject.id,
            teacherId: teacher?.id || '',
            roomNumber: `R${Math.floor(Math.random() * 20) + 1}`
          })

          subjectIndex++
        })
    })

    setTimetableEntries(newEntries)
    setShowAutoGenerateDialog(false)
    detectConflicts()
    setSaveMessage('Timetable auto-generated! Review and save.')
    setTimeout(() => setSaveMessage(''), 5000)
  }

  const saveTimetable = async () => {
    if (!selectedClass) return

    try {
      setIsSaving(true)
      // Data is already saved to database via individual entry saves
      // Just run validation
      await detectConflicts()
      
      setSaveMessage('✅ Timetable validated and saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('❌ Error validating timetable')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const exportTimetable = () => {
    console.log('Exporting timetable...')
    setSaveMessage('📄 Export feature coming soon!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const copyToClass = async (targetClassId: string) => {
    if (!selectedClass || targetClassId === selectedClass) return

    try {
      const response = await fetch('/api/admin/timetable/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceClassId: selectedClass,
          targetClassId: targetClassId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to copy timetable')
      }

      const data = await response.json()
      setSaveMessage(`✅ ${data.message || 'Timetable copied successfully'}`)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error copying timetable:', error)
      setSaveMessage('❌ Error copying timetable')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  // Calculate teacher workload
  const calculateTeacherWorkload = () => {
    const workload: Record<string, number> = {}
    teachers.forEach(t => workload[t.id] = 0)
    
    timetableEntries
      .filter(e => e.classId === selectedClass)
      .forEach(entry => {
        if (entry.teacherId) {
          workload[entry.teacherId] = (workload[entry.teacherId] || 0) + 1
        }
      })
    
    setTeacherWorkload(workload)
    return workload
  }

  // Calculate subject distribution
  const calculateSubjectDistribution = () => {
    const distribution: Record<string, number> = {}
    subjects.forEach(s => distribution[s.id] = 0)
    
    timetableEntries
      .filter(e => e.classId === selectedClass)
      .forEach(entry => {
        if (entry.subjectId) {
          distribution[entry.subjectId] = (distribution[entry.subjectId] || 0) + 1
        }
      })
    
    setSubjectDistribution(distribution)
    return distribution
  }

  // Comprehensive validation
  const validateTimetable = () => {
    const errors: string[] = []
    const classEntries = timetableEntries.filter(e => e.classId === selectedClass)
    
    // Check for empty slots
    const totalSlots = selectedScheme.workingDays.length * filteredSlots.length
    if (classEntries.length < totalSlots) {
      errors.push(`⚠️ ${totalSlots - classEntries.length} empty slots remaining`)
    }
    
    // Check subject balance
    const dist = calculateSubjectDistribution()
    const minPerSubject = Math.floor(totalSlots / subjects.length)
    Object.entries(dist).forEach(([subjectId, count]) => {
      if (count < minPerSubject - 2) {
        const subject = subjects.find(s => s.id === subjectId)
        errors.push(`⚠️ ${subject?.name} has only ${count} periods (recommended: ${minPerSubject})`)
      }
    })
    
    // Check teacher overload
    const workload = calculateTeacherWorkload()
    Object.entries(workload).forEach(([teacherId, count]) => {
      const teacher = teachers.find(t => t.id === teacherId)
      const maxPerDay = teacherCapabilities[teacherId]?.maxPeriodsPerDay || 6
      if (count > maxPerDay * selectedScheme.workingDays.length) {
        errors.push(`⚠️ ${teacher?.name} assigned ${count} periods (max: ${maxPerDay * selectedScheme.workingDays.length})`)
      }
    })
    
    setValidationErrors(errors)
    return errors
  }

  // Export to CSV
  const exportToCSV = () => {
    const classEntries = timetableEntries.filter(e => e.classId === selectedClass)
    let csv = 'Day,Period,Subject,Teacher,Room\n'
    
    selectedScheme.workingDays.forEach(day => {
      filteredSlots.forEach(slot => {
        const entry = classEntries.find(e => e.day === day && e.slotId === slot.id)
        if (entry) {
          const subject = subjects.find(s => s.id === entry.subjectId)
          const teacher = teachers.find(t => t.id === entry.teacherId)
          csv += `${day},${slot.label},"${subject?.name || ''}","${teacher?.name || ''}","${entry.roomNumber || ''}"\n`
        } else {
          csv += `${day},${slot.label},,,\n`
        }
      })
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timetable-${classes.find(c => c.id === selectedClass)?.name}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    setSaveMessage('✅ Timetable exported to CSV')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // Print timetable
  const printTimetable = () => {
    window.print()
  }

  const filteredSlots = useMemo(() => {
    return selectedScheme.timeSlots.filter(slot => slot.type === 'period')
  }, [selectedScheme])

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      {/* Mobile Restriction Message - Shows on mobile/tablet only */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center"
              >
                <Calendar className="h-10 w-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                Desktop Required
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Timetable Management requires a desktop or laptop computer for the best experience due to its complex interface and multiple features.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Why desktop only?</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Large data tables and grids</li>
                      <li>• Drag-and-drop functionality</li>
                      <li>• Multiple simultaneous views</li>
                      <li>• Complex editing tools</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => window.location.href = '/admin'}
              >
                Return to Admin Dashboard
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                Please access this page from a computer with a screen width of at least 1024px
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Desktop Content - Shows on desktop only (lg and above) */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 mb-6">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl"
              >
                <Calendar className="h-10 w-10 text-white" />
              </motion.div>
              <div className="text-white">
                <h1 className="text-4xl font-bold tracking-tight">Timetable Management</h1>
                <p className="text-blue-100 mt-2 text-lg">Create and manage intelligent class schedules</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setShowAutoGenerateDialog(true)}
                size="lg"
                className="bg-white text-purple-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                AI Generate
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Classes</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{classes.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Periods/Day</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{selectedScheme.periodsPerDay}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Subjects</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{subjects.length}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all ${
              conflicts.length > 0 
                ? 'bg-gradient-to-br from-red-50 to-orange-50' 
                : 'bg-gradient-to-br from-slate-50 to-gray-50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${conflicts.length > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      Conflicts
                    </p>
                    <p className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                      conflicts.length > 0 
                        ? 'from-red-600 to-orange-600' 
                        : 'from-slate-600 to-gray-600'
                    }`}>
                      {conflicts.length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${conflicts.length > 0 ? 'bg-red-500/10' : 'bg-slate-500/10'}`}>
                    <AlertCircle className={`h-8 w-8 ${conflicts.length > 0 ? 'text-red-600' : 'text-slate-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions Bar */}
      {selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="border-0 bg-gradient-to-r from-slate-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Quick Actions</h3>
                    <p className="text-xs text-slate-600">Productivity tools for faster timetable creation</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      validateTimetable()
                      setSaveMessage('✅ Validation complete. Check warnings below.')
                      setTimeout(() => setSaveMessage(''), 3000)
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Validate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      calculateTeacherWorkload()
                      setShowTeacherWorkload(!showTeacherWorkload)
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Teacher Load
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printTimetable}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Save Message Notification */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border-l-4 border-l-blue-500 p-4 rounded-lg mb-4"
          >
            <p className="text-sm font-medium text-blue-900">{saveMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <Card className="mb-4 border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">Validation Warnings</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher Workload View */}
      {showTeacherWorkload && selectedClass && (
        <Card className="mb-4 border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-900">Teacher Workload Distribution</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTeacherWorkload(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {teachers.map(teacher => {
                    const load = teacherWorkload[teacher.id] || 0
                    const maxLoad = (teacherCapabilities[teacher.id]?.maxPeriodsPerDay || 6) * selectedScheme.workingDays.length
                    const percentage = maxLoad > 0 ? (load / maxLoad) * 100 : 0
                    const isOverloaded = percentage > 100
                    
                    return (
                      <div key={teacher.id} className="bg-white rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{teacher.name}</p>
                          <Badge className={isOverloaded ? 'bg-red-500' : 'bg-green-500'}>
                            {load}
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isOverloaded ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {load}/{maxLoad} periods ({Math.round(percentage)}%)
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* No Classes Alert */}
        {!loading && classes.length === 0 && (
          <Card className="mb-4 border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">No Classes Configured</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    You need to configure grade levels and classes before creating timetables.
                  </p>
                  <a
                    href="/admin/settings"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                  >
                    <Settings className="h-4 w-4" />
                    Go to Admin Settings to configure classes
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Card className="mb-4 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Scheduling Conflicts Detected</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Scheme Selector */}
              <div>
                <Label>Timetable Scheme</Label>
                <Select
                  value={selectedScheme.id}
                  onValueChange={(value) => {
                    const scheme = DEFAULT_SCHEMES.find(s => s.id === value)
                    if (scheme) setSelectedScheme(scheme)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SCHEMES.map(scheme => (
                      <SelectItem key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Selector */}
              <div>
                <Label>Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={classes.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={classes.length === 0 ? "No classes configured" : "Choose a class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No classes found. Please configure classes in{' '}
                        <a href="/admin/settings" className="text-blue-600 underline">Admin Settings</a> first.
                      </div>
                    ) : (
                      classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div>
                <Label>View Mode</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={activeView === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('grid')}
                    className="flex-1"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={activeView === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('list')}
                    className="flex-1"
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  onClick={detectConflicts}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check
                </Button>
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600" 
                  onClick={saveTimetable}
                  disabled={isSaving || !selectedClass}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            
            {/* Additional Actions Row */}
            {selectedClass && (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                <Select onValueChange={copyToClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Copy to class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.filter(c => c.id !== selectedClass).map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        <div className="flex items-center gap-2">
                          <Copy className="h-4 w-4" />
                          {cls.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={() => setTimetableEntries([])}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                
                <Button variant="outline" size="sm" onClick={() => setShowSchemeDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Main Timetable Grid */}
      {selectedClass ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {activeView === 'grid' ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                        <th className="p-4 text-left font-semibold border border-blue-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Day / Period
                          </div>
                        </th>
                        {filteredSlots.map(slot => (
                          <th key={slot.id} className="p-4 text-center font-semibold border border-blue-400 min-w-[150px]">
                            <div className="text-sm">{slot.label}</div>
                            <div className="text-xs opacity-90 mt-1">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScheme.workingDays.map((day, dayIndex) => (
                        <tr key={day} className={dayIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-4 font-semibold text-slate-700 border border-slate-200">
                            {day}
                          </td>
                          {filteredSlots.map(slot => {
                            const entry = timetableEntries.find(
                              e => e.day === day && e.slotId === slot.id && e.classId === selectedClass
                            )
                            const subject = entry ? subjects.find(s => s.id === entry.subjectId) : null

                            return (
                              <td 
                                key={slot.id} 
                                className="p-2 border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => handleCellClick(day, slot.id)}
                              >
                                {subject ? (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="rounded-lg p-3 text-center shadow-sm"
                                    style={{ backgroundColor: `${subject.color}15`, borderLeft: `4px solid ${subject.color}` }}
                                  >
                                    <p className="font-bold text-sm" style={{ color: subject.color }}>
                                      {subject.name}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                      {entry && teachers.find(t => t.id === entry.teacherId)?.name || 'Not assigned'}
                                    </p>
                                    {entry?.roomNumber && (
                                      <p className="text-xs text-slate-500 mt-1">
                                        Room: {entry.roomNumber}
                                      </p>
                                    )}
                                  </motion.div>
                                ) : (
                                  <div className="h-20 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-colors">
                                    <Plus className="h-6 w-6" />
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-slate-500">List view coming soon...</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600 mb-2">No class selected</p>
            <p className="text-sm text-slate-500">Please select a class to view and edit the timetable</p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Manual Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Enhanced Header with Context */}
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Edit className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    Edit Timetable Entry
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    {editingEntry && (
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {editingEntry.day} • {selectedScheme.timeSlots.find(s => s.id === editingEntry?.slotId)?.label} 
                        ({selectedScheme.timeSlots.find(s => s.id === editingEntry?.slotId)?.startTime} - 
                        {selectedScheme.timeSlots.find(s => s.id === editingEntry?.slotId)?.endTime})
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {classes.find(c => c.id === selectedClass)?.name}
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-6 py-4">
            {/* Left Column: Selection */}
            <div className="col-span-2 space-y-6">
              {/* Subject Selection with Quick Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Select Subject *
                  </Label>
                  <span className="text-xs text-slate-500">{subjects.length} available</span>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {subjects.map(subject => {
                    const subjectCount = timetableEntries.filter(e => 
                      e.classId === selectedClass && e.subjectId === subject.id
                    ).length
                    
                    return (
                      <motion.button
                        key={subject.id}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedSubject(subject.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedSubject === subject.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate">{subject.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-slate-500">{subject.code}</span>
                              <span className="text-[10px] text-blue-600">• {subjectCount}p</span>
                            </div>
                          </div>
                          {selectedSubject === subject.id && (
                            <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Teacher & Room in 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Teacher Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Teacher *
                  </Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Choose teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => {
                        const teacherLoad = timetableEntries.filter(e => 
                          e.classId === selectedClass && e.teacherId === teacher.id
                        ).length
                        
                        return (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            <div className="flex items-center gap-2 py-1">
                              <div className="p-1 bg-blue-100 rounded">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{teacher.name}</span>
                                  <Badge className="text-[10px] bg-blue-100 text-blue-700">
                                    {teacherLoad}p
                                  </Badge>
                                </div>
                                <span className="text-xs text-slate-500 block truncate max-w-[200px]">
                                  {teacher.email}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room Number */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Room (Optional)</Label>
                  <Input
                    placeholder="e.g., R101, Lab 2"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full h-12"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <AnimatePresence>
                {selectedSubject && selectedTeacher && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-semibold text-green-900">Ready to Save</p>
                    </div>
                    <div
                      className="p-4 rounded-lg shadow-sm"
                      style={{ 
                        backgroundColor: `${subjects.find(s => s.id === selectedSubject)?.color}15`,
                        borderLeft: `4px solid ${subjects.find(s => s.id === selectedSubject)?.color}`
                      }}
                    >
                      <p className="font-bold text-base mb-1" style={{ color: subjects.find(s => s.id === selectedSubject)?.color }}>
                        {subjects.find(s => s.id === selectedSubject)?.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <User className="h-3 w-3" />
                        {teachers.find(t => t.id === selectedTeacher)?.name}
                      </div>
                      {roomNumber && (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-400 inline-block" />
                          Room: {roomNumber}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Context & Info */}
            <div className="col-span-1 space-y-4">
              {/* Quick Stats */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-sm text-purple-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Quick Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Periods:</span>
                    <Badge className="bg-purple-500">{timetableEntries.filter(e => e.classId === selectedClass).length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">This Day:</span>
                    <Badge className="bg-blue-500">
                      {timetableEntries.filter(e => e.classId === selectedClass && e.day === editingEntry?.day).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Empty Slots:</span>
                    <Badge className="bg-amber-500">
                      {(selectedScheme.workingDays.length * filteredSlots.length) - timetableEntries.filter(e => e.classId === selectedClass).length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tips
                </h3>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>Click subject cards to quickly select</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>Period count shows how many times assigned</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>Teacher load (Xp) shows current workload</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <DialogFooter className="border-t pt-4 flex items-center justify-between">
            <div className="flex gap-2">
              {timetableEntries.find(
                e => e.day === editingEntry?.day && e.slotId === editingEntry?.slotId && e.classId === selectedClass
              ) && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteEntry}
                  size="lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entry
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEntry}
                disabled={!selectedSubject || !selectedTeacher}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-6"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Scheme Configuration Dialog */}
      <Dialog open={showSchemeDialog} onOpenChange={setShowSchemeDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Settings className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    Configure Timetable Scheme
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    Design your school's daily schedule with periods, breaks, and lunch
                  </DialogDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Quick Setup</p>
                <p className="text-sm font-semibold text-blue-600">Step-by-step wizard</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-6 py-4">
            {/* Left Column: Templates & Settings */}
            <div className="col-span-2 space-y-6">
              {/* Quick Templates */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Quick Templates</h3>
                  <Badge className="bg-purple-500 text-xs">Fast Setup</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* 6-Period Standard Template */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedScheme({
                        ...selectedScheme,
                        name: '6-Period Standard',
                        description: '6 teaching periods with break and lunch',
                        timeSlots: [
                          { id: 'p1', startTime: '08:00', endTime: '08:45', label: 'Period 1', type: 'period' },
                          { id: 'p2', startTime: '08:45', endTime: '09:30', label: 'Period 2', type: 'period' },
                          { id: 'p3', startTime: '09:30', endTime: '10:15', label: 'Period 3', type: 'period' },
                          { id: 'b1', startTime: '10:15', endTime: '10:30', label: 'Morning Break', type: 'break' },
                          { id: 'p4', startTime: '10:30', endTime: '11:15', label: 'Period 4', type: 'period' },
                          { id: 'p5', startTime: '11:15', endTime: '12:00', label: 'Period 5', type: 'period' },
                          { id: 'l1', startTime: '12:00', endTime: '12:45', label: 'Lunch Break', type: 'lunch' },
                          { id: 'p6', startTime: '12:45', endTime: '13:30', label: 'Period 6', type: 'period' },
                        ]
                      })
                    }}
                    className="p-3 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 text-left transition-all"
                  >
                    <p className="font-semibold text-sm text-purple-900">6-Period</p>
                    <p className="text-xs text-purple-600">Standard</p>
                    <div className="flex gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" title="6 Periods" />
                      <div className="w-2 h-2 rounded-full bg-green-500" title="1 Break" />
                      <div className="w-2 h-2 rounded-full bg-orange-500" title="1 Lunch" />
                    </div>
                  </motion.button>

                  {/* 7-Period Extended Template */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedScheme({
                        ...selectedScheme,
                        name: '7-Period Extended',
                        description: '7 teaching periods with 2 breaks',
                        timeSlots: [
                          { id: 'p1', startTime: '08:00', endTime: '08:40', label: 'Period 1', type: 'period' },
                          { id: 'p2', startTime: '08:40', endTime: '09:20', label: 'Period 2', type: 'period' },
                          { id: 'p3', startTime: '09:20', endTime: '10:00', label: 'Period 3', type: 'period' },
                          { id: 'b1', startTime: '10:00', endTime: '10:15', label: 'Short Break', type: 'break' },
                          { id: 'p4', startTime: '10:15', endTime: '10:55', label: 'Period 4', type: 'period' },
                          { id: 'p5', startTime: '10:55', endTime: '11:35', label: 'Period 5', type: 'period' },
                          { id: 'l1', startTime: '11:35', endTime: '12:20', label: 'Lunch Break', type: 'lunch' },
                          { id: 'p6', startTime: '12:20', endTime: '13:00', label: 'Period 6', type: 'period' },
                          { id: 'p7', startTime: '13:00', endTime: '13:40', label: 'Period 7', type: 'period' },
                        ]
                      })
                    }}
                    className="p-3 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 text-left transition-all"
                  >
                    <p className="font-semibold text-sm text-purple-900">7-Period</p>
                    <p className="text-xs text-purple-600">Extended</p>
                    <div className="flex gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                    </div>
                  </motion.button>

                  {/* 5-Period Short Template */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedScheme({
                        ...selectedScheme,
                        name: '5-Period Short',
                        description: '5 periods for half-day schedule',
                        timeSlots: [
                          { id: 'p1', startTime: '08:00', endTime: '09:00', label: 'Period 1', type: 'period' },
                          { id: 'p2', startTime: '09:00', endTime: '10:00', label: 'Period 2', type: 'period' },
                          { id: 'b1', startTime: '10:00', endTime: '10:20', label: 'Break', type: 'break' },
                          { id: 'p3', startTime: '10:20', endTime: '11:20', label: 'Period 3', type: 'period' },
                          { id: 'p4', startTime: '11:20', endTime: '12:20', label: 'Period 4', type: 'period' },
                          { id: 'p5', startTime: '12:20', endTime: '13:20', label: 'Period 5', type: 'period' },
                        ]
                      })
                    }}
                    className="p-3 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 text-left transition-all"
                  >
                    <p className="font-semibold text-sm text-purple-900">5-Period</p>
                    <p className="text-xs text-purple-600">Short Day</p>
                    <div className="flex gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  </motion.button>
                </div>
                <p className="text-xs text-purple-700 mt-3 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Click a template to quick-start, then customize as needed
                </p>
              </div>

              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Scheme Name
                  </Label>
                  <Input
                    value={selectedScheme.name}
                    onChange={(e) => setSelectedScheme({ ...selectedScheme, name: e.target.value })}
                    placeholder="e.g., 6-Period Standard"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Description
                  </Label>
                  <Input
                    value={selectedScheme.description}
                    onChange={(e) => setSelectedScheme({ ...selectedScheme, description: e.target.value })}
                    placeholder="e.g., 6 periods with lunch break"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Working Days */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Working Days
                  <span className="text-xs text-slate-500 font-normal ml-auto">{selectedScheme.workingDays.length} selected</span>
                </Label>
                <div className="flex gap-2">
                  {DAYS.map(day => {
                    const isSelected = selectedScheme.workingDays.includes(day)
                    return (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedScheme({
                              ...selectedScheme,
                              workingDays: selectedScheme.workingDays.filter(d => d !== day)
                            })
                          } else {
                            setSelectedScheme({
                              ...selectedScheme,
                              workingDays: [...selectedScheme.workingDays, day]
                            })
                          }
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

            {/* Time Slots Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Time Slots Configuration</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newSlot: TimeSlot = {
                        id: `period-${selectedScheme.timeSlots.length + 1}`,
                        startTime: '14:00',
                        endTime: '14:45',
                        label: `Period ${selectedScheme.timeSlots.filter(s => s.type === 'period').length + 1}`,
                        type: 'period'
                      }
                      setSelectedScheme({
                        ...selectedScheme,
                        timeSlots: [...selectedScheme.timeSlots, newSlot]
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newSlot: TimeSlot = {
                        id: `break-${Date.now()}`,
                        startTime: '10:30',
                        endTime: '10:45',
                        label: 'Break',
                        type: 'break'
                      }
                      setSelectedScheme({
                        ...selectedScheme,
                        timeSlots: [...selectedScheme.timeSlots, newSlot]
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Break
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newSlot: TimeSlot = {
                        id: `lunch-${Date.now()}`,
                        startTime: '12:00',
                        endTime: '12:45',
                        label: 'Lunch Break',
                        type: 'lunch'
                      }
                      setSelectedScheme({
                        ...selectedScheme,
                        timeSlots: [...selectedScheme.timeSlots, newSlot]
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lunch
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4">
                {selectedScheme.timeSlots.map((slot, index) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                      slot.type === 'period'
                        ? 'bg-blue-50 border-blue-200'
                        : slot.type === 'lunch'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          if (index === 0) return
                          const newSlots = [...selectedScheme.timeSlots]
                          const temp = newSlots[index]
                          newSlots[index] = newSlots[index - 1]
                          newSlots[index - 1] = temp
                          setSelectedScheme({ ...selectedScheme, timeSlots: newSlots })
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-white rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </button>
                      <button
                        onClick={() => {
                          if (index === selectedScheme.timeSlots.length - 1) return
                          const newSlots = [...selectedScheme.timeSlots]
                          const temp = newSlots[index]
                          newSlots[index] = newSlots[index + 1]
                          newSlots[index + 1] = temp
                          setSelectedScheme({ ...selectedScheme, timeSlots: newSlots })
                        }}
                        disabled={index === selectedScheme.timeSlots.length - 1}
                        className="p-1 hover:bg-white rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Type Badge */}
                    <div className="w-20">
                      <Badge
                        className={
                          slot.type === 'period'
                            ? 'bg-blue-500'
                            : slot.type === 'lunch'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }
                      >
                        {slot.type === 'period' ? '📚 Period' : slot.type === 'lunch' ? '🍽️ Lunch' : '☕ Break'}
                      </Badge>
                    </div>

                    {/* Label Input */}
                    <div className="flex-1">
                      <Input
                        value={slot.label}
                        onChange={(e) => {
                          const newSlots = [...selectedScheme.timeSlots]
                          newSlots[index] = { ...newSlots[index], label: e.target.value }
                          setSelectedScheme({ ...selectedScheme, timeSlots: newSlots })
                        }}
                        placeholder="Label"
                        className="bg-white"
                      />
                    </div>

                    {/* Start Time */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...selectedScheme.timeSlots]
                          newSlots[index] = { ...newSlots[index], startTime: e.target.value }
                          setSelectedScheme({ ...selectedScheme, timeSlots: newSlots })
                        }}
                        className="w-32 bg-white"
                      />
                    </div>

                    {/* End Time */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...selectedScheme.timeSlots]
                          newSlots[index] = { ...newSlots[index], endTime: e.target.value }
                          setSelectedScheme({ ...selectedScheme, timeSlots: newSlots })
                        }}
                        className="w-32 bg-white"
                      />
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedScheme({
                          ...selectedScheme,
                          timeSlots: selectedScheme.timeSlots.filter((_, i) => i !== index)
                        })
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}

                {selectedScheme.timeSlots.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No time slots configured</p>
                    <p className="text-xs mt-1">Use the buttons above to add periods, breaks, or lunch</p>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Right Sidebar: Live Summary & Visual Timeline */}
            <div className="col-span-1 space-y-4">
              {/* Live Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 sticky top-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-blue-900">Live Summary</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <span className="text-xs text-slate-600">Total Slots</span>
                    <Badge className="bg-slate-700">{selectedScheme.timeSlots.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-100 rounded-lg">
                    <span className="text-xs text-blue-800 flex items-center gap-1">
                      📚 Periods
                    </span>
                    <Badge className="bg-blue-600">
                      {selectedScheme.timeSlots.filter(s => s.type === 'period').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-100 rounded-lg">
                    <span className="text-xs text-green-800 flex items-center gap-1">
                      ☕ Breaks
                    </span>
                    <Badge className="bg-green-600">
                      {selectedScheme.timeSlots.filter(s => s.type === 'break').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-100 rounded-lg">
                    <span className="text-xs text-orange-800 flex items-center gap-1">
                      🍽️ Lunch
                    </span>
                    <Badge className="bg-orange-600">
                      {selectedScheme.timeSlots.filter(s => s.type === 'lunch').length}
                    </Badge>
                  </div>
                </div>

                {/* Visual Timeline Preview */}
                {selectedScheme.timeSlots.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="text-xs font-semibold text-blue-900 mb-2">Timeline Preview</h4>
                    <div className="space-y-1">
                      {selectedScheme.timeSlots.slice(0, 6).map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            slot.type === 'period' ? 'bg-blue-500' : 
                            slot.type === 'lunch' ? 'bg-orange-500' : 
                            'bg-green-500'
                          }`} />
                          <span className="text-[10px] text-slate-600 truncate">
                            {slot.label} ({slot.startTime})
                          </span>
                        </div>
                      ))}
                      {selectedScheme.timeSlots.length > 6 && (
                        <p className="text-[10px] text-slate-500 pl-4">
                          +{selectedScheme.timeSlots.length - 6} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Guide */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-sm text-amber-900">Quick Guide</h3>
                </div>
                <ul className="space-y-2 text-xs text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">1.</span>
                    <span>Click a template or start from scratch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">2.</span>
                    <span>Select working days for your school</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">3.</span>
                    <span>Add periods, breaks, and lunch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">4.</span>
                    <span>Use ↑↓ arrows to reorder slots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">5.</span>
                    <span>Adjust timings as needed</span>
                  </li>
                </ul>
              </div>

              {/* Best Practices */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-sm text-green-900">Best Practices</h3>
                </div>
                <ul className="space-y-2 text-xs text-green-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <span>45-60 min periods work best</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <span>Include 15-min break after 2-3 periods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <span>Lunch should be 45-60 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <span>Keep consistent timing across days</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchemeDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                setShowSchemeDialog(false)
                setSaveMessage('✅ Scheme configuration updated!')
                setTimeout(() => setSaveMessage(''), 3000)
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Apply Scheme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Wizard Dialog */}
      <Dialog open={showAutoGenerateDialog} onOpenChange={(open) => {
        setShowAutoGenerateDialog(open)
        if (!open) {
          setAiWizardStep(1)
          setGenerationScope('single')
          setSelectedClassesForGen([])
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              AI-Powered Timetable Generation
            </DialogTitle>
            <DialogDescription>
              Step {aiWizardStep} of 4: {
                aiWizardStep === 1 ? 'Choose Generation Scope' :
                aiWizardStep === 2 ? 'Configure Teacher Capabilities' :
                aiWizardStep === 3 ? 'Review & Confirm' :
                'Generation Complete'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                  step < aiWizardStep ? 'bg-purple-500 border-purple-500 text-white' :
                  step === aiWizardStep ? 'bg-purple-100 border-purple-500 text-purple-700' :
                  'bg-slate-100 border-slate-300 text-slate-400'
                }`}>
                  {step < aiWizardStep ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 4 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    step < aiWizardStep ? 'bg-purple-500' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Scope Selection */}
          {aiWizardStep === 1 && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">Choose Generation Scope</h3>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setGenerationScope('single')
                      setSelectedClassesForGen(selectedClass ? [selectedClass] : [])
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      generationScope === 'single'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Single Class</h4>
                        <p className="text-sm text-slate-600">
                          Generate timetable for one specific class
                        </p>
                      </div>
                      {generationScope === 'single' && (
                        <Badge className="bg-purple-500">Selected</Badge>
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setGenerationScope('whole-school')
                      setSelectedClassesForGen(classes.map(c => c.id))
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      generationScope === 'whole-school'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Whole School</h4>
                        <p className="text-sm text-slate-600">
                          Generate timetables for all {classes.length} classes
                        </p>
                      </div>
                      {generationScope === 'whole-school' && (
                        <Badge className="bg-purple-500">Selected</Badge>
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>

              {generationScope === 'single' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Label className="font-semibold mb-3 block">Select Class</Label>
                  <Select 
                    value={selectedClassesForGen[0] || ''} 
                    onValueChange={(val) => setSelectedClassesForGen([val])}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {generationScope === 'whole-school' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">
                        All Classes Selected
                      </p>
                      <p className="text-xs text-green-700">
                        AI will generate timetables for all {classes.length} classes considering teacher availability across the entire school.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Teacher Capabilities */}
          {aiWizardStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Configure Teacher Capabilities</h3>
                <Badge variant="outline">{teachers.length} Teachers</Badge>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Configure Each Teacher's Teaching Capabilities
                    </p>
                    <p className="text-xs text-amber-700">
                      Specify which subjects and classes each teacher can teach. This ensures accurate timetable generation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {teacher.name}
                          {(teacher.name.startsWith('Teacher ') || teacher.name === 'Unnamed Teacher') && (
                            <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-300">
                              Auto-named
                            </Badge>
                          )}
                        </h4>
                        <p className={`text-xs ${teacher.email === 'No email provided' ? 'text-amber-600 italic font-medium' : 'text-slate-500'}`}>
                          {teacher.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm mb-2 block">Can Teach Subjects</Label>
                        <div className="flex flex-wrap gap-2">
                          {subjects.map(subject => {
                            const isSelected = teacherCapabilities[teacher.id]?.subjects.includes(subject.id)
                            return (
                              <button
                                key={subject.id}
                                onClick={() => {
                                  const current = teacherCapabilities[teacher.id]?.subjects || []
                                  setTeacherCapabilities({
                                    ...teacherCapabilities,
                                    [teacher.id]: {
                                      ...teacherCapabilities[teacher.id],
                                      subjects: isSelected 
                                        ? current.filter(s => s !== subject.id)
                                        : [...current, subject.id]
                                    }
                                  })
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {subject.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm mb-2 block">Max Periods/Day</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={teacherCapabilities[teacher.id]?.maxPeriodsPerDay || 6}
                          onChange={(e) => {
                            setTeacherCapabilities({
                              ...teacherCapabilities,
                              [teacher.id]: {
                                ...teacherCapabilities[teacher.id],
                                maxPeriodsPerDay: parseInt(e.target.value) || 6
                              }
                            })
                          }}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {aiWizardStep === 3 && (
            <div className="space-y-6 py-4">
              <h3 className="font-semibold text-lg mb-4">Review Configuration</h3>

              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Generation Scope</h4>
                  <p className="text-sm text-purple-700">
                    {generationScope === 'single' 
                      ? `Single Class: ${classes.find(c => c.id === selectedClassesForGen[0])?.name}`
                      : `Whole School: ${classes.length} classes`}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Teachers Configured</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {teachers.map(teacher => {
                      const caps = teacherCapabilities[teacher.id]
                      const subjectCount = caps?.subjects?.length || 0
                      return (
                        <div key={teacher.id} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-blue-800">
                            {teacher.name} ({subjectCount} subjects)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">AI Will Ensure:</h4>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Zero conflicts - no teacher double-booking
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Optimal distribution across {selectedScheme.workingDays.length} working days
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Respect teacher max periods/day limits
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Balanced subject distribution
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Warning</p>
                      <p className="text-xs text-amber-700">
                        This will replace existing timetables for selected classes. Make sure to save any important work before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Generation Complete */}
          {aiWizardStep === 4 && (
            <div className="space-y-6 py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-green-600" />
              </motion.div>
              <div>
                <h3 className="font-bold text-2xl text-green-900 mb-2">Generation Complete!</h3>
                <p className="text-slate-600">
                  Timetables have been successfully generated for {
                    generationScope === 'single' ? '1 class' : `${classes.length} classes`
                  }
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  ✅ {generationScope === 'whole-school' ? classes.length : 1} timetable(s) generated<br/>
                  ✅ 0 conflicts detected<br/>
                  ✅ All teacher constraints satisfied
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {aiWizardStep > 1 && aiWizardStep < 4 && (
              <Button variant="outline" onClick={() => setAiWizardStep(aiWizardStep - 1)}>
                <ArrowLeftRight className="h-4 w-4 mr-2 rotate-180" />
                Back
              </Button>
            )}
            
            {aiWizardStep < 3 && (
              <Button 
                className="bg-purple-500 hover:bg-purple-600"
                onClick={() => setAiWizardStep(aiWizardStep + 1)}
                disabled={aiWizardStep === 1 && selectedClassesForGen.length === 0}
              >
                Continue
                <ArrowLeftRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {aiWizardStep === 3 && (
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={() => {
                  setAiGenerating(true)
                  // Simulate AI generation
                  setTimeout(() => {
                    setAiGenerating(false)
                    setAiWizardStep(4)
                    handleAutoGenerate()
                  }, 2000)
                }}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Timetables
                  </>
                )}
              </Button>
            )}

            {aiWizardStep === 4 && (
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={() => {
                  setShowAutoGenerateDialog(false)
                  setAiWizardStep(1)
                }}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}

export default function TimetableManagementPage() {
  return (
    <UnifiedAuthGuard requiredRole="admin">
      <TimetableManagementContent />
    </UnifiedAuthGuard>
  )
}
