'use client'

/**
 * Admin Academic Schedule Management
 * Comprehensive calendar and event management for schools
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Bell, Link as LinkIcon, Paperclip, ArrowLeft, RefreshCw
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

  useEffect(() => {
    if (profile?.school_id) {
      fetchEvents()
    }
  }, [profile])

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

  // Get calendar days
  const getCalendarDays = (): (Date | null)[] => {
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
  }

  // Get events for date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString()
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
      
      // Check if date falls within event range
      const eventStartString = eventStart.toDateString()
      const eventEndString = eventEnd.toDateString()
      
      return dateString === eventStartString || 
             dateString === eventEndString ||
             (eventStart <= date && date <= eventEnd)
    })
  }

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

  const calendarDays = getCalendarDays()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by type" />
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
          <div className="flex border rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                viewMode === 'month' ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                viewMode === 'list' ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              List
            </button>
          </div>
        </div>
      </motion.div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{monthName}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPreviousMonth}
                      className="text-white hover:bg-white/20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="text-white hover:bg-white/20"
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNextMonth}
                      className="text-white hover:bg-white/20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Days of week */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "aspect-square p-2 rounded-xl border-2 transition-all relative min-h-[80px]",
                          isToday && "border-purple-500 bg-purple-50",
                          isSelected && "border-purple-600 bg-purple-100",
                          !isToday && !isSelected && "border-slate-200 hover:border-purple-300"
                        )}
                      >
                        <div className="text-sm font-semibold">{date.getDate()}</div>
                        
                        {/* Event indicators */}
                        {dayEvents.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((event, i) => {
                              const eventType = eventTypes.find(t => t.value === event.event_type)
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "text-[10px] px-1 py-0.5 rounded truncate",
                                    `bg-${eventType?.color}-100 text-${eventType?.color}-700`
                                  )}
                                  style={{
                                    backgroundColor: `var(--${eventType?.color}-100)`,
                                    color: `var(--${eventType?.color}-700)`
                                  }}
                                >
                                  {event.title}
                                </div>
                              )
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-[10px] text-slate-500">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Selected Date Events */}
          <div>
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

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Type *</Label>
                <Select 
                  value={formData.event_type}
                  onValueChange={(value: any) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select 
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject (Optional)</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <Label>Location (Optional)</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Auditorium"
                />
              </div>
            </div>

            <div>
              <Label>Meeting Link (Optional)</Label>
              <Input
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.all_day}
                onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
              />
              <Label>All Day Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.send_notification}
                onCheckedChange={(checked) => setFormData({ ...formData, send_notification: checked })}
              />
              <Label>Send Notification</Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEventDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {editingEvent ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span>{editingEvent ? 'Update' : 'Create'} Event</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
