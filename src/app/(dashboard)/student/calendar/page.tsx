'use client'

/**
 * Student Calendar & Attendance - Optimized Intelligence Flow
 * Professional, compact design for quick event discovery
 */

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  BookOpen, Trophy, AlertCircle, CheckCircle, XCircle, CalendarDays,
  TrendingUp, ArrowLeft, Search, Filter, Sparkles, Zap, Target,
  Award, MapPin, Link as LinkIcon, ChevronDown, Bell
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/redux/hooks'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'exam' | 'assignment' | 'holiday' | 'event' | 'deadline' | 'meeting' | 'sports' | 'cultural'
  description?: string
  subject?: string
}

interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
}

const eventTypeConfig = {
  exam: { color: 'from-red-500 to-pink-500', icon: BookOpen, label: 'Exam', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  assignment: { color: 'from-blue-500 to-cyan-500', icon: BookOpen, label: 'Assignment', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  holiday: { color: 'from-green-500 to-emerald-500', icon: Trophy, label: 'Holiday', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  event: { color: 'from-purple-500 to-indigo-500', icon: CalendarIcon, label: 'Event', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  deadline: { color: 'from-orange-500 to-amber-500', icon: Clock, label: 'Deadline', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  meeting: { color: 'from-cyan-500 to-teal-500', icon: CalendarDays, label: 'Meeting', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  sports: { color: 'from-yellow-500 to-orange-500', icon: Trophy, label: 'Sports', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  cultural: { color: 'from-pink-500 to-rose-500', icon: Sparkles, label: 'Cultural', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' }
}

export default function StudentCalendarPage() {
  const router = useRouter()
  const { profile } = useAppSelector((state) => state.auth)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return
      
      try {
        setLoading(true)
        
        const [eventsRes, attendanceRes] = await Promise.all([
          fetch('/api/student/calendar-events'),
          fetch('/api/student/attendance-history')
        ])
        
        if (eventsRes.ok) {
          const result = await eventsRes.json()
          setEvents(result.data?.events || [])
        }
        
        if (attendanceRes.ok) {
          const result = await attendanceRes.json()
          setAttendance(result.data?.attendance || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile])

  // Calculate attendance stats
  const attendanceStats = useMemo(() => {
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const rate = total > 0 ? Math.round((present / total) * 100) : 100
    return { total, present, rate }
  }, [attendance])

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.subject?.toLowerCase().includes(query)
      )
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(e => selectedTypes.includes(e.type))
    }

    return filtered
  }, [events, searchQuery, selectedTypes])

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return filteredEvents
      .filter(e => {
        const eventDate = new Date(e.date)
        return eventDate >= today && eventDate <= nextWeek
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [filteredEvents])

  // Get events by priority
  const priorityEvents = useMemo(() => {
    return filteredEvents
      .filter(e => e.type === 'exam' || e.type === 'deadline')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
  }, [filteredEvents])

  const toggleFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const today = new Date()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen px-3 py-4 md:p-6" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 30%, white), color-mix(in srgb, var(--theme-tertiary) 20%, white))' }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6"
      >
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/student')}
            className="hover:bg-white/50 h-9 px-3"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="text-sm">Dashboard</span>
          </Button>
        </div>

        {/* Intelligent Header Card */}
        <Card className="border-0 shadow-xl md:shadow-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}>
          <CardContent className="p-3 md:p-6 relative z-10">
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-1 flex items-center space-x-1.5 md:space-x-2">
                  <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white flex-shrink-0" />
                  <span className="text-white">My Schedule</span>
                </h1>
                <p className="text-white text-xs md:text-base font-medium opacity-90">Your academic journey</p>
              </div>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 backdrop-blur-md rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/30 flex-shrink-0 ml-2"
              >
                <div className="text-xl md:text-3xl font-bold text-white leading-none">{attendanceStats.rate}%</div>
                <div className="text-[10px] md:text-xs text-white font-medium mt-0.5">Attendance</div>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <motion.div whileTap={{ scale: 0.98 }} className="bg-white/15 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-white/30 active:bg-white/20">
                <div className="flex items-center space-x-1.5 md:space-x-2">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white/20">
                    <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-white leading-none">{events.length}</div>
                    <div className="text-[10px] md:text-xs text-white font-medium mt-0.5">Total Events</div>
                  </div>
                </div>
              </motion.div>

              <motion.div whileTap={{ scale: 0.98 }} className="bg-white/15 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-white/30 active:bg-white/20">
                <div className="flex items-center space-x-1.5 md:space-x-2">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white/20">
                    <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-white leading-none">{upcomingEvents.length}</div>
                    <div className="text-[10px] md:text-xs text-white font-medium mt-0.5">This Week</div>
                  </div>
                </div>
              </motion.div>

              <motion.div whileTap={{ scale: 0.98 }} className="bg-white/15 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-white/30 active:bg-white/20">
                <div className="flex items-center space-x-1.5 md:space-x-2">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white/20">
                    <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-white leading-none">{priorityEvents.length}</div>
                    <div className="text-[10px] md:text-xs text-white font-medium mt-0.5">Priority</div>
                  </div>
                </div>
              </motion.div>

              <motion.div whileTap={{ scale: 0.98 }} className="bg-white/15 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-white/30 active:bg-white/20">
                <div className="flex items-center space-x-1.5 md:space-x-2">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white/20">
                    <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-white leading-none">{attendanceStats.present}</div>
                    <div className="text-[10px] md:text-xs text-white font-medium mt-0.5">Days Present</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 md:mb-6"
      >
        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden">
          <CardContent className="p-3 md:p-4" style={{ background: 'linear-gradient(to bottom, white, color-mix(in srgb, var(--theme-highlight) 5%, transparent))' }}>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-9 md:h-10 text-sm"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center space-x-2 h-9 md:h-10 text-sm"
                size="sm"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <Badge variant="secondary" className="ml-1.5 md:ml-2 h-5 min-w-[20px] px-1.5 text-xs">{selectedTypes.length}</Badge>
              </Button>
            </div>

            {/* Filter Chips */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {Object.entries(eventTypeConfig).map(([type, config]) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFilter(type)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedTypes.includes(type)
                          ? "text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                      style={selectedTypes.includes(type) ? {
                        background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))'
                      } : {}}
                    >
                      {config.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content - Upcoming Events Timeline */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Priority Events - Highlighted */}
          {priorityEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden" style={{ borderLeft: '3px solid var(--theme-accent)' }}>
                <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-accent) 10%, transparent), transparent)' }}>
                  <CardTitle className="text-base md:text-xl font-bold flex items-center space-x-2 md:space-x-3" style={{ color: 'var(--theme-primary)' }}>
                    <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-md md:shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--theme-accent), var(--theme-secondary))' }}>
                      <Target className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-sm md:text-xl">Priority Events</span>
                    <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold text-white shadow-sm md:shadow-md" style={{ backgroundColor: 'var(--theme-accent)' }}>Urgent</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 md:space-y-3 pt-3 md:pt-4 px-3 md:px-6 pb-3 md:pb-6">
                  {priorityEvents.map((event, index) => {
                    const config = eventTypeConfig[event.type]
                    const Icon = config.icon
                    const daysUntil = Math.ceil((new Date(event.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md md:shadow-lg border-l-3 md:border-l-4 cursor-pointer active:shadow-lg transition-shadow"
                        style={{ borderLeftColor: 'var(--theme-accent)' }}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-0">
                          <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
                            <div className={cn("p-1.5 md:p-2 rounded-lg flex-shrink-0", config.bg)}>
                              <Icon className={cn("w-4 h-4 md:w-5 md:h-5", config.text)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-1">{event.title}</h3>
                              {event.subject && (
                                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">{event.subject}</p>
                              )}
                              {event.description && (
                                <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 md:mt-1 line-clamp-1 md:line-clamp-2">{event.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold text-white" style={{ backgroundColor: 'var(--theme-accent)' }}>
                              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                            </span>
                            <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">
                              {new Date(event.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upcoming Events Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden">
              <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-primary) 12%, transparent), color-mix(in srgb, var(--theme-secondary) 8%, transparent))' }}>
                <CardTitle className="text-base md:text-xl font-bold flex items-center space-x-2 md:space-x-3" style={{ color: 'var(--theme-primary)' }}>
                  <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-md md:shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }}>
                    <CalendarDays className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="text-sm md:text-xl">Upcoming This Week</span>
                  <Badge variant="outline" className="ml-auto font-semibold text-[10px] md:text-xs px-1.5 md:px-2 h-5 md:h-6">{upcomingEvents.length} events</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, index) => {
                    const config = eventTypeConfig[event.type]
                    const Icon = config.icon
                    const eventDate = new Date(event.date)
                    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-3 md:p-4 rounded-lg md:rounded-xl shadow-md md:shadow-lg cursor-pointer border-2 active:shadow-lg transition-all",
                          config.bg, config.border
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={cn("p-3 rounded-xl bg-white shadow-sm")}>
                              <Icon className={cn("w-6 h-6", config.text)} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={cn("text-xs", config.text, config.bg)}>{config.label}</Badge>
                                {event.subject && (
                                  <Badge variant="outline" className="text-xs">{event.subject}</Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-gray-900">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>
                              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {eventDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <CalendarDays className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3" style={{ color: 'var(--theme-tertiary)', opacity: 0.5 }} />
                    <p className="text-xs md:text-sm font-medium text-gray-700">No upcoming events this week</p>
                    <p className="text-[11px] md:text-xs mt-0.5 md:mt-1 text-gray-600">Enjoy your free time!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* All Events List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden">
              <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-secondary) 12%, transparent), color-mix(in srgb, var(--theme-tertiary) 8%, transparent))' }}>
                <CardTitle className="text-base md:text-xl font-bold flex items-center space-x-2 md:space-x-3" style={{ color: 'var(--theme-primary)' }}>
                  <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-md md:shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--theme-secondary), var(--theme-tertiary))' }}>
                    <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="text-sm md:text-xl">All Events</span>
                  <Badge variant="outline" className="ml-auto font-semibold text-[10px] md:text-xs px-1.5 md:px-2 h-5 md:h-6">{filteredEvents.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-4 px-3 md:px-6 pb-3 md:pb-6">
                <div className="space-y-1.5 md:space-y-2 max-h-[400px] md:max-h-[600px] overflow-y-auto pr-1 md:pr-2">
                  {filteredEvents
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => {
                      const config = eventTypeConfig[event.type]
                      const Icon = config.icon
                      
                      return (
                        <motion.div
                          key={event.id}
                          whileTap={{ scale: 0.98 }}
                          className="p-2.5 md:p-3 rounded-lg active:bg-gray-50 transition-all cursor-pointer border border-gray-200 active:border-gray-300 active:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                              <Icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0", config.text)} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs md:text-sm text-gray-900 truncate">{event.title}</div>
                                {event.subject && (
                                  <div className="text-[11px] md:text-xs text-gray-500 truncate">{event.subject}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                              <Badge className={cn("text-[10px] md:text-xs px-1.5 md:px-2 h-5 md:h-auto", config.bg, config.text)}>{config.label}</Badge>
                              <div className="text-[11px] md:text-xs text-gray-600 whitespace-nowrap">
                                {new Date(event.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar - Compact Calendar & Attendance */}
        <div className="space-y-4 md:space-y-6">
          {/* Mini Calendar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg md:shadow-xl lg:sticky lg:top-6 overflow-hidden">
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 25%, transparent), color-mix(in srgb, var(--theme-tertiary) 15%, transparent))' }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>{monthName}</CardTitle>
                  <div className="flex space-x-0.5 md:space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                      className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-white/50"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                      className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-white/50"
                    >
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 md:px-6 pb-3 md:pb-6">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-gray-600 py-0.5 md:py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                  {(() => {
                    const year = currentDate.getFullYear()
                    const month = currentDate.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const daysInMonth = lastDay.getDate()
                    const startingDayOfWeek = firstDay.getDay()
                    
                    const days: JSX.Element[] = []
                    
                    // Empty cells before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="aspect-square" />
                      )
                    }
                    
                    // Actual days
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day)
                      const isToday = date.toDateString() === new Date().toDateString()
                      const hasEvents = events.some(event => {
                        const eventDate = new Date(event.date)
                        return eventDate.toDateString() === date.toDateString()
                      })
                      
                      days.push(
                        <motion.div
                          key={day}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "aspect-square flex items-center justify-center text-[11px] md:text-xs rounded-md md:rounded-lg cursor-pointer transition-all relative",
                            isToday
                              ? "font-bold text-white shadow-sm md:shadow-md"
                              : hasEvents
                              ? "font-semibold active:shadow-sm"
                              : "text-gray-700 active:bg-gray-100"
                          )}
                          style={isToday ? {
                            background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))'
                          } : hasEvents ? {
                            backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 60%, transparent)',
                            color: 'var(--theme-primary)'
                          } : {}}
                        >
                          {day}
                          {hasEvents && !isToday && (
                            <div 
                              className="absolute bottom-0.5 w-1 h-1 rounded-full" 
                              style={{ backgroundColor: 'var(--theme-accent)' }}
                            />
                          )}
                        </motion.div>
                      )
                    }
                    
                    return days
                  })()}
                </div>
                
                {/* Legend */}
                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t flex items-center justify-center gap-2 md:gap-3 text-[11px] md:text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }} />
                    <span className="text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: 'var(--theme-accent)' }} />
                    <span className="text-gray-600">Event</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Attendance Calendar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden">
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 25%, transparent), color-mix(in srgb, var(--theme-tertiary) 15%, transparent))' }}>
                <CardTitle className="text-base md:text-lg font-bold flex items-center justify-between" style={{ color: 'var(--theme-primary)' }}>
                  <div className="flex items-center space-x-1.5 md:space-x-2">
                    <div className="p-1.5 md:p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(to bottom right, var(--theme-secondary), var(--theme-accent))' }}>
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <span className="text-sm md:text-lg">Attendance</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>{attendanceStats.rate}%</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 md:px-6 pb-3 md:pb-6">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-gray-600 py-0.5 md:py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days with attendance */}
                <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                  {(() => {
                    const year = currentDate.getFullYear()
                    const month = currentDate.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const daysInMonth = lastDay.getDate()
                    const startingDayOfWeek = firstDay.getDay()
                    
                    const days: JSX.Element[] = []
                    
                    // Empty cells before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="aspect-square" />
                      )
                    }
                    
                    // Actual days with attendance status
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day)
                      const dateStr = date.toISOString().split('T')[0]
                      const isToday = date.toDateString() === new Date().toDateString()
                      const isFuture = date > new Date()
                      
                      // Find attendance for this day
                      const attendanceRecord = attendance.find(a => {
                        const recordDate = new Date(a.date)
                        return recordDate.toDateString() === date.toDateString()
                      })
                      
                      const status = attendanceRecord?.status
                      
                      // Color coding based on status
                      const getStatusStyle = () => {
                        if (isFuture) return { bg: 'bg-gray-50', text: 'text-gray-400', border: '' }
                        if (!status) return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border border-gray-200' }
                        
                        switch (status) {
                          case 'present':
                            return { bg: 'bg-green-100', text: 'text-green-700', border: 'border border-green-300' }
                          case 'absent':
                            return { bg: 'bg-red-100', text: 'text-red-700', border: 'border border-red-300' }
                          case 'late':
                            return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border border-amber-300' }
                          case 'excused':
                            return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border border-blue-300' }
                          default:
                            return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border border-gray-200' }
                        }
                      }
                      
                      const statusStyle = getStatusStyle()
                      
                      days.push(
                        <motion.div
                          key={day}
                          whileTap={{ scale: isFuture ? 1 : 0.95 }}
                          className={cn(
                            "aspect-square flex items-center justify-center text-[11px] md:text-xs rounded-md md:rounded-lg cursor-pointer transition-all relative",
                            statusStyle.bg,
                            statusStyle.text,
                            statusStyle.border,
                            isToday && "ring-2 ring-offset-0.5 md:ring-offset-1",
                            isFuture && "opacity-50 cursor-default"
                          )}
                          style={isToday ? {
                            borderColor: 'var(--theme-primary)',
                            borderWidth: '2px'
                          } : {}}
                          title={status ? `${status.charAt(0).toUpperCase() + status.slice(1)}` : isFuture ? 'Future date' : 'No record'}
                        >
                          <span className={cn("font-medium", isToday && "font-bold")}>{day}</span>
                        </motion.div>
                      )
                    }
                    
                    return days
                  })()}
                </div>
                
                {/* Legend */}
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t space-y-1.5">
                  <div className="text-[11px] md:text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Legend:</div>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[11px] md:text-xs">
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-green-100 border border-green-300" />
                      <span className="text-gray-600">Present</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-red-100 border border-red-300" />
                      <span className="text-gray-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-amber-100 border border-amber-300" />
                      <span className="text-gray-600">Late</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-blue-100 border border-blue-300" />
                      <span className="text-gray-600">Excused</span>
                    </div>
                  </div>
                  
                  {/* Stats Summary */}
                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t grid grid-cols-2 gap-2 md:gap-3 text-center">
                    <div>
                      <div className="text-lg md:text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>{attendanceStats.present}</div>
                      <div className="text-[10px] font-medium text-gray-600">Present</div>
                    </div>
                    <div>
                      <div className="text-lg md:text-xl font-bold text-gray-700">{attendanceStats.total - attendanceStats.present}</div>
                      <div className="text-[10px] font-medium text-gray-600">Missed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="pb-3" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-accent) 12%, transparent), color-mix(in srgb, var(--theme-highlight) 10%, transparent))' }}>
                <CardTitle className="text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start hover:shadow-md transition-all" size="sm">
                  <Bell className="w-4 h-4 mr-2" style={{ color: 'var(--theme-accent)' }} />
                  Enable Reminders
                </Button>
                <Button variant="outline" className="w-full justify-start hover:shadow-md transition-all" size="sm">
                  <Award className="w-4 h-4 mr-2" style={{ color: 'var(--theme-secondary)' }} />
                  View Achievements
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
