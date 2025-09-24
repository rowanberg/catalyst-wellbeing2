'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Shield, 
  Users, 
  Heart, 
  BookOpen,
  AlertTriangle,
  Search,
  Plus,
  Clock,
  Star,
  HelpCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  Smile,
  Paperclip,
  ArrowLeft
} from 'lucide-react'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { MessageComposer } from '@/components/communications/MessageComposer'
import { MessageThread } from '@/components/communications/MessageThread'

interface Teacher {
  id: string
  name: string
  subject: string
  avatar: string
  isOnline: boolean
  lastSeen?: string
}

interface FamilyMessage {
  id: string
  message_text: string
  sender_id: string
  receiver_id: string
  created_at: string
  is_read: boolean
}

// Simple Family Messages Component - No nested cards
function SimpleFamilyMessages({ conversationId, currentUserId, participantName, refreshTrigger }: {
  conversationId: string
  currentUserId: string
  participantName: string
  refreshTrigger?: number
}) {
  const [messages, setMessages] = useState<FamilyMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRealTimeSync, setIsRealTimeSync] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const previousMessageCount = useRef(0)
  const lastMessageId = useRef<string>('')
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const fetchMessages = async (isRealTime = false) => {
    if (!conversationId) return
    
    try {
      const response = await fetch(`/api/family-messaging?conversation_id=${conversationId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        const newMessages = data.messages || []
        
        // Smart refresh: Only update if there are actually new messages
        const hasNewMessages = newMessages.length > messages.length || 
          (newMessages.length > 0 && newMessages[newMessages.length - 1]?.id !== lastMessageId.current)
        
        if (hasNewMessages) {
          const wasAtBottom = isAtBottom()
          setMessages(newMessages)
          
          // Update tracking variables
          if (newMessages.length > 0) {
            lastMessageId.current = newMessages[newMessages.length - 1].id
          }
          previousMessageCount.current = newMessages.length
          
          // Only show sync indicator for real-time updates when there are new messages
          if (isRealTime) {
            setIsRealTimeSync(true)
            setTimeout(() => setIsRealTimeSync(false), 1200)
          }
          
          // Auto-scroll only if user was at bottom or it's a new conversation
          if (wasAtBottom || !userHasScrolled) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching family messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    setUserHasScrolled(false) // Reset scroll state for new conversations
  }, [conversationId, refreshTrigger])

  // Smart real-time sync - only fetch if conversation is active
  useEffect(() => {
    if (!conversationId) return

    const interval = setInterval(() => {
      fetchMessages(true)
    }, 3000) // Reduced frequency to 3 seconds for better performance

    return () => clearInterval(interval)
  }, [conversationId, messages])

  // Check if user is at bottom of scroll area
  const isAtBottom = () => {
    if (!scrollContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    return scrollHeight - scrollTop - clientHeight < 100 // Increased threshold for mobile
  }

  // Handle scroll events - improved for mobile
  const handleScroll = () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    
    scrollTimeout.current = setTimeout(() => {
      setUserHasScrolled(true)
      setShouldAutoScroll(isAtBottom())
    }, 150) // Debounce scroll events
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-500 text-sm">Loading messages...</span>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-pink-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No messages yet</p>
        <p className="text-gray-400 text-xs mt-1">Start a conversation with {participantName}!</p>
      </div>
    )
  }

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-4 py-4"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* New message indicator - Instagram style */}
      {isRealTimeSync && (
        <div className="flex justify-center mb-4">
          <div className="bg-blue-500 text-white rounded-full px-3 py-1 text-xs font-medium animate-pulse">
            New message
          </div>
        </div>
      )}
      
      <div className="space-y-1">
        {messages.map((message, index) => {
          const isFromCurrentUser = message.sender_id === currentUserId
          const showAvatar = !isFromCurrentUser && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id)
          const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.sender_id !== message.sender_id
          
          return (
            <div
              key={message.id}
              className={`flex items-end space-x-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for received messages */}
              {!isFromCurrentUser && (
                <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                  {showAvatar ? participantName.charAt(0) : ''}
                </div>
              )}
              
              <div className={`max-w-[70%] ${isFromCurrentUser ? 'ml-12' : 'mr-12'}`}>
                {/* Instagram-style message bubble */}
                <div
                  className={`px-4 py-2 text-sm leading-relaxed break-words ${
                    isFromCurrentUser
                      ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                  }`}
                >
                  {message.message_text}
                </div>
                
                {/* Timestamp - Instagram style */}
                {isLastInGroup && (
                  <div className={`text-xs text-gray-500 mt-1 px-1 ${isFromCurrentUser ? 'text-right' : 'text-left'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: 'numeric', 
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      <div ref={messagesEndRef} className="h-4" />
    </div>
  )
}

// Simple Family Message Input - No nested components
function SimpleFamilyMessageInput({ conversationId, participantId, currentUserId, onMessageSent }: {
  conversationId: string
  participantId: string
  currentUserId: string
  onMessageSent?: () => void
}) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/family-messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          participantId,
          messageText: message.trim()
        })
      })

      if (response.ok) {
        setMessage('')
        // Trigger refresh of messages without page reload
        if (onMessageSent) {
          onMessageSent()
        }
      } else {
        console.error('Failed to send message:', response.status)
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex items-end space-x-3">
      <div className="flex-1 relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Message..."
          className="w-full rounded-full border-0 focus:border-blue-500 focus:ring-blue-500 py-3 px-4 pr-12 text-sm bg-gray-50 focus:bg-white transition-colors"
          disabled={isSending}
          style={{ fontSize: '16px' }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
        >
          <Smile className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
      <Button
        onClick={sendMessage}
        disabled={!message.trim() || isSending}
        className="rounded-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 min-h-[44px] min-w-[44px] shadow-none"
        size="sm"
      >
        {isSending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

// Quick Message Button Component
function QuickMessageButton({ message, conversationId, participantId, currentUserId, onMessageSent }: {
  message: string
  conversationId: string
  participantId: string
  currentUserId: string
  onMessageSent?: () => void
}) {
  const [isSending, setIsSending] = useState(false)

  const sendQuickMessage = async () => {
    if (isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/family-messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          participantId,
          messageText: message
        })
      })

      if (response.ok) {
        // Trigger refresh of messages without page reload
        if (onMessageSent) {
          onMessageSent()
        }
      } else {
        console.error('Failed to send quick message:', response.status)
      }
    } catch (error: any) {
      console.error('Error sending quick message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      onClick={sendQuickMessage}
      disabled={isSending}
      variant="outline"
      size="sm"
      className="text-xs px-3 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 disabled:opacity-50 min-h-[32px] whitespace-nowrap"
    >
      {isSending ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
      ) : null}
      <span className="truncate">{message}</span>
    </Button>
  )
}

function StudentIdDisplay() {
  const { profile } = useAppSelector((state) => state.auth)
  const [showId, setShowId] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    if (profile?.id) {
      await navigator.clipboard.writeText(profile.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!profile) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-2 sm:p-3 lg:p-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </motion.div>
              <div>
                <p className="text-xs sm:text-sm text-blue-700 font-semibold">Student ID</p>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {showId ? (
                    <motion.code 
                      className="text-xs sm:text-sm font-mono text-blue-800 bg-blue-100/70 px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {profile.id}
                    </motion.code>
                  ) : (
                    <span className="text-xs sm:text-sm text-blue-700 font-mono">••••••••</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowId(!showId)}
                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100/50 rounded-lg transition-all"
                  >
                    {showId ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                  <AnimatePresence>
                    {showId && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyToClipboard}
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100/50 rounded-lg transition-all"
                        >
                          {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-600/80 mt-2 ml-10 sm:ml-13">
            Share this ID with your parents for registration
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StudentMessagingContent() {
  const { profile, user } = useAppSelector((state) => state.auth)
  const [selectedTab, setSelectedTab] = useState<'teachers' | 'parents'>('teachers')
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [parents, setParents] = useState<any[]>([])
  const [familyConversations, setFamilyConversations] = useState<any[]>([])
  const [isLoadingParents, setIsLoadingParents] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false)
  const [messageRefreshTrigger, setMessageRefreshTrigger] = useState(0)

  // Function to refresh messages without page reload
  const refreshMessages = () => {
    setMessageRefreshTrigger(prev => prev + 1)
  }

  // Function to start a family conversation with a parent
  const startFamilyConversation = async (parentId: string) => {
    try {
      // Create or get existing conversation
      const response = await fetch('/api/family-messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          participantId: parentId,
          participantRole: 'parent'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const parentName = parents.find(parent => parent.id === parentId)?.name || 'Parent'
        
        // Update familyConversations to include this conversation with participant info
        const conversationData = {
          id: data.conversationId,
          participantId: parentId,
          participantName: parentName,
          participantRole: 'parent'
        }
        
        setFamilyConversations(prev => {
          const existing = prev.find(c => c.id === data.conversationId)
          if (existing) {
            return prev
          }
          return [...prev, conversationData]
        })
        
        setSelectedParent(parentId)
        setSelectedTeacher(null) // Clear other selections
      }
    } catch (error: any) {
      console.error('Error starting family conversation:', error)
    }
  }

  // Fetch assigned teachers
  const fetchAssignedTeachers = async () => {
    if (!user?.id) return
    
    setIsLoadingTeachers(true)
    try {
      console.log('Fetching assigned teachers for student:', user.id)
      const response = await fetch(`/api/student/assigned-teachers?student_id=${user.id}`, {
        // Add cache-busting to ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Assigned teachers data:', data)
        setTeachers(data.teachers || [])
      } else {
        console.error('Failed to fetch assigned teachers:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setTeachers([])
      }
    } catch (error: any) {
      console.error('Error fetching assigned teachers:', error)
      setTeachers([])
    } finally {
      setIsLoadingTeachers(false)
    }
  }

  useEffect(() => {
    if (selectedTab === 'teachers' && user?.id) {
      fetchAssignedTeachers()
    }
  }, [selectedTab, user?.id])

  // Refresh teachers when tab becomes active (handles teacher assignment changes)
  useEffect(() => {
    if (selectedTab === 'teachers' && user?.id) {
      // Add a small delay to ensure any recent database changes are reflected
      const timeoutId = setTimeout(() => {
        fetchAssignedTeachers()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedTab])

  // Fetch family data (parents and conversations)
  useEffect(() => {
    const fetchFamilyData = async () => {
      if (selectedTab !== 'parents') return
      
      setIsLoadingParents(true)
      try {
        const response = await fetch('/api/family-messaging', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          console.log('Student family data response:', data)
          console.log('Parents found:', data.parents)
          setFamilyConversations(data.conversations || [])
          setParents(data.parents || [])
        } else {
          const errorData = await response.text()
          console.error('API Error Response:', errorData)
          console.error('Failed to fetch family data:', response.status, response.statusText)
        }
      } catch (error: any) {
        console.error('Error fetching family data:', error)
        setFamilyConversations([])
        setParents([])
      } finally {
        setIsLoadingParents(false)
      }
    }

    fetchFamilyData()
  }, [selectedTab])

  const conversationStarters = [
    { id: '1', text: 'I need help with today\'s homework', icon: BookOpen },
    { id: '2', text: 'Can you explain this topic again?', icon: HelpCircle },
    { id: '3', text: 'I\'m feeling stressed about the test', icon: Heart },
    { id: '4', text: 'I have an idea for our project', icon: Lightbulb }
  ]

  return (
    <RealtimeProvider>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10" />
          
          <div className="relative z-10 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
              
              {/* Enhanced Header */}
              <motion.div 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <motion.div 
                    className="p-3 sm:p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-xl"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Teacher Connect
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-lg text-gray-600 font-medium">Safe communication with your teachers and family</p>
                    {profile && (
                      <motion.p 
                        className="text-xs sm:text-sm text-gray-500 mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Welcome back, {profile.first_name} {profile.last_name} ✨
                      </motion.p>
                    )}
                  </div>
                </div>
              
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  {/* Student ID Display */}
                  <StudentIdDisplay />
                </div>
              </motion.div>


              {/* Enhanced Navigation Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex space-x-2 bg-white/70 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/20"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    variant={selectedTab === 'teachers' ? 'default' : 'ghost'}
                    onClick={() => setSelectedTab('teachers')}
                    className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold transition-all text-xs sm:text-sm ${
                      selectedTab === 'teachers' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Teachers
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    variant={selectedTab === 'parents' ? 'default' : 'ghost'}
                    onClick={() => setSelectedTab('parents')}
                    className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold transition-all text-xs sm:text-sm ${
                      selectedTab === 'parents' 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' 
                        : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Parents
                  </Button>
                </motion.div>
              </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
              {/* Enhanced Contact List - Mobile: Hide sidebar when chat is open */}
              <motion.div 
                className={`lg:col-span-1 space-y-4 sm:space-y-6 ${selectedTeacher || selectedParent ? 'hidden lg:block' : 'block'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-3 text-lg sm:text-xl">
                      {selectedTab === 'teachers' ? (
                        <>
                          <motion.div 
                            className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Users className="h-5 w-5 text-indigo-600" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">Your Teachers</span>
                        </>
                      ) : (
                        <>
                          <motion.div 
                            className="p-2 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Heart className="h-5 w-5 text-pink-600" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-bold">Your Parents</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={selectedTab === 'teachers' ? "Search teachers..." : "Search parents..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-3 text-sm sm:text-base rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {selectedTab === 'teachers' ? (
                        isLoadingTeachers ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <span className="ml-2 text-gray-500 text-sm">Loading your teachers...</span>
                          </div>
                        ) : teachers.length > 0 ? (
                          teachers
                            .filter(teacher => 
                              searchQuery === '' || 
                              teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((teacher) => (
                            <motion.div
                              key={teacher.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              onClick={() => {
                                setSelectedTeacher(teacher.id)
                                setSelectedParent(null)
                              }}
                              className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
                                selectedTeacher === teacher.id 
                                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-md' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                  <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg">
                                      {teacher.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    {teacher.isOnline && (
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{teacher.name}</p>
                                    <p className="text-xs sm:text-sm text-gray-600 truncate">{teacher.subject}</p>
                                    {(teacher as any).classes && (teacher as any).classes.length > 1 && (
                                      <p className="text-xs text-purple-600 font-medium mt-1">
                                        {(teacher as any).classes.length} classes
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  {teacher.isOnline ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 font-medium">
                                      <span className="hidden sm:inline">Online</span>
                                      <span className="sm:hidden">●</span>
                                    </Badge>
                                  ) : (
                                    <p className="text-xs text-gray-500 hidden sm:block">{teacher.lastSeen}</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm font-medium">No teachers assigned</p>
                            <p className="text-gray-400 text-xs mt-2 px-4">
                              Your teachers will appear here once you're enrolled in classes
                            </p>
                          </div>
                        )
                      ) : (
                        isLoadingParents ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                            <span className="ml-2 text-gray-500">Loading parents...</span>
                          </div>
                        ) : parents.length > 0 ? (
                          parents.map((parent) => (
                            <div
                              key={parent.id}
                              className="p-2 sm:p-3 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-all hover:shadow-md"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                                    {parent.name.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{parent.name}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">Parent</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Button
                                    onClick={() => startFamilyConversation(parent.id)}
                                    variant="outline"
                                    size="sm"
                                    className="bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                                  >
                                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    <span className="hidden sm:inline">Message</span>
                                    <span className="sm:hidden">Chat</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 sm:py-8">
                            <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-xs sm:text-sm">No parents linked yet</p>
                            <p className="text-gray-400 text-xs mt-1 px-2">Your parents will appear here once they register and verify your account</p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Conversation Starters */}
                <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-3 text-lg sm:text-xl">
                      <motion.div 
                        className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Star className="h-5 w-5 text-yellow-600" />
                      </motion.div>
                      <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold">Quick Starters</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    {conversationStarters.map((starter, index) => {
                      const Icon = starter.icon
                      return (
                        <motion.div
                          key={starter.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left h-auto p-3 sm:p-4 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all group"
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className="p-2 bg-gray-100 group-hover:bg-indigo-100 rounded-lg transition-colors">
                                <Icon className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <span className="text-sm sm:text-base text-gray-700 group-hover:text-indigo-700 font-medium">{starter.text}</span>
                            </div>
                          </Button>
                        </motion.div>
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chat Area - Mobile Optimized */}
              <div className={`lg:col-span-2 ${selectedTeacher || selectedParent ? 'block' : 'hidden lg:block'}`}>
                {selectedTeacher ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-[70vh] sm:h-[600px] flex flex-col shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-gray-100 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTeacher(null)}
                              className="lg:hidden p-2 hover:bg-white/50 rounded-full"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0 shadow-lg">
                              {teachers.find(t => t.id === selectedTeacher)?.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                                {teachers.find(t => t.id === selectedTeacher)?.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {teachers.find(t => t.id === selectedTeacher)?.subject}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 flex-shrink-0 font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Available</span>
                            <span className="sm:hidden">●</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gradient-to-b from-gray-50/50 to-white">
                          <div className="space-y-4">
                            {/* Welcome Message */}
                            <div className="flex justify-center">
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 max-w-xs text-center">
                                <p className="text-xs text-blue-700 font-medium">
                                  Start a conversation with your teacher! 
                                  Remember to be respectful and ask clear questions. 📚
                                </p>
                              </div>
                            </div>
                            
                            {/* Message Thread Component */}
                            <MessageThread
                              channelId={selectedTeacher}
                              messages={[]}
                            />
                          </div>
                        </div>
                        
                        {/* Message Input - Student Friendly */}
                        <div className="border-t border-gray-100 p-3 sm:p-4 bg-white">
                          <div className="space-y-3">
                            {/* Quick Message Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {[
                                "I need help with homework",
                                "Can you explain this?",
                                "I'm confused about...",
                                "Thank you!"
                              ].map((quickMsg, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                                >
                                  {quickMsg}
                                </Button>
                              ))}
                            </div>
                            
                            {/* Single Message Composer */}
                            <MessageComposer
                              channelId={selectedTeacher}
                              placeholder="Type your message to your teacher..."
                              showContentAnalysis={true}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : selectedParent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto"
                  >
                    {/* Instagram-like Chat Interface */}
                    <div className="h-full lg:h-[calc(100vh-12rem)] xl:h-[600px] flex flex-col bg-white lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200">
                      {/* Instagram-style Header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white lg:rounded-t-2xl">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedParent(null)}
                            className="p-2 hover:bg-gray-100 rounded-full min-w-[40px] min-h-[40px]"
                          >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                          </Button>
                          
                          {/* Instagram-style Profile Picture */}
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400 rounded-full p-0.5">
                              <div className="w-full h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {parents.find(p => p.id === selectedParent)?.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate text-base">
                              {parents.find(p => p.id === selectedParent)?.name}
                            </h3>
                            <p className="text-xs text-green-600 font-medium">Active now</p>
                          </div>
                        </div>
                        
                        {/* Instagram-style Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                            <Heart className="h-5 w-5 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Instagram-style Messages Area */}
                      <div className="flex-1 overflow-hidden bg-white">
                        <div className="h-full flex flex-col">
                          {/* Messages Container */}
                          <div className="flex-1 overflow-y-auto">
                            <SimpleFamilyMessages 
                              conversationId={familyConversations.find(c => c.participantId === selectedParent)?.id || ''}
                              currentUserId={profile?.id || ''}
                              participantName={parents.find(p => p.id === selectedParent)?.name || 'Parent'}
                              refreshTrigger={messageRefreshTrigger}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Instagram-style Message Input */}
                      <div className="border-t border-gray-200 bg-white p-4 lg:rounded-b-2xl">
                        <div className="space-y-3">
                          {/* Quick Reactions - Instagram Style */}
                          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {[
                              { emoji: "👋", text: "Hi Mom/Dad!" },
                              { emoji: "😊", text: "I had a great day!" },
                              { emoji: "🤔", text: "Can you help me?" },
                              { emoji: "❤️", text: "I love you!" }
                            ].map((quickMsg, index) => (
                              <div key={index} className="flex-shrink-0">
                                <QuickMessageButton
                                  message={`${quickMsg.emoji} ${quickMsg.text}`}
                                  conversationId={familyConversations.find(c => c.participantId === selectedParent)?.id || ''}
                                  participantId={selectedParent}
                                  currentUserId={profile?.id || ''}
                                  onMessageSent={refreshMessages}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Instagram-style Input */}
                          <SimpleFamilyMessageInput 
                            conversationId={familyConversations.find(c => c.participantId === selectedParent)?.id || ''}
                            participantId={selectedParent}
                            currentUserId={profile?.id || ''}
                            onMessageSent={refreshMessages}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <Card className="h-[500px] sm:h-[600px] flex items-center justify-center">
                    <div className="text-center space-y-3 sm:space-y-4 px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {selectedTab === 'teachers' ? 'Select a Teacher' : 'Select a Parent'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500">
                          {selectedTab === 'teachers' 
                            ? 'Choose a teacher from the list to start a conversation'
                            : 'Choose a parent from the list to start a family conversation'
                          }
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </RealtimeProvider>
  )
}

export default function StudentMessagingPage() {
  return (
    <AuthGuard requiredRole="student">
      <StudentMessagingContent />
    </AuthGuard>
  )
}
