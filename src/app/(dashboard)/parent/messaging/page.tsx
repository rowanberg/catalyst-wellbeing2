'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  MessageCircle, 
  Users, 
  Search, 
  Plus, 
  Heart, 
  Shield, 
  Clock,
  ChevronLeft,
  UserPlus,
  Mail,
  CheckCircle,
  Loader2,
  ArrowLeft,
  X,
  AlertTriangle,
  Settings,
  Sparkles,
  Activity,
  TrendingUp,
  Eye,
  Smile,
  BookOpen,
  Send
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { AuthGuard } from '@/components/auth/auth-guard'

interface Child {
  id: string
  name: string
  grade: string
  avatar: string
  recentMessages: number
  lastActivity: string
  wellbeingStatus: 'thriving' | 'good' | 'needs-attention'
}

interface Teacher {
  id: string
  name: string
  subject: string
  email: string
  isOnline: boolean
  lastMessage?: string
  unreadCount: number
  officeHours: string
}

interface FamilyMessage {
  id: string
  childId: string
  content: string
  timestamp: string
  type: 'sent' | 'received'
  isRead: boolean
}

interface ChildMessage {
  id: string
  message_text: string
  sender_id: string
  receiver_id: string
  created_at: string
  is_read: boolean
}

// Simple Child Messages Component - Mobile optimized with smart refresh
function SimpleChildMessages({ conversationId, currentUserId, childName, refreshTrigger }: {
  conversationId: string
  currentUserId: string
  childName: string
  refreshTrigger?: number
}) {
  const [messages, setMessages] = useState<ChildMessage[]>([])
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
      console.error('Error fetching child messages:', error)
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
        <p className="text-gray-400 text-xs mt-1">Start a conversation with {childName}!</p>
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
                  {showAvatar ? childName.charAt(0) : ''}
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

// Simple Parent Message Input - Same UI as student messaging
function SimpleParentMessageInput({ conversationId, participantId, currentUserId, onMessageSent }: {
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

// Quick Message Button for Parents
function ParentQuickMessageButton({ message, conversationId, participantId, currentUserId, onMessageSent }: {
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

// Mock components for now
const RealtimeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
const FamilyMessageThread = ({ conversationId, participantId }: { conversationId: string, participantId: string }) => (
  <div className="flex-1 flex flex-col">
    <div className="p-4 border-b">
      <h3 className="font-semibold">Family Chat</h3>
    </div>
    <div className="flex-1 p-4">
      <p className="text-gray-500">Start a conversation...</p>
    </div>
  </div>
)

function ParentMessagingContent() {
  const { profile, isAuthenticated, user } = useAuth({ requiredRole: 'parent' })
  const [activeTab, setActiveTab] = useState('family')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [children, setChildren] = useState<Child[]>([])
  const [isLoadingChildren, setIsLoadingChildren] = useState(true)
  const [showAddChild, setShowAddChild] = useState(false)
  const [currentChildEmail, setCurrentChildEmail] = useState('')
  const [currentChildId, setCurrentChildId] = useState('')
  const [isVerifyingChild, setIsVerifyingChild] = useState(false)
  const [addChildError, setAddChildError] = useState<string | null>(null)
  const [familyConversations, setFamilyConversations] = useState<any[]>([])
  const [selectedFamilyConversation, setSelectedFamilyConversation] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [messageRefreshTrigger, setMessageRefreshTrigger] = useState(0)

  // Function to refresh messages without page reload
  const refreshMessages = () => {
    setMessageRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    const fetchFamilyData = async () => {
      if (!isAuthenticated || !profile) {
        setIsLoadingChildren(false)
        return
      }

      try {
        const response = await fetch('/api/family-messaging', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('API Error Response:', errorData)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        const transformedChildren = data.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          grade: child.grade ? `Grade ${child.grade}` : 'N/A',
          avatar: '/avatars/default-child.jpg',
          recentMessages: 0,
          lastActivity: 'Recently',
          wellbeingStatus: 'good' as const
        })) || []

        setChildren(transformedChildren)
        setFamilyConversations(data.conversations || [])
      } catch (error: any) {
        console.error('Error fetching family data:', error)
        setChildren([])
        setFamilyConversations([])
      } finally {
        setIsLoadingChildren(false)
      }
    }

    fetchFamilyData()
  }, [isAuthenticated, profile])

  const startFamilyConversation = async (childId: string) => {
    try {
      const response = await fetch('/api/family-messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          participantId: childId,
          participantRole: 'student'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const childName = children.find(child => child.id === childId)?.name || 'Child'
        
        const conversationData = {
          id: data.conversationId,
          participantId: childId,
          participantName: childName,
          participantRole: 'student'
        }
        
        setFamilyConversations(prev => {
          const existing = prev.find(c => c.id === data.conversationId)
          if (existing) {
            return prev
          }
          return [...prev, conversationData]
        })
        
        setSelectedFamilyConversation(data.conversationId)
        setSelectedContact(null) // Clear other selections
      }
    } catch (error: any) {
      console.error('Error starting family conversation:', error)
    }
  }

  const verifyAndAddChild = async () => {
    if (!currentChildEmail || !currentChildId) {
      setAddChildError('Please enter both email and student ID')
      return
    }

    setIsVerifyingChild(true)
    setAddChildError(null)

    try {
      const verifyResponse = await fetch('/api/verify-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: currentChildEmail,
          studentId: currentChildId
        })
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        setAddChildError(verifyData.error || 'Failed to verify student')
        return
      }

      const relationshipResponse = await fetch('/api/parent-child-relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          parentEmail: user?.email,
          childrenEmails: [currentChildEmail]
        }),
        credentials: 'include'
      })

      let relationshipData
      try {
        const responseText = await relationshipResponse.text()
        relationshipData = JSON.parse(responseText)
      } catch (parseError: any) {
        console.error('Failed to parse API response:', parseError)
        setAddChildError('Invalid response from server')
        return
      }

      if (!relationshipResponse.ok) {
        console.error('Failed to create relationship:', relationshipData)
        setAddChildError(relationshipData.error || `Failed to link child: ${relationshipResponse.status} error`)
        return
      }

      setCurrentChildEmail('')
      setCurrentChildId('')
      setShowAddChild(false)
      
      const response = await fetch('/api/family-messaging', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const transformedChildren = data.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          grade: child.grade ? `Grade ${child.grade}` : 'N/A',
          avatar: '/avatars/default-child.jpg',
          recentMessages: 0,
          lastActivity: 'Recently',
          wellbeingStatus: 'good' as const
        })) || []
        setChildren(transformedChildren)
        setFamilyConversations(data.conversations || [])
      }

    } catch (error: any) {
      console.error('Error adding child:', error)
      setAddChildError('Network error. Please try again.')
    } finally {
      setIsVerifyingChild(false)
    }
  }

  const teachers: Teacher[] = [
    {
      id: '1',
      name: 'Ms. Johnson',
      subject: 'Mathematics',
      email: 'johnson@school.edu',
      isOnline: true,
      lastMessage: 'Great progress on the homework!',
      unreadCount: 2,
      officeHours: 'Mon-Fri 3-4 PM'
    },
    {
      id: '2',
      name: 'Mr. Davis',
      subject: 'Science',
      email: 'davis@school.edu',
      isOnline: false,
      lastMessage: 'Lab report due next week',
      unreadCount: 0,
      officeHours: 'Tue-Thu 2-3 PM'
    },
    {
      id: '3',
      name: 'Mrs. Wilson',
      subject: 'English',
      email: 'wilson@school.edu',
      isOnline: true,
      unreadCount: 1,
      officeHours: 'Mon-Wed 1-2 PM'
    }
  ]

  const [familyMessages] = useState<FamilyMessage[]>([
    {
      id: '1',
      childId: '1',
      content: 'Mom, I had a great day at school today! We learned about fractions.',
      timestamp: '2024-01-15T14:30:00Z',
      type: 'received',
      isRead: true
    },
    {
      id: '2',
      childId: '1',
      content: "That's wonderful, Emma! Tell me more about what you learned.",
      timestamp: '2024-01-15T14:32:00Z',
      type: 'sent',
      isRead: true
    }
  ])

  // Convert family messages to Message format for MessageThread
  const convertFamilyMessagesToMessages = (messages: FamilyMessage[]) => {
    return messages.map(msg => ({
      id: msg.id,
      channel_id: `family-${msg.childId}`,
      sender_id: msg.type === 'sent' ? profile?.id || 'parent' : msg.childId,
      sender_name: msg.type === 'sent' ? `${profile?.first_name || 'Parent'}` : children.find(c => c.id === msg.childId)?.name || 'Child',
      sender_role: msg.type === 'sent' ? 'parent' : 'student',
      content: msg.content,
      message_type: 'text' as const,
      created_at: msg.timestamp,
      is_flagged: false,
      isFromCurrentUser: msg.type === 'sent'
    }))
  }

  const getWellbeingColor = (status: string) => {
    switch (status) {
      case 'thriving': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'needs-attention': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <UnifiedAuthGuard requiredRole="parent">
      <RealtimeProvider>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full blur-xl"
            />
            <motion.div
              animate={{ 
                rotate: [360, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-r from-indigo-300/20 to-blue-300/20 rounded-full blur-xl"
            />
            <motion.div
              animate={{ 
                y: [-10, 10, -10],
                x: [-5, 5, -5]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-yellow-300/15 to-orange-300/15 rounded-full blur-lg"
            />
          </div>

          {/* Optimized Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-4 sm:py-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Icon */}
                  <div className="p-2 sm:p-3 bg-blue-600 rounded-lg shadow-sm">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  
                  {/* Title and Description */}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      Family Hub
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
                      Stay connected with your children's school journey
                    </p>
                    <p className="text-xs text-gray-600 mt-1 sm:hidden">
                      Connect with your children
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content with Advanced Visuals */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
          >
            {/* Advanced Stats Cards with Animations */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8"
            >
              <motion.div
                whileHover={{ 
                  scale: 1.02,
                  y: -2
                }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full -translate-y-10 translate-x-10"></div>
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-pink-700/80 truncate font-medium">My Children</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                          className="text-lg sm:text-2xl font-bold text-pink-600"
                        >
                          {children.length}
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-md"
                      >
                        <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ 
                  scale: 1.02,
                  y: -2
                }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full -translate-y-8 translate-x-8"></div>
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-blue-700/80 truncate font-medium">New Messages</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                          className="text-lg sm:text-2xl font-bold text-blue-600"
                        >
                          5
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md"
                      >
                        <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ 
                  scale: 1.02,
                  y: -2
                }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-18 h-18 bg-gradient-to-br from-emerald-300/20 to-green-300/20 rounded-full -translate-y-9 translate-x-9"></div>
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-emerald-700/80 truncate font-medium">Active Chats</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 1.0 }}
                          className="text-lg sm:text-2xl font-bold text-emerald-600"
                        >
                          3
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-md"
                      >
                        <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ 
                  scale: 1.02,
                  y: -2
                }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-22 h-22 bg-gradient-to-br from-purple-300/20 to-violet-300/20 rounded-full -translate-y-11 translate-x-11"></div>
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-purple-700/80 truncate font-medium">This Week</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 1.1 }}
                          className="text-lg sm:text-2xl font-bold text-purple-600"
                        >
                          12
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ 
                          y: [0, -2, 0],
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-md"
                      >
                        <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Enhanced Tabs Section with Advanced Visuals */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.0 }}
                >
                  <div className="flex w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <button
                      onClick={() => setActiveTab('family')}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 py-4 text-xs sm:text-sm font-medium transition-colors ${
                        activeTab === 'family'
                          ? 'bg-pink-50 text-pink-700 border-b-2 border-pink-500'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="min-w-0 truncate">Family</span>
                      <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full ${
                        activeTab === 'family' ? 'bg-pink-200 text-pink-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {children.length}
                      </span>
                    </button>
                    <div className="w-px bg-gray-200"></div>
                    <button
                      onClick={() => setActiveTab('teachers')}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 py-4 text-xs sm:text-sm font-medium transition-colors ${
                        activeTab === 'teachers'
                          ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="min-w-0 truncate">Teachers</span>
                      <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full ${
                        activeTab === 'teachers' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {teachers.length}
                      </span>
                    </button>
                  </div>
                </motion.div>

              <TabsContent value="family" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                  
                  {/* Children List - Mobile Optimized - Hide when chat is active */}
                  <div className={`xl:col-span-1 ${selectedChild ? 'hidden xl:block' : 'block'}`}>
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg sm:text-xl">Your Children</CardTitle>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">Safe family communication</p>
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="p-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg"
                          >
                            <Heart className="h-4 w-4 text-pink-500" />
                          </motion.div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isLoadingChildren ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                            <span className="ml-2 text-gray-500">Loading children...</span>
                          </div>
                        ) : (
                          <>
                            {/* Professional Children List */}
                            {children.length > 0 && (
                              <div className="space-y-4">
                                {children.map((child) => (
                                  <div
                                    key={child.id}
                                    className="p-4 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-colors duration-200"
                                  >
                                    <div className="flex items-center space-x-4">
                                      {/* Simple Profile Picture */}
                                      <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                          {child.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        
                                        {/* Simple Status Indicator */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                        
                                        {/* Message Count */}
                                        {child.recentMessages > 0 && (
                                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-medium">{child.recentMessages}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Child Information */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                              {child.name}
                                            </h4>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <span className="text-sm text-gray-600">{child.grade}</span>
                                              <span className="text-gray-400">•</span>
                                              <span className="text-sm text-gray-600 capitalize">
                                                {child.wellbeingStatus.replace('-', ' ')}
                                              </span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                              <Clock className="h-3 w-3 mr-1" />
                                              <span>Active {child.lastActivity}</span>
                                            </div>
                                          </div>
                                          
                                          {/* Message Button */}
                                          <Button
                                            onClick={() => {
                                              setSelectedChild(child.id)
                                              startFamilyConversation(child.id)
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                          >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Message
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Child Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              {children.length === 0 ? (
                                <div className="text-center py-8">
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-gray-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No children connected</h3>
                                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                    Add your children to start messaging and stay connected with their school activities.
                                  </p>
                                  <Button
                                    onClick={() => setShowAddChild(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Child
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <Button
                                    onClick={() => setShowAddChild(true)}
                                    variant="outline"
                                    className="w-full border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700 py-3 rounded-lg"
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Another Child
                                  </Button>
                                </div>
                              )}
                            </div>
                          </>
                        )}


                        {/* Enhanced Add Child Modal/Form */}
                        <AnimatePresence>
                          {showAddChild && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -20, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-xl border border-pink-200/50 shadow-lg backdrop-blur-sm relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full -translate-y-12 translate-x-12"></div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg shadow-md">
                                      <UserPlus className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-pink-800 text-lg">Add Child</h4>
                                      <p className="text-xs text-pink-600">Connect with your child's school account</p>
                                    </div>
                                  </div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      onClick={() => {
                                        setShowAddChild(false)
                                        setCurrentChildEmail('')
                                        setCurrentChildId('')
                                        setAddChildError(null)
                                      }}
                                      variant="ghost"
                                      size="sm"
                                      className="text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-full p-2"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                            
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-pink-700">Child's Email Address</label>
                                    <Input
                                      value={currentChildEmail}
                                      onChange={(e) => setCurrentChildEmail(e.target.value)}
                                      type="email"
                                      placeholder="Enter your child's school email"
                                      className="w-full bg-white/80 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                                      disabled={isVerifyingChild}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-pink-700">Student ID</label>
                                    <Input
                                      value={currentChildId}
                                      onChange={(e) => setCurrentChildId(e.target.value)}
                                      type="text"
                                      placeholder="Enter your child's student ID"
                                      className="w-full bg-white/80 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                                      disabled={isVerifyingChild}
                                    />
                                  </div>
                                  
                                  {addChildError && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
                                    >
                                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                      <span>{addChildError}</span>
                                    </motion.div>
                                  )}
                                  
                                  <div className="flex gap-3 pt-2">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                      <Button
                                        onClick={verifyAndAddChild}
                                        disabled={!currentChildEmail || !currentChildId || isVerifyingChild}
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                      >
                                        {isVerifyingChild ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Verifying...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Verify & Add Child
                                          </>
                                        )}
                                      </Button>
                                    </motion.div>
                                  </div>
                                  
                                  <div className="bg-blue-50/80 border border-blue-200/50 rounded-lg p-3">
                                    <div className="flex items-start space-x-2 text-blue-700">
                                      <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium">Secure Verification</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          Both email and student ID are required to verify your child's school account and ensure secure connection.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
                          <div className="flex items-center space-x-3 text-blue-700">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Shield className="h-5 w-5" />
                            </motion.div>
                            <div>
                              <span className="text-sm font-semibold">Safe Family Communication</span>
                              <p className="text-xs text-blue-600 mt-1">
                                All family messages are private and secure. School staff cannot access these conversations.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chat Area - Mobile Optimized - Same UI as Student Messaging */}
                  <div className={`xl:col-span-2 ${selectedChild ? 'block' : 'hidden xl:block'}`}>
                    {selectedChild ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 xl:relative xl:inset-auto xl:z-auto"
                      >
                        {/* Instagram-like Chat Interface */}
                        <div className="h-full xl:h-[calc(100vh-12rem)] 2xl:h-[600px] flex flex-col bg-white xl:rounded-2xl xl:shadow-xl xl:border xl:border-gray-200">
                          {/* Instagram-style Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white xl:rounded-t-2xl">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedChild(null)}
                                className="p-2 hover:bg-gray-100 rounded-full min-w-[40px] min-h-[40px]"
                              >
                                <ArrowLeft className="h-5 w-5 text-gray-700" />
                              </Button>
                              
                              {/* Instagram-style Profile Picture */}
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400 rounded-full p-0.5">
                                  <div className="w-full h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {children.find(c => c.id === selectedChild)?.name.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 truncate text-base">
                                  {children.find(c => c.id === selectedChild)?.name}
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
                                <SimpleChildMessages 
                                  conversationId={familyConversations.find(c => c.participantId === selectedChild)?.id || ''}
                                  currentUserId={profile?.id || ''}
                                  childName={children.find(c => c.id === selectedChild)?.name || 'Child'}
                                  refreshTrigger={messageRefreshTrigger}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Instagram-style Message Input */}
                          <div className="border-t border-gray-200 bg-white p-4 xl:rounded-b-2xl">
                            <div className="space-y-3">
                              {/* Quick Reactions - Instagram Style */}
                              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {[
                                  { emoji: "😊", text: "How was school today?" },
                                  { emoji: "👏", text: "I'm proud of you!" },
                                  { emoji: "📚", text: "Need help with homework?" },
                                  { emoji: "❤️", text: "Love you!" }
                                ].map((quickMsg, index) => (
                                  <div key={index} className="flex-shrink-0">
                                    <ParentQuickMessageButton
                                      message={`${quickMsg.emoji} ${quickMsg.text}`}
                                      conversationId={familyConversations.find(c => c.participantId === selectedChild)?.id || ''}
                                      participantId={selectedChild}
                                      currentUserId={profile?.id || ''}
                                      onMessageSent={refreshMessages}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              {/* Instagram-style Input */}
                              <SimpleParentMessageInput 
                                conversationId={familyConversations.find(c => c.participantId === selectedChild)?.id || ''}
                                participantId={selectedChild}
                                currentUserId={profile?.id || ''}
                                onMessageSent={refreshMessages}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <Card className="h-[500px] sm:h-[600px] lg:h-[700px] flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-indigo-50/50 backdrop-blur-sm">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center space-y-6 p-8"
                        >
                          <motion.div 
                            animate={{ 
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-lg"
                          >
                            <Heart className="h-10 w-10 text-pink-500" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Child to Chat</h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                              Click the "Message" button next to any of your children to start a secure family conversation
                            </p>
                          </div>
                        </motion.div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
              {/* Teachers Tab */}
              <TabsContent value="teachers" className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-full lg:w-1/3">
                    <Card className="h-[500px] sm:h-[600px] overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                      <CardHeader className="p-4 sm:p-6 border-b bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                Your Children
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-0.5">
                                Family messaging and communication
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-sm">
                              {children.length} {children.length === 1 ? 'Child' : 'Children'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-1 max-h-[400px] sm:max-h-[450px] overflow-y-auto">
                          {teachers.map((teacher) => (
                            <motion.div
                              key={teacher.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedContact(teacher.id)}
                              className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 hover:bg-blue-50/50 ${
                                selectedContact === teacher.id ? 'bg-blue-100/70 border-l-4 border-l-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                    <AvatarImage src={`/avatars/teacher-${teacher.id}.jpg`} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                                      {teacher.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {teacher.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{teacher.name}</h4>
                                    {teacher.unreadCount > 0 && (
                                      <Badge className="bg-red-500 text-white text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                                        {teacher.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">{teacher.subject}</p>
                                  {teacher.lastMessage && (
                                    <p className="text-xs text-gray-500 truncate mt-1">{teacher.lastMessage}</p>
                                  )}
                                  <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Office Hours: </span>
                                    <span className="sm:hidden">Hours: </span>
                                    {teacher.officeHours}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex-1">
                    {selectedContact ? (
                      <Card className="h-[500px] sm:h-[600px] flex flex-col bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                        <CardHeader className="p-3 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedContact(null)}
                                className="lg:hidden p-2"
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                <AvatarImage src={`/avatars/teacher-${selectedContact}.jpg`} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                                  {teachers.find(t => t.id === selectedContact)?.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {teachers.find(t => t.id === selectedContact)?.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {teachers.find(t => t.id === selectedContact)?.subject}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Secure Chat</span>
                              <span className="sm:hidden">Secure</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        <div className="flex-1 p-4 bg-gray-50">
                          <div className="text-center text-gray-500">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>Teacher messaging coming soon...</p>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="h-[500px] sm:h-[600px] flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 backdrop-blur-sm">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center space-y-6 p-8"
                        >
                          <motion.div 
                            animate={{ 
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg"
                          >
                            <BookOpen className="h-10 w-10 text-blue-500" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Teacher to Chat</h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                              Click on any teacher to start a secure conversation during their office hours
                            </p>
                          </div>
                        </motion.div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </motion.div>
    </RealtimeProvider>
  </UnifiedAuthGuard>
  )
}

export default function ParentMessagingPage() {
  return (
    <UnifiedAuthGuard requiredRole="parent">
      <ParentMessagingContent />
    </UnifiedAuthGuard>
  )
}
