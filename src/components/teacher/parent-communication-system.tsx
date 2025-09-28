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
  Settings
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Parent Communication</h1>
                <p className="text-lg text-gray-600">Connect with parents through secure messaging and announcements</p>
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create {activeTab === 'messages' ? 'Message' : activeTab === 'announcements' ? 'Announcement' : 'Meeting Slot'}
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-3 mb-8">
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
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Content */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
                <p className="text-sm">Start communicating with parents by sending your first message</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{message.subject}</h3>
                        <Badge className={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                        {!message.is_read && (
                          <Badge variant="destructive">Unread</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {message.parent.full_name}
                        </span>
                        <span>Student: {message.student.full_name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{message.message}</p>
                      {message.reply_count > 0 && (
                        <p className="text-sm text-blue-600">{message.reply_count} replies</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Reply
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Create {activeTab === 'messages' ? 'Message' : activeTab === 'announcements' ? 'Announcement' : 'Meeting Slot'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

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

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={activeTab === 'messages' ? sendMessage : activeTab === 'announcements' ? createAnnouncement : createMeetingSlot}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {activeTab === 'messages' ? 'Send Message' : activeTab === 'announcements' ? 'Create Announcement' : 'Create Slot'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
