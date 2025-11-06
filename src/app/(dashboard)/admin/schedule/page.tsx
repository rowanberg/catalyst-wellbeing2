'use client'

/**
 * Admin Academic Schedule Management - Mobile Optimized
 * Advanced mobile UX with touch gestures, bottom sheets, and performance optimizations
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, 
  Users, BookOpen, Trophy, PartyPopper, Clock, MapPin,
  AlertCircle, CheckCircle, X, Search, Filter, Download,
  Bell, Link as LinkIcon, Paperclip, ArrowLeft, RefreshCw, Menu,
  MoreVertical, List as ListIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/redux/hooks'

interface AcademicEvent {
  id: string
  title: string
  description?: string
  event_type: 'exam' | 'assignment' | 'holiday' | 'event' | 'deadline' | 'meeting' | 'sports' | 'cultural'
  start_date: string
  end_date?: string
  all_day: boolean
  target_audience: string[]
  grade_levels?: string[]
  sections?: string[]
  subject?: string
  academic_year: string
  term?: string
  status: 'active' | 'cancelled' | 'completed' | 'draft'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  location?: string
  meeting_link?: string
  send_notification: boolean
}

const eventTypes = [
  { value: 'exam', label: 'Exam', icon: BookOpen, color: 'red' },
  { value: 'assignment', label: 'Assignment', icon: BookOpen, color: 'blue' },
  { value: 'holiday', label: 'Holiday', icon: PartyPopper, color: 'green' },
  { value: 'event', label: 'School Event', icon: Calendar, color: 'purple' },
  { value: 'deadline', label: 'Deadline', icon: Clock, color: 'orange' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'cyan' },
  { value: 'sports', label: 'Sports', icon: Trophy, color: 'yellow' },
  { value: 'cultural', label: 'Cultural', icon: PartyPopper, color: 'pink' }
]

export default function AcademicSchedulePage() {
  const router = useRouter()
  const { profile } = useAppSelector((state) => state.auth)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<AcademicEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<AcademicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const [sheetEvent, setSheetEvent] = useState<AcademicEvent | null>(null)
  const [showMobileDateEvents, setShowMobileDateEvents] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'event' as AcademicEvent['event_type'],
    start_date: '',
    end_date: '',
    all_day: true,
    target_audience: ['student', 'teacher', 'parent'],
    grade_levels: [] as string[],
    subject: '',
    academic_year: '2024-25',
    priority: 'normal' as AcademicEvent['priority'],
    location: '',
    meeting_link: '',
    send_notification: true
  })

  // Fetch events
  const fetchEvents = async () => {
    if (!profile?.school_id) {
      console.log('❌ No school_id in profile:', profile)
      return
    }
    
    try {
      setLoading(true)
      const url = `/api/admin/academic-schedule?school_id=${profile.school_id}`
      console.log('🔄 Fetching events from:', url)
      
      const response = await fetch(url)
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Events fetched:', result)
        
        // ApiResponse wraps data in result.data
        const events = result.data?.events || []
        console.log('📊 Event count:', events.length)
        console.log('📋 Events:', events)
        
        setEvents(events)
        setFilteredEvents(events)
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch events:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (profile?.school_id) {
      fetchEvents()
    }
  }, [profile])

  // Swipe gesture handlers for mobile month navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY
    const touchDuration = Date.now() - touchStartTime.current
    const horizontalDistance = touchStartX.current - touchEndX.current
    const verticalDistance = Math.abs(touchStartY.current - touchEndY)
    
    const minSwipeDistance = 80 // Increased from 50 for more intentional swipes
    const maxSwipeDuration = 500 // Max 500ms for a swipe
    const maxVerticalMovement = 50 // Don't treat as swipe if too much vertical movement
    
    // Only trigger month change if it's a clear horizontal swipe
    const isValidSwipe = 
      Math.abs(horizontalDistance) > minSwipeDistance &&
      touchDuration < maxSwipeDuration &&
      verticalDistance < maxVerticalMovement
    
    if (isValidSwipe) {
      if (horizontalDistance > 0) {
        // Swiped left - next month
        goToNextMonth()
      } else {
        // Swiped right - previous month
        goToPreviousMonth()
      }
    }
  }, [currentDate])

  // Filter events
  useEffect(() => {
    let filtered = events

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.subject?.toLowerCase().includes(query)
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.event_type === filterType)
    }

    setFilteredEvents(filtered)
  }, [searchQuery, filterType, events])

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Memoized calendar days calculation
  const calendarDays = useMemo((): (Date | null)[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }, [currentDate])

  // Memoized events by date map for O(1) lookups
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AcademicEvent[]>()
    filteredEvents.forEach(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
      
      // Add event to all dates in range
      for (let d = new Date(eventStart); d <= eventEnd; d.setDate(d.getDate() + 1)) {
        const key = d.toDateString()
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)!.push(event)
      }
    })
    return map
  }, [filteredEvents])

  // Fast event lookup
  const getEventsForDate = useCallback((date: Date) => {
    return eventsByDate.get(date.toDateString()) || []
  }, [eventsByDate])

  // Handle form submit
  const handleSubmit = async () => {
    if (!profile?.school_id || submitting) return
    
    try {
      setSubmitting(true)
      const url = editingEvent 
        ? `/api/admin/academic-schedule/${editingEvent.id}`
        : '/api/admin/academic-schedule'
      
      const method = editingEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          school_id: profile.school_id
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Event saved successfully:', result)
        await fetchEvents()
        setShowEventDialog(false)
        resetForm()
        alert('Event saved successfully!')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Failed to save event:', errorData)
        alert(`Failed to save event: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return

    try {
      const response = await fetch(`/api/admin/academic-schedule/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEvents()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'event',
      start_date: '',
      end_date: '',
      all_day: true,
      target_audience: ['student', 'teacher', 'parent'],
      grade_levels: [],
      subject: '',
      academic_year: '2024-25',
      priority: 'normal',
      location: '',
      meeting_link: '',
      send_notification: true
    })
    setEditingEvent(null)
  }

  // Open edit dialog
  const openEditDialog = (event: AcademicEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_date: event.start_date.split('T')[0],
      end_date: event.end_date?.split('T')[0] || '',
      all_day: event.all_day,
      target_audience: event.target_audience,
      grade_levels: event.grade_levels || [],
      subject: event.subject || '',
      academic_year: event.academic_year,
      priority: event.priority,
      location: event.location || '',
      meeting_link: event.meeting_link || '',
      send_notification: event.send_notification
    })
    setShowEventDialog(true)
  }

  // Mobile sheet handlers
  const openMobileSheet = (event: AcademicEvent) => {
    setSheetEvent(event)
    setShowMobileSheet(true)
  }

  const closeMobileSheet = () => {
    setShowMobileSheet(false)
    setTimeout(() => setSheetEvent(null), 300)
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Mobile-Optimized Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 lg:mb-6"
      >
        {/* Mobile Compact Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-white/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Schedule
            </h1>
            <Button
              size="sm"
              onClick={() => {
                resetForm()
                setShowEventDialog(true)
              }}
              className="p-2 bg-purple-600 text-white hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <span>Academic Schedule</span>
              </h1>
              <p className="text-slate-600 mt-1">Manage events for 2024-25 Academic Year</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={fetchEvents}
              className="hover:bg-white/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                resetForm()
                setShowEventDialog(true)
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Mobile-Optimized Filters */}
        <div className="space-y-3">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white h-10 text-sm"
            />
          </div>
          
          {/* Filter Type & View Mode - Side by Side on Mobile */}
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="flex-1 bg-white h-10 text-sm">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Compact View Toggle */}
            <div className="flex border rounded-lg bg-white overflow-hidden h-10">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
                  viewMode === 'month' ? "bg-purple-600 text-white" : "text-slate-600 active:bg-slate-100"
                )}
                aria-label="Month view"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
                  viewMode === 'list' ? "bg-purple-600 text-white" : "text-slate-600 active:bg-slate-100"
                )}
                aria-label="List view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar - Compact Enterprise Design */}
          <div className="lg:col-span-3">
            <Card className="border border-slate-200 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white py-2.5 lg:py-4 px-3 lg:px-6 border-b-2 border-purple-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold lg:text-xl flex items-center gap-2">
                    <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
                    {monthName}
                  </CardTitle>
                  <div className="flex items-center gap-0.5 lg:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPreviousMonth}
                      className="text-white hover:bg-white/20 h-7 w-7 p-0 lg:h-auto lg:w-auto lg:px-3 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="text-white hover:bg-white/20 text-[10px] lg:text-sm px-1.5 lg:px-3 h-7 font-semibold rounded-lg"
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNextMonth}
                      className="text-white hover:bg-white/20 h-7 w-7 p-0 lg:h-auto lg:w-auto lg:px-3 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent 
                className="p-2 lg:p-6 bg-slate-50"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Days of week - Compact */}
                <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-1.5 lg:mb-2 bg-white rounded-lg p-1.5 lg:p-2 border border-slate-200">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx} className="text-center text-[10px] lg:text-sm font-extrabold text-slate-600 py-1 lg:py-2">
                      <span className="lg:hidden">{day}</span>
                      <span className="hidden lg:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar grid - Compact Enterprise */}
                <div className="grid grid-cols-7 gap-1 lg:gap-2">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const dayEvents = getEventsForDate(date)
                    const isToday = date.toDateString() === today.toDateString()
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()

                    return (
                      <motion.button
                        key={date.toISOString()}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedDate(date)
                          // On mobile, show events list for this date
                          if (isMobile && dayEvents.length > 0) {
                            setShowMobileDateEvents(true)
                          }
                        }}
                        className={cn(
                          "aspect-square p-1 lg:p-2 rounded-lg lg:rounded-xl transition-all relative flex flex-col bg-white",
                          "min-h-[44px] lg:min-h-[80px] touch-manipulation",
                          "border shadow-sm",
                          isToday && "ring-2 ring-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-600 shadow-md",
                          isSelected && "ring-2 ring-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-600 shadow-md",
                          !isToday && !isSelected && "border-slate-200/80 hover:border-slate-300 active:border-purple-400 active:shadow",
                          dayEvents.length > 0 && !isToday && !isSelected && "border-purple-300 bg-gradient-to-br from-purple-50/50 to-white shadow",
                        )}
                      >
                        <div className="text-xs lg:text-sm font-bold text-slate-800">{date.getDate()}</div>
                        
                        {/* Event indicators - Compact & Professional */}
                        {dayEvents.length > 0 && (
                          <div className="mt-auto">
                            {/* Mobile: Compact dot row */}
                            <div className="lg:hidden flex gap-0.5 justify-center items-center mt-0.5">
                              {dayEvents.slice(0, 3).map((event, i) => {
                                const eventType = eventTypes.find(t => t.value === event.event_type)
                                return (
                                  <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full border border-white shadow-sm"
                                    style={{
                                      backgroundColor: eventType?.color === 'red' ? '#ef4444' :
                                                      eventType?.color === 'blue' ? '#3b82f6' :
                                                      eventType?.color === 'green' ? '#22c55e' :
                                                      eventType?.color === 'purple' ? '#a855f7' :
                                                      eventType?.color === 'orange' ? '#f97316' :
                                                      eventType?.color === 'cyan' ? '#06b6d4' :
                                                      eventType?.color === 'yellow' ? '#eab308' :
                                                      eventType?.color === 'pink' ? '#ec4899' : '#64748b'
                                    }}
                                  />
                                )
                              })}
                              {dayEvents.length > 3 && (
                                <span className="text-[8px] font-extrabold text-purple-700">+{dayEvents.length - 3}</span>
                              )}
                            </div>
                            
                            {/* Desktop: Show event names - Clickable to edit */}
                            <div className="hidden lg:block">
                              {dayEvents.slice(0, 2).map((event, i) => {
                                const eventType = eventTypes.find(t => t.value === event.event_type)
                                return (
                                  <div
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation() // Prevent date selection
                                      openEditDialog(event)
                                    }}
                                    className="text-[10px] px-1 py-0.5 rounded truncate w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
                                    style={{
                                      backgroundColor: `${eventType?.color === 'red' ? '#fee2e2' :
                                                          eventType?.color === 'blue' ? '#dbeafe' :
                                                          eventType?.color === 'green' ? '#dcfce7' :
                                                          eventType?.color === 'purple' ? '#f3e8ff' :
                                                          eventType?.color === 'orange' ? '#ffedd5' :
                                                          eventType?.color === 'cyan' ? '#cffafe' :
                                                          eventType?.color === 'yellow' ? '#fef9c3' :
                                                          eventType?.color === 'pink' ? '#fce7f3' : '#f1f5f9'}`,
                                      color: `${eventType?.color === 'red' ? '#991b1b' :
                                              eventType?.color === 'blue' ? '#1e40af' :
                                              eventType?.color === 'green' ? '#166534' :
                                              eventType?.color === 'purple' ? '#6b21a8' :
                                              eventType?.color === 'orange' ? '#9a3412' :
                                              eventType?.color === 'cyan' ? '#164e63' :
                                              eventType?.color === 'yellow' ? '#854d0e' :
                                              eventType?.color === 'pink' ? '#9f1239' : '#475569'}`
                                    }}
                                    title={`Click to edit: ${event.title}`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        openEditDialog(event)
                                      }
                                    }}
                                  >
                                    {event.title}
                                  </div>
                                )
                              })}
                              {dayEvents.length > 2 && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDate(date)
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-slate-700 transition-colors w-full text-left cursor-pointer"
                                  title="View all events for this date"
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setSelectedDate(date)
                                    }
                                  }}
                                >
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Selected Date Events (Desktop Only) */}
          <div className="hidden lg:block">
            <Card className="border-0 shadow-xl bg-white sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-2xl">
                <CardTitle className="text-lg">
                  {selectedDate ? selectedDate.toLocaleDateString('default', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                {selectedDate && (() => {
                  const dayEvents = getEventsForDate(selectedDate)
                  if (dayEvents.length > 0) {
                    return (
                      <div className="space-y-3">
                        {dayEvents.map((event) => {
                          const eventType = eventTypes.find(t => t.value === event.event_type)
                          return (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                              style={{ borderLeftColor: `var(--${eventType?.color}-500)` }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-sm">{event.title}</p>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => openEditDialog(event)}
                                    className="p-1 hover:bg-white rounded"
                                  >
                                    <Edit className="w-3 h-3 text-slate-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(event.id)}
                                    className="p-1 hover:bg-white rounded"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </button>
                                </div>
                              </div>
                              {event.description && (
                                <p className="text-xs text-slate-600 mb-2">{event.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {eventType?.label}
                                </Badge>
                                {event.subject && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.subject}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                  return (
                    <p className="text-sm text-slate-500 text-center py-8">
                      No events scheduled
                    </p>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // List View
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="space-y-3">
              {filteredEvents
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                .map((event) => {
                  const eventType = eventTypes.find(t => t.value === event.event_type)
                  return (
                    <motion.div
                      key={event.id}
                      whileHover={{ x: 4 }}
                      className="p-4 rounded-lg border bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={cn("text-white", `bg-${eventType?.color}-500`)}>
                              {eventType?.label}
                            </Badge>
                            {event.priority !== 'normal' && (
                              <Badge variant="outline">{event.priority}</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(event.start_date).toLocaleDateString()}
                            </span>
                            {event.location && (
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              
              {filteredEvents.length === 0 && (
                <p className="text-center text-slate-500 py-12">
                  No events found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Event Dialog - Full Screen on Mobile */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-5xl lg:max-h-[90vh] h-full lg:h-auto w-full lg:w-auto m-0 lg:m-4 p-0 rounded-none lg:rounded-2xl overflow-hidden flex flex-col">
          {/* Header - Sticky */}
          <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5 border-b-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
                <p className="text-purple-100 mt-1.5 text-sm">Fill in the details below to schedule an event</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEventDialog(false)}
                className="lg:hidden h-9 w-9 p-0 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Form Content - Scrollable with constrained width */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
              <div className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                      Basic Information
                    </h3>
                  </div>
                  <div className="p-5 space-y-5">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                        Event Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter a descriptive title for your event"
                        className="h-12 text-base border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide detailed information about the event, agenda, or special instructions"
                        rows={4}
                        className="text-base resize-none border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                          Event Type <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.event_type}
                          onValueChange={(value: any) => setFormData({ ...formData, event_type: value })}
                        >
                          <SelectTrigger className="h-12 text-base border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="w-4 h-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Priority Level</Label>
                        <Select 
                          value={formData.priority}
                          onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger className="h-12 text-base border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                Low Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="normal">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                Normal Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                High Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                Urgent
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                      Date & Time
                    </h3>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Start Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          End Date
                        </Label>
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={formData.all_day}
                          onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                          className="data-[state=checked]:bg-blue-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <Label className="text-sm font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            All Day Event
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">Event spans the entire day without specific time slots</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                      Additional Details
                    </h3>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          Subject
                        </Label>
                        <Input
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="e.g., Mathematics, Science"
                          className="h-12 text-base border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Location
                        </Label>
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g., Main Auditorium, Room 101"
                          className="h-12 text-base border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        Meeting Link
                      </Label>
                      <Input
                        value={formData.meeting_link}
                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                        placeholder="https://meet.google.com/... or https://zoom.us/..."
                        className="h-12 text-base border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                        type="url"
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-amber-600 rounded-full" />
                      Notifications
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={formData.send_notification}
                          onCheckedChange={(checked) => setFormData({ ...formData, send_notification: checked })}
                          className="data-[state=checked]:bg-purple-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <Label className="text-sm font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Send Notification
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">Automatically notify students, teachers, and parents about this event</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Sticky with Enterprise Styling */}
          <DialogFooter className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-200 px-6 py-5 flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowEventDialog(false)}
              disabled={submitting}
              className="flex-1 lg:flex-none h-12 text-base font-medium border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting || !formData.title || !formData.start_date}
              className="flex-1 lg:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {editingEvent ? 'Updating Event...' : 'Creating Event...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Sheet for Date Events List */}
      <AnimatePresence>
        {showMobileDateEvents && selectedDate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDateEvents(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            
            {/* Bottom Sheet - Events List */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setShowMobileDateEvents(false)
                }
              }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 lg:hidden max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3 flex-shrink-0">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>

              <div className="px-6 pb-6 overflow-y-auto flex-1">
                {/* Date Header */}
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedDate.toLocaleDateString('default', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {getEventsForDate(selectedDate).length} {getEventsForDate(selectedDate).length === 1 ? 'event' : 'events'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileDateEvents(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Events List */}
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event) => {
                    const eventType = eventTypes.find(t => t.value === event.event_type)
                    return (
                      <motion.div
                        key={event.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowMobileDateEvents(false)
                          setTimeout(() => openMobileSheet(event), 300)
                        }}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 active:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div
                              className="inline-block px-2 py-0.5 rounded text-white text-xs font-medium mb-2"
                              style={{
                                backgroundColor: eventType?.color === 'red' ? '#ef4444' :
                                                eventType?.color === 'blue' ? '#3b82f6' :
                                                eventType?.color === 'green' ? '#22c55e' :
                                                eventType?.color === 'purple' ? '#a855f7' :
                                                eventType?.color === 'orange' ? '#f97316' :
                                                eventType?.color === 'cyan' ? '#06b6d4' :
                                                eventType?.color === 'yellow' ? '#eab308' :
                                                eventType?.color === 'pink' ? '#ec4899' : '#a855f7'
                              }}
                            >
                              {eventType?.label}
                            </div>
                            <h3 className="font-semibold text-slate-900">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                        </div>
                        
                        {/* Event Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                          {event.subject && (
                            <span className="flex items-center">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {event.subject}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </span>
                          )}
                          {event.priority !== 'normal' && (
                            <span className="flex items-center text-orange-600 font-medium">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {event.priority}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet for Single Event Details */}
      <AnimatePresence>
        {showMobileSheet && sheetEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileSheet}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            
            {/* Bottom Sheet - Enterprise Design */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  closeMobileSheet()
                }
              }}
              className="fixed bottom-0 left-0 right-0 bg-slate-50 rounded-t-3xl shadow-2xl z-50 lg:hidden max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3 bg-white border-b border-slate-200">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>

              {/* Header - Gradient */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 px-5 py-4 border-b-2 border-purple-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div
                      className="inline-block px-3 py-1 rounded-full text-white text-xs font-bold mb-2 shadow-sm"
                      style={{
                        backgroundColor: eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'red' ? '#dc2626' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'blue' ? '#2563eb' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'green' ? '#16a34a' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'purple' ? '#9333ea' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'orange' ? '#ea580c' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'cyan' ? '#0891b2' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'yellow' ? '#ca8a04' :
                                        eventTypes.find(t => t.value === sheetEvent.event_type)?.color === 'pink' ? '#db2777' : '#9333ea'
                      }}
                    >
                      {eventTypes.find(t => t.value === sheetEvent.event_type)?.label}
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {sheetEvent.title}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMobileSheet}
                    className="h-8 w-8 p-0 hover:bg-white/20 text-white flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Description Card */}
                {sheetEvent.description && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-600 rounded-full" />
                      Description
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {sheetEvent.description}
                    </p>
                  </div>
                )}

                {/* Event Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    Event Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(sheetEvent.start_date).toLocaleDateString('default', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {sheetEvent.location && (
                      <div className="flex items-center text-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Location</p>
                          <p className="text-sm font-medium text-slate-700">{sheetEvent.location}</p>
                        </div>
                      </div>
                    )}

                    {sheetEvent.subject && (
                      <div className="flex items-center text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Subject</p>
                          <p className="text-sm font-medium text-slate-700">{sheetEvent.subject}</p>
                        </div>
                      </div>
                    )}

                    {sheetEvent.priority !== 'normal' && (
                      <div className="flex items-center text-sm">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Priority</p>
                          <p className="text-sm font-semibold text-orange-700 capitalize">
                            {sheetEvent.priority} Priority
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer - Action Buttons */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-200 px-4 py-4 flex gap-3">
                <Button
                  onClick={() => {
                    closeMobileSheet()
                    openEditDialog(sheetEvent)
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-11 font-semibold shadow-lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      handleDelete(sheetEvent.id)
                      closeMobileSheet()
                    }
                  }}
                  className="h-11 w-11 p-0 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
