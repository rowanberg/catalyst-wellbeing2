'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Users,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
  Eye,
  Plus,
  X,
  User,
  Bell,
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Parent {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  children: {
    id: string
    first_name: string
    last_name: string
    grade_level: string
  }[]
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  subject: string
  content: string
  message_type: 'direct' | 'announcement' | 'urgent'
  priority: 'low' | 'medium' | 'high'
  read_status: boolean
  created_at: string
  sender_name: string
  receiver_name: string
}

interface ParentCommunicationHubProps {
  teacherId: string
  schoolId: string
}

export const ParentCommunicationHub = ({ teacherId, schoolId }: ParentCommunicationHubProps) => {
  const [parents, setParents] = useState<Parent[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'announcements'>('inbox')

  // Compose form state
  const [composeData, setComposeData] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    message_type: 'direct' as 'direct' | 'announcement' | 'urgent',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  const fetchParents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/teacher/parents?school_id=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setParents(data.parents || [])
      }
    } catch (error: any) {
      console.error('Error fetching parents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/teacher/messages?teacher_id=${teacherId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error)
    }
  }

  useEffect(() => {
    fetchParents()
    fetchMessages()
  }, [teacherId, schoolId])

  const handleSendMessage = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teacher/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...composeData,
          sender_id: teacherId
        })
      })

      if (response.ok) {
        setIsComposeOpen(false)
        setComposeData({
          recipient_id: '',
          subject: '',
          content: '',
          message_type: 'direct',
          priority: 'medium'
        })
        await fetchMessages()
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredParents = parents.filter(parent => {
    const matchesSearch = parent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parent.children.some(child => 
                           child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           child.last_name.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    return matchesSearch
  })

  const filteredMessages = messages.filter(message => {
    if (filterType === 'all') return true
    return message.message_type === filterType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Communication</h2>
          <p className="text-gray-600">Secure messaging with parents and guardians</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Shield className="w-3 h-3 mr-1" />
            End-to-End Encrypted
          </Badge>
          <Button 
            onClick={() => setIsComposeOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Inbox ({messages.filter(m => !m.read_status).length})
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="direct">Direct Messages</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="announcement">Announcements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages found</p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <ComposeMessage
            parents={filteredParents}
            composeData={composeData}
            setComposeData={setComposeData}
            onSend={handleSendMessage}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <AnnouncementCenter
            parents={parents}
            teacherId={teacherId}
            onAnnouncementSent={fetchMessages}
          />
        </TabsContent>
      </Tabs>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <ComposeModal
            isOpen={isComposeOpen}
            onClose={() => setIsComposeOpen(false)}
            parents={parents}
            composeData={composeData}
            setComposeData={setComposeData}
            onSend={handleSendMessage}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const MessageCard = ({ message }: { message: Message }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'announcement': return <Bell className="w-4 h-4 text-blue-500" />
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        !message.read_status ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getTypeIcon(message.message_type)}
          <div>
            <h3 className={`font-semibold ${!message.read_status ? 'text-blue-900' : 'text-gray-900'}`}>
              {message.subject}
            </h3>
            <p className="text-sm text-gray-600">
              From: {message.sender_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(message.priority)}>
            {message.priority}
          </Badge>
          {!message.read_status && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
        {message.content}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(message.created_at).toLocaleString()}
        </div>
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Encrypted
        </div>
      </div>
    </motion.div>
  )
}

const ComposeMessage = ({ parents, composeData, setComposeData, onSend, isLoading }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Compose Message
        </CardTitle>
        <CardDescription>
          Send a secure, encrypted message to a parent or guardian
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient *
            </label>
            <Select 
              value={composeData.recipient_id} 
              onValueChange={(value) => setComposeData((prev: any) => ({ ...prev, recipient_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {parents.map((parent: Parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.first_name} {parent.last_name} 
                    {parent.children.length > 0 && (
                      <span className="text-gray-500 ml-2">
                        (Parent of {parent.children.map(c => c.first_name).join(', ')})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <Select 
              value={composeData.priority} 
              onValueChange={(value) => setComposeData((prev: any) => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <Input
            value={composeData.subject}
            onChange={(e) => setComposeData((prev: any) => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter message subject"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <Textarea
            value={composeData.content}
            onChange={(e) => setComposeData((prev: any) => ({ ...prev, content: e.target.value }))}
            placeholder="Type your message here..."
            rows={6}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" disabled={isLoading}>
            Save Draft
          </Button>
          <Button 
            onClick={onSend}
            disabled={isLoading || !composeData.recipient_id || !composeData.subject || !composeData.content}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const AnnouncementCenter = ({ parents, teacherId, onAnnouncementSent }: any) => {
  const [announcementData, setAnnouncementData] = useState({
    subject: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    recipients: 'all' as 'all' | 'selected'
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSendAnnouncement = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teacher/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcementData,
          sender_id: teacherId,
          recipient_ids: announcementData.recipients === 'all' 
            ? parents.map((p: Parent) => p.id) 
            : []
        })
      })

      if (response.ok) {
        setAnnouncementData({
          subject: '',
          content: '',
          priority: 'medium',
          recipients: 'all'
        })
        onAnnouncementSent()
      }
    } catch (error: any) {
      console.error('Error sending announcement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Class Announcements
        </CardTitle>
        <CardDescription>
          Send announcements to all parents in your class
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients
            </label>
            <Select 
              value={announcementData.recipients} 
              onValueChange={(value) => setAnnouncementData(prev => ({ ...prev, recipients: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parents ({parents.length})</SelectItem>
                <SelectItem value="selected">Selected Parents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <Select 
              value={announcementData.priority} 
              onValueChange={(value) => setAnnouncementData(prev => ({ ...prev, priority: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <Input
            value={announcementData.subject}
            onChange={(e) => setAnnouncementData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Announcement subject"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Announcement *
          </label>
          <Textarea
            value={announcementData.content}
            onChange={(e) => setAnnouncementData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Type your announcement here..."
            rows={6}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" disabled={isLoading}>
            Preview
          </Button>
          <Button 
            onClick={handleSendAnnouncement}
            disabled={isLoading || !announcementData.subject || !announcementData.content}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Broadcasting...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Send to All Parents
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const ComposeModal = ({ isOpen, onClose, parents, composeData, setComposeData, onSend, isLoading }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">New Message</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ComposeMessage
            parents={parents}
            composeData={composeData}
            setComposeData={setComposeData}
            onSend={onSend}
            isLoading={isLoading}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
