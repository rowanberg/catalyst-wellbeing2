'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Send, 
  MessageCircle, 
  User, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Timer,
  Shield
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  subject: string
  avatar?: string
  isAvailable: boolean
  officeHours: {
    day: string
    startTime: string
    endTime: string
  }[]
  nextAvailable?: string
}

interface Message {
  id: string
  content: string
  timestamp: string
  sender: 'student' | 'teacher'
  status: 'sent' | 'delivered' | 'read'
  isModerated?: boolean
}

interface Conversation {
  id: string
  teacherId: string
  teacherName: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  status: 'active' | 'ended' | 'pending_approval'
}

export default function OfficeHoursMessaging() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch available teachers and office hours
  useEffect(() => {
    fetchTeachers()
    fetchConversations()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/student/office-hours/teachers')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data.teachers)
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/student/office-hours/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/student/office-hours/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error)
    }
  }

  const isTeacherAvailable = (teacher: Teacher): boolean => {
    const now = currentTime
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
    const currentTimeStr = now.toTimeString().slice(0, 5)

    return teacher.officeHours.some(hours => {
      if (hours.day !== currentDay) return false
      return currentTimeStr >= hours.startTime && currentTimeStr <= hours.endTime
    })
  }

  const getNextAvailableTime = (teacher: Teacher): string => {
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Find next available office hours
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDay]
      
      const officeHour = teacher.officeHours.find(oh => oh.day === dayName)
      if (officeHour) {
        const nextDate = new Date(now)
        nextDate.setDate(now.getDate() + i)
        
        if (i === 0) {
          // Today - check if office hours haven't ended yet
          const currentTimeStr = now.toTimeString().slice(0, 5)
          if (currentTimeStr < officeHour.endTime) {
            return `Today at ${officeHour.startTime}`
          }
        } else {
          return `${dayName} at ${officeHour.startTime}`
        }
      }
    }
    
    return 'No office hours scheduled'
  }

  const startConversation = async (teacherId: string) => {
    try {
      const response = await fetch('/api/student/office-hours/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversationId)
        fetchConversations()
        fetchMessages(data.conversationId)
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/student/office-hours/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation)
        fetchConversations()
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Office Hours Messaging</h1>
        <p className="text-gray-600">Connect with your teachers during their designated office hours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Available Teachers
            </h2>
            
            <div className="space-y-3">
              {teachers.map((teacher) => {
                const available = isTeacherAvailable(teacher)
                return (
                  <motion.div
                    key={teacher.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      available 
                        ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => available && startConversation(teacher.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                        <p className="text-sm text-gray-600">{teacher.subject}</p>
                      </div>
                      <div className="flex items-center">
                        {available ? (
                          <div className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs font-medium">Available</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-xs">Offline</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!available && (
                      <div className="mt-2 text-xs text-gray-500">
                        Next available: {getNextAvailableTime(teacher)}
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Office Hours:</h4>
                      <div className="space-y-1">
                        {teacher.officeHours.map((hours: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {hours.day}: {hours.startTime} - {hours.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Active Conversations */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              Your Conversations
            </h2>
            
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedConversation === conversation.id
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setSelectedConversation(conversation.id)
                    fetchMessages(conversation.id)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{conversation.teacherName}</h3>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {conversation.lastMessageTime}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      conversation.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : conversation.status === 'pending_approval'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {conversation.status.replace('_', ' ')}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a conversation with an available teacher</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {conversations.find(c => c.id === selectedConversation)?.teacherName}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="h-4 w-4 mr-1" />
                      Moderated conversation • Office hours only
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <Timer className="h-4 w-4 mr-1" />
                    Active session
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'student'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          {message.sender === 'student' && (
                            <div className="flex items-center ml-2">
                              {message.status === 'read' && <CheckCircle className="h-3 w-3" />}
                              {message.isModerated && (
                                <Shield className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start your conversation</p>
                    <p className="text-xs">All messages are moderated for safety</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message... (Press Enter to send)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                      {newMessage.length}/500
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Messages are monitored for safety. Be respectful and appropriate.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a teacher to start messaging during office hours</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
