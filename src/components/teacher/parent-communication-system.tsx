'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Megaphone, 
  Calendar, 
  Bell, 
  Send, 
  Plus, 
  Search,
  Filter,
  Clock,
  User,
  Mail,
  Phone,
  Video,
  MapPin,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  subject: string
  message: string
  sender_type: 'teacher' | 'parent'
  is_read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  parent: {
    id: string
    full_name: string
    email: string
  }
  student: {
    id: string
    full_name: string
  }
  reply_count: number
}

interface Announcement {
  id: string
  title: string
  content: string
  announcement_type: 'general' | 'homework' | 'event' | 'reminder' | 'urgent'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  is_published: boolean
  read_count: number
  total_parents: number
}

interface MeetingSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  meeting_type: string
  location?: string
  virtual_meeting_link?: string
  is_available: boolean
  booking?: {
    id: string
    subject: string
    status: string
    parent: { full_name: string }
    student: { full_name: string }
  }
}

export default function ParentCommunicationSystem() {
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements' | 'meetings' | 'notifications'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('')

  // Form states
  const [messageForm, setMessageForm] = useState({
    parent_id: '',
    student_id: '',
    subject: '',
    message: '',
    priority: 'normal'
  })

  const [announcementForm, setAnnouncementForm] = useState({
    class_id: '',
    title: '',
    content: '',
    announcement_type: 'general',
    priority: 'normal',
    scheduled_for: '',
    expires_at: ''
  })

  const [meetingForm, setMeetingForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    meeting_type: 'conference',
    location: '',
    virtual_meeting_link: '',
    notes: '',
    recurring: false,
    recurring_weeks: 1
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'messages':
          await fetchMessages()
          break
        case 'announcements':
          await fetchAnnouncements()
          break
        case 'meetings':
          await fetchMeetingSlots()
          break
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    const response = await fetch('/api/teacher/parent-communication/messages')
    if (response.ok) {
      const data = await response.json()
      setMessages(data.messages)
    }
  }

  const fetchAnnouncements = async () => {
    const response = await fetch('/api/teacher/parent-communication/announcements')
    if (response.ok) {
      const data = await response.json()
      setAnnouncements(data.announcements)
    }
  }

  const fetchMeetingSlots = async () => {
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const response = await fetch(`/api/teacher/parent-communication/meetings?type=slots&start_date=${startDate}&end_date=${endDate}`)
    if (response.ok) {
      const data = await response.json()
      setMeetingSlots(data.slots)
    }
  }

  const sendMessage = async () => {
    try {
      const response = await fetch('/api/teacher/parent-communication/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageForm)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setMessageForm({ parent_id: '', student_id: '', subject: '', message: '', priority: 'normal' })
        fetchMessages()
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
    }
  }

  const createAnnouncement = async () => {
    try {
      const response = await fetch('/api/teacher/parent-communication/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setAnnouncementForm({
          class_id: '',
          title: '',
          content: '',
          announcement_type: 'general',
          priority: 'normal',
          scheduled_for: '',
          expires_at: ''
        })
        fetchAnnouncements()
      }
    } catch (error: any) {
      console.error('Error creating announcement:', error)
    }
  }

  const createMeetingSlot = async () => {
    try {
      const response = await fetch('/api/teacher/parent-communication/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingForm)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setMeetingForm({
          date: '',
          start_time: '',
          end_time: '',
          meeting_type: 'conference',
          location: '',
          virtual_meeting_link: '',
          notes: '',
          recurring: false,
          recurring_weeks: 1
        })
        fetchMeetingSlots()
      }
    } catch (error: any) {
      console.error('Error creating meeting slot:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-700'
      case 'event': return 'bg-purple-100 text-purple-700'
      case 'homework': return 'bg-blue-100 text-blue-700'
      case 'reminder': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = !filterPriority || message.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = !filterPriority || announcement.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Loading Parent Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sticky Header - Mobile Optimized */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Header Title - Compact on mobile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl text-white">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>Parent Hub</h1>
                <p className="hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Secure family communication</p>
              </div>
            </div>
            
            {/* Create Button - Icon only on mobile */}
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">New {activeTab === 'messages' ? 'Message' : activeTab === 'announcements' ? 'Announcement' : 'Slot'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Mobile Optimized with Horizontal Scroll */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex overflow-x-auto gap-2 sm:gap-3 scrollbar-hide">
            {[
              { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
              { id: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length },
              { id: 'meetings', label: 'Meetings', icon: Calendar, count: meetingSlots.length },
              { id: 'notifications', label: 'Notifications', icon: Bell, count: 0 }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-0.5 text-xs px-1.5 py-0.5">
                      {tab.count}
                    </Badge>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Search and Filter - Mobile Optimized */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3 sm:space-y-0 sm:flex sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Content - Mobile Optimized */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2 dark:text-slate-300" style={{ fontFamily: 'var(--font-jakarta)' }}>No Messages Yet</h3>
                <p className="text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Start communicating with parents by sending your first message</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-200"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-start gap-2">
                      <h3 className="flex-1 font-semibold text-base sm:text-lg text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>{message.subject}</h3>
                      <div className="flex gap-2">
                        <Badge className={`text-xs ${getPriorityColor(message.priority)} dark:border-slate-600`}>
                          {message.priority}
                        </Badge>
                        {!message.is_read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Meta Info - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {message.parent.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {message.student.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Message */}
                    <p className="text-sm sm:text-base text-gray-700 dark:text-slate-300 line-clamp-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>{message.message}</p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                      {message.reply_count > 0 && (
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</p>
                      )}
                      <Button variant="outline" size="sm" className="ml-auto dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Reply</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Announcements Yet</h3>
                <p className="text-sm">Create your first class announcement to keep parents informed</p>
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{announcement.title}</h3>
                        <Badge className={getTypeColor(announcement.announcement_type)}>
                          {announcement.announcement_type}
                        </Badge>
                        <Badge className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {announcement.read_count}/{announcement.total_parents} read
                        </span>
                      </div>
                      <p className="text-gray-700">{announcement.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetingSlots.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Meeting Slots Yet</h3>
                <p className="text-sm">Create meeting slots for parent-teacher conferences</p>
              </div>
            ) : (
              meetingSlots.map((slot) => (
                <motion.div
                  key={slot.id}
                  className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {new Date(slot.date).toLocaleDateString()}
                      </h3>
                      <Badge className={slot.booking ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                        {slot.booking ? 'Booked' : 'Available'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {slot.start_time} - {slot.end_time}
                      </p>
                      <p className="capitalize">{slot.meeting_type}</p>
                      {slot.location && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {slot.location}
                        </p>
                      )}
                      {slot.virtual_meeting_link && (
                        <p className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          Virtual Meeting
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {slot.booking && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="font-medium text-sm">{slot.booking.subject}</p>
                      <p className="text-sm text-gray-600">
                        {slot.booking.parent.full_name} - {slot.booking.student.full_name}
                      </p>
                      <Badge className="mt-1" variant="outline">
                        {slot.booking.status}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {!slot.booking && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="text-center py-12 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Automated Notifications</h3>
            <p className="text-sm mb-6">Set up automatic notifications for attendance, grades, and behavior</p>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure Notifications
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal - Mobile Optimized */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Sticky on mobile */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                    Create {activeTab === 'messages' ? 'Message' : activeTab === 'announcements' ? 'Announcement' : 'Meeting Slot'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-4 sm:px-6 py-4">

              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                      <select
                        value={messageForm.parent_id}
                        onChange={(e) => setMessageForm({ ...messageForm, parent_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Parent</option>
                        {/* Add parent options */}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                      <select
                        value={messageForm.student_id}
                        onChange={(e) => setMessageForm({ ...messageForm, student_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Student</option>
                        {/* Add student options */}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <Input
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                      placeholder="Message subject..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <Textarea
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      rows={4}
                      placeholder="Type your message..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={messageForm.priority}
                      onChange={(e) => setMessageForm({ ...messageForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={activeTab === 'messages' ? sendMessage : activeTab === 'announcements' ? createAnnouncement : createMeetingSlot}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 order-1 sm:order-2"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {activeTab === 'messages' ? 'Send Message' : activeTab === 'announcements' ? 'Create Announcement' : 'Create Slot'}
                </Button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
