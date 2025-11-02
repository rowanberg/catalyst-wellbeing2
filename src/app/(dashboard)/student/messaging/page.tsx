'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { useRouter } from 'next/navigation'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Users, 
  Heart, 
  BookOpen,
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
  ArrowLeft,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Camera,
  Mic,
  Image as ImageIcon,
  Zap,
  ThumbsUp,
  Frown,
  Shield,
  School,
  Crown,
  Calendar,
  FileText,
  TrendingUp,
  Award,
  Target,
  Brain,
  Gamepad2,
  Trophy,
  Sparkles,
  Rocket,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Compass,
  Bookmark,
  Bell,
  Gift,
  Megaphone,
  Users2,
  MessageSquare,
  Vote,
  Briefcase,
  GraduationCap,
  Palette,
  Music,
  Scissors,
  Paintbrush
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  subject: string
  avatar: string
  isOnline: boolean
  lastSeen?: string
  classes?: any[]
}

interface Parent {
  id: string
  name: string
  email?: string
  avatar?: string
  isOnline?: boolean
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

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantRole: 'parent' | 'teacher'
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isOnline?: boolean
  avatar?: string
}

interface ManagementMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  subject: string
  content: string
  messageType: string
  isRead: boolean
  createdAt: string
  timeAgo: string
}

interface WhatsAppConfig {
  phoneNumber?: string
  whatsappLink?: string
  isEnabled?: boolean
}

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Utility function for caching API responses
const getCachedData = (key: string) => {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: any, ttl: number = 30000) => {
  apiCache.set(key, { data, timestamp: Date.now(), ttl })
}

// Instagram-style Message Bubble Component
function InstagramMessageBubble({ message, isFromCurrentUser, participantName, showAvatar, isLastInGroup }: {
  message: FamilyMessage
  isFromCurrentUser: boolean
  participantName: string
  showAvatar: boolean
  isLastInGroup: boolean
}) {
  const [showReactions, setShowReactions] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)
  
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡']
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end space-x-2 group ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}
    >
      {/* Avatar for received messages */}
      {!isFromCurrentUser && (
        <Avatar className={`w-6 h-6 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
          <AvatarFallback className="bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-semibold">
            {showAvatar ? participantName.charAt(0) : ''}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[75%] ${isFromCurrentUser ? 'ml-12' : 'mr-12'} relative`}>
        {/* Message bubble with Instagram styling */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed break-words relative ${
            isFromCurrentUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md shadow-md'
              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md border border-gray-200'
          }`}
          onDoubleClick={() => setShowReactions(!showReactions)}
        >
          {message.message_text}
          
          {/* Reaction overlay */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute -top-12 left-0 right-0 flex justify-center"
              >
                <div className="bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1 flex space-x-1">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction}
                      onClick={() => {
                        setSelectedReaction(reaction)
                        setShowReactions(false)
                      }}
                      className="hover:scale-125 transition-transform duration-200 text-lg"
                    >
                      {reaction}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Selected reaction */}
        {selectedReaction && (
          <div className={`absolute -bottom-2 ${isFromCurrentUser ? 'right-2' : 'left-2'} bg-white rounded-full shadow-md border border-gray-200 px-1.5 py-0.5 text-xs`}>
            {selectedReaction}
          </div>
        )}
        
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
    </motion.div>
  )
}

// WhatsApp Contact Card Component
function WhatsAppContactCard({ parent, onOpenChat }: {
  parent: any
  onOpenChat: (phoneNumber: string, name: string) => void
}) {
  const quickMessages = [
    "Hi! I'm on my way home 🏠",
    "Need help with homework 📚",
    "Running a bit late today ⏰",
    "Can you pick me up? 🚗"
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-gray-100 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Parent Info - Mobile Optimized */}
      <div className="flex items-start sm:items-center mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl sm:rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
            {parent.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          {/* Online Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        
        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">{parent.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium">
              Parent
            </span>
            <div className="flex items-center text-green-600">
              <MessageCircle className="w-3 h-3 mr-1" />
              <span className="text-xs font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Button - Touch Optimized */}
      <button
        onClick={() => onOpenChat(parent.phone || '', parent.name)}
        disabled={!parent.phone}
        className={`w-full py-3.5 sm:py-3 px-4 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] mb-4 ${
          parent.phone 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">{parent.phone ? 'Open WhatsApp Chat' : 'Phone Number Not Available'}</span>
        <span className="sm:hidden">{parent.phone ? 'Chat on WhatsApp' : 'No Phone Number'}</span>
      </button>

      {/* Quick Messages - Mobile Grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {parent.phone ? 'Quick Messages' : 'Setup Required'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickMessages.map((message, index) => (
            <button
              key={index}
              onClick={() => {
                if (!parent.phone) return
                const encodedMessage = encodeURIComponent(message)
                const whatsappUrl = `https://wa.me/${parent.phone?.replace(/\D/g, '')}?text=${encodedMessage}`
                window.open(whatsappUrl, '_blank')
              }}
              disabled={!parent.phone}
              className={`text-left text-xs sm:text-sm p-3 sm:p-2.5 rounded-lg transition-all duration-150 border active:scale-[0.98] ${
                parent.phone
                  ? 'bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 border-gray-200 hover:border-green-300 hover:shadow-sm'
                  : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="line-clamp-2">{message}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Instagram-style Message Input Component
function InstagramMessageInput({ teacherId, placeholder, onMessageSent }: {
  teacherId?: string
  placeholder: string
  onMessageSent?: () => void
}) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || isSending || !teacherId) return

    setIsSending(true)
    try {
      // Simulate API call - replace with actual teacher messaging API
      console.log('Sending message to teacher:', { teacherId, message })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay
      
      setMessage('')
      if (onMessageSent) {
        onMessageSent()
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
    <div className="flex items-end space-x-3 bg-white border-t border-gray-100 p-4">
      <div className="flex-1 relative">
        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 border-0 bg-transparent focus:ring-0 rounded-full py-3 px-4 text-sm"
            disabled={isSending}
            style={{ fontSize: '16px' }}
          />
          <div className="flex items-center space-x-1 pr-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Paperclip className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
        
        {/* Quick emoji reactions */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl shadow-lg border border-gray-200 p-3"
            >
              <div className="flex space-x-2">
                {['😊', '👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessage(prev => prev + emoji)
                      setShowEmojiPicker(false)
                    }}
                    className="hover:scale-125 transition-transform duration-200 text-xl p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Button
        onClick={sendMessage}
        disabled={!message.trim() || isSending}
        className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 min-h-[44px] min-w-[44px] shadow-lg transition-all duration-200"
        size="sm"
      >
        {isSending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          messageText: message.trim(),
          conversationId
        }),
      })

      if (response.ok) {
        setMessage('')
        onMessageSent?.()
        toast.success('Message sent!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
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

function StudentMessagingContent() {
  const router = useRouter()
  const { profile, user } = useAppSelector((state) => state.auth)
  const [selectedTab, setSelectedTab] = useState<'teachers' | 'parents' | 'community'>('teachers')
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [parents, setParents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false)
  const [isLoadingParents, setIsLoadingParents] = useState(false)
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null)
  
  // Management messages state
  const [managementMessages, setManagementMessages] = useState<ManagementMessage[]>([])
  const [isLoadingManagementMessages, setIsLoadingManagementMessages] = useState(false)
  const [selectedManagementMessage, setSelectedManagementMessage] = useState<ManagementMessage | null>(null)
  const [showManagementMessages, setShowManagementMessages] = useState(true)

  // WhatsApp functions
  const openWhatsAppChat = (phoneNumber: string, parentName: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}`
    window.open(whatsappUrl, '_blank')
  }

  // Fetch management messages and WhatsApp config
  const fetchManagementMessages = useCallback(async () => {
    if (!user?.id) return

    setIsLoadingManagementMessages(true)
    try {
      const response = await fetch('/api/student/management-messages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setManagementMessages(data.messages || [])
        setWhatsappConfig(data.whatsappConfig)
      } else {
        // Silently handle errors - management messages are optional
        console.warn('Management messages not available:', response.status)
        setManagementMessages([])
        setWhatsappConfig(null)
      }
    } catch (error) {
      // Silently handle network errors - management messages are optional
      console.warn('Management messages API not available:', error)
      setManagementMessages([])
      setWhatsappConfig(null)
    } finally {
      setIsLoadingManagementMessages(false)
    }
  }, [user?.id])

  // Mark management message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const response = await fetch('/api/student/management-messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId,
          isRead: true
        })
      })

      if (response.ok) {
        setManagementMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        )
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }, [user?.id])


  // Optimized fetch assigned teachers with caching
  const fetchAssignedTeachers = useCallback(async () => {
    if (!user?.id) return
    
    // Check cache first
    const cacheKey = `teachers_${user.id}`
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      setTeachers(cachedData)
      setIsLoadingTeachers(false)
      return
    }
    
    setIsLoadingTeachers(true)
    try {
      const response = await fetch(`/api/student/assigned-teachers?student_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const teachersData = data.teachers || []
        setTeachers(teachersData)
        // Cache the data for 5 minutes
        setCachedData(cacheKey, teachersData, 300000)
      } else {
        console.error('Failed to fetch assigned teachers:', response.status)
        setTeachers([])
      }
    } catch (error: any) {
      console.error('Error fetching assigned teachers:', error)
      setTeachers([])
    } finally {
      setIsLoadingTeachers(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (selectedTab === 'teachers' && user?.id) {
      fetchAssignedTeachers()
      fetchManagementMessages()
    }
  }, [selectedTab, user?.id, fetchAssignedTeachers, fetchManagementMessages])

  // Load real parent contacts for WhatsApp
  useEffect(() => {
    const fetchParentContacts = async () => {
      if (selectedTab !== 'parents' || !user?.id) return
      
      setIsLoadingParents(true)
      try {
        const response = await fetch('/api/family-messaging', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Parent data received:', data)
          setParents(data.parents || [])
        } else {
          console.warn('Failed to fetch parent data:', response.status)
          setParents([])
        }
      } catch (error: any) {
        console.error('Error loading parent contacts:', error)
        setParents([])
      } finally {
        setIsLoadingParents(false)
      }
    }

    fetchParentContacts()
  }, [selectedTab, user?.id])

  const conversationStarters = [
    { id: '1', text: 'I need help with today\'s homework', icon: BookOpen },
    { id: '2', text: 'Can you explain this topic again?', icon: HelpCircle },
    { id: '3', text: 'I\'m feeling stressed about the test', icon: Heart },
    { id: '4', text: 'I have an idea for our project', icon: Lightbulb }
  ]

  return (
    <div className="messaging-container">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          
          <div className="relative z-10 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
              
              {/* Premium Modern Header */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Premium Glass Card Header */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-6 sm:space-y-0">
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <motion.div 
                        className="relative p-4 sm:p-5 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-2xl"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                      </motion.div>
                      <div>
                        <motion.h1 
                          className="text-2xl sm:text-3xl lg:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Connect Hub
                        </motion.h1>
                        <motion.p 
                          className="text-sm sm:text-base lg:text-xl text-white/80 font-medium mt-1"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          Premium messaging experience
                        </motion.p>
                        {profile && (
                          <motion.p 
                            className="text-xs sm:text-sm text-white/60 mt-2 flex items-center space-x-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span>Welcome back, {profile.first_name} {profile.last_name}</span>
                          </motion.p>
                        )}
                      </div>
                    </div>
                  
                    {/* Premium Status Indicators */}
                    <motion.div 
                      className="flex items-center space-x-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white/80 text-sm font-medium">Online</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-white/80 text-sm font-medium">Secure</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>


              {/* Premium Navigation Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-xl p-3 rounded-3xl shadow-2xl border border-white/20"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    variant={selectedTab === 'teachers' ? 'default' : 'ghost'}
                    onClick={() => setSelectedTab('teachers')}
                    className={`w-full py-3 sm:py-4 px-2 sm:px-4 rounded-2xl font-bold transition-all text-xs sm:text-base ${
                      selectedTab === 'teachers' 
                        ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-2xl border-0' 
                        : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    <Users className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                    <span className="hidden sm:inline">Teachers</span>
                    <span className="sm:hidden">Teachers</span>
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
                    className={`w-full py-3 sm:py-4 px-2 sm:px-4 rounded-2xl font-bold transition-all text-xs sm:text-base ${
                      selectedTab === 'parents' 
                        ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white shadow-2xl border-0' 
                        : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    <Heart className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                    <span className="hidden sm:inline">Family</span>
                    <span className="sm:hidden">Family</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    variant={selectedTab === 'community' ? 'default' : 'ghost'}
                    onClick={() => setSelectedTab('community')}
                    className={`w-full py-3 sm:py-4 px-2 sm:px-4 rounded-2xl font-bold transition-all text-xs sm:text-base ${
                      selectedTab === 'community' 
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl border-0' 
                        : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    <School className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                    <span className="hidden sm:inline">Tools</span>
                    <span className="sm:hidden">Tools</span>
                  </Button>
                </motion.div>
              </motion.div>

            {/* Enhanced Contact List - Full Width */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="w-full"
            >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-4 text-xl sm:text-2xl">
                      {selectedTab === 'teachers' ? (
                        <>
                          <motion.div 
                            className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm border border-white/20"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Users className="h-6 w-6 text-violet-300" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent font-black">Your Teachers</span>
                        </>
                      ) : selectedTab === 'parents' ? (
                        <>
                          <motion.div 
                            className="p-3 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl backdrop-blur-sm border border-white/20"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Heart className="h-6 w-6 text-pink-300" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent font-black">Your Family</span>
                        </>
                      ) : (
                        <>
                          <motion.div 
                            className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl backdrop-blur-sm border border-white/20"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <School className="h-6 w-6 text-emerald-300" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent font-black">Tools & Features</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                      <Input
                        placeholder={
                          selectedTab === 'teachers' ? "Search teachers..." : 
                          selectedTab === 'parents' ? "Search family..." : 
                          "Search community..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-4 text-sm sm:text-base rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 backdrop-blur-sm transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {selectedTab === 'teachers' && (
                        <>
                        {isLoadingTeachers ? (
                          <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                              <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-violet-400"></div>
                              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                            </div>
                            <div className="text-center">
                              <p className="text-white/80 text-sm font-medium">Loading your teachers...</p>
                              <p className="text-white/60 text-xs mt-1">Getting everything ready</p>
                            </div>
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
                                
                              }}
                              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-2xl group ${
                                false 
                                  ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/50 shadow-xl backdrop-blur-sm' 
                                  : 'bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                  <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-2xl border-2 border-white/20">
                                      {teacher.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    {teacher.isOnline && (
                                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 border-2 border-white rounded-full animate-pulse shadow-lg"></div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-white text-sm sm:text-base truncate group-hover:text-white/90">{teacher.name}</p>
                                    <p className="text-xs sm:text-sm text-white/70 truncate group-hover:text-white/80">{teacher.subject}</p>
                                    {(teacher as any).classes && (teacher as any).classes.length > 1 && (
                                      <p className="text-xs text-violet-300 font-medium mt-1 group-hover:text-violet-200">
                                        {(teacher as any).classes.length} classes
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  {teacher.isOnline ? (
                                    <div className="flex items-center space-x-1 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-green-400/30">
                                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                      <span className="text-green-300 text-xs font-medium hidden sm:inline">Online</span>
                                      <span className="text-green-300 text-xs font-medium sm:hidden">●</span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-white/50 hidden sm:block">{teacher.lastSeen}</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                              <Users className="h-8 w-8 text-white/40" />
                            </div>
                            <p className="text-white/80 text-sm font-medium">No teachers assigned</p>
                            <p className="text-white/60 text-xs mt-2 px-4">
                              Your teachers will appear here once you're enrolled in classes
                            </p>
                          </div>
                        )}

                        {/* Management Messages Section */}
                        {managementMessages.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-white/20">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl backdrop-blur-sm border border-white/20">
                                  <Megaphone className="h-5 w-5 text-orange-300" />
                                </div>
                                <h3 className="text-white font-semibold text-sm">Management Messages</h3>
                                {managementMessages.filter(msg => !msg.isRead).length > 0 && (
                                  <Badge className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full border-red-400/30">
                                    {managementMessages.filter(msg => !msg.isRead).length} new
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowManagementMessages(!showManagementMessages)}
                                className="text-white/60 hover:text-white/80 p-2"
                              >
                                {showManagementMessages ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                            </div>

                            <AnimatePresence>
                              {showManagementMessages && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-2 max-h-64 overflow-y-auto"
                                >
                                  {managementMessages.slice(0, 5).map((message) => (
                                    <motion.div
                                      key={message.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
                                        message.isRead 
                                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                          : 'bg-orange-500/10 border-orange-400/30 hover:bg-orange-500/20'
                                      }`}
                                      onClick={() => {
                                        setSelectedManagementMessage(message)
                                        if (!message.isRead) {
                                          markMessageAsRead(message.id)
                                        }
                                      }}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <p className="text-white text-xs font-medium truncate">{message.subject}</p>
                                            {!message.isRead && (
                                              <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                                            )}
                                          </div>
                                          <p className="text-white/60 text-xs truncate mb-1">{message.content}</p>
                                          <div className="flex items-center justify-between">
                                            <p className="text-white/40 text-xs">From: {message.senderName}</p>
                                            <p className="text-white/40 text-xs">{message.timeAgo}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                  
                                  {managementMessages.length > 5 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-white/60 hover:text-white/80 text-xs py-2"
                                      onClick={() => {
                                        // TODO: Show all messages modal
                                        toast.info('View all messages feature coming soon!')
                                      }}
                                    >
                                      View all {managementMessages.length} messages
                                    </Button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* WhatsApp Contact Section */}
                        {whatsappConfig?.isEnabled && (whatsappConfig.phoneNumber || whatsappConfig.whatsappLink) && (
                          <div className="mt-6 pt-6 border-t border-white/20">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl backdrop-blur-sm border border-white/20">
                                  <MessageCircle className="h-5 w-5 text-green-300" />
                                </div>
                                <h3 className="text-white font-semibold text-sm">Quick Contact</h3>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-green-500/10 border border-green-400/20 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <MessageCircle className="h-5 w-5 text-green-300" />
                                  </div>
                                  <div>
                                    <p className="text-white text-sm font-medium">WhatsApp Contact</p>
                                    <p className="text-green-300 text-xs">
                                      {whatsappConfig.phoneNumber || 'Custom Link'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    const link = whatsappConfig.whatsappLink || 
                                      (whatsappConfig.phoneNumber ? `https://wa.me/${whatsappConfig.phoneNumber.replace(/\D/g, '')}` : '')
                                    if (link) {
                                      window.open(link, '_blank')
                                      toast.success('Opening WhatsApp...')
                                    }
                                  }}
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs"
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Chat
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        </>
                      )}
                      
                      {selectedTab === 'parents' && (
                        <>
                        {isLoadingParents ? (
                          <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                              <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-green-400"></div>
                              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-pink-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                            </div>
                            <div className="text-center">
                              <p className="text-white/80 text-sm font-medium">Loading your family...</p>
                              <p className="text-white/60 text-xs mt-1">Getting parent contact information</p>
                            </div>
                          </div>
                        ) : parents.length > 0 ? (
                          <div className="grid gap-4">
                            {parents.map((parent: any) => (
                              <WhatsAppContactCard
                                key={parent.id}
                                parent={parent}
                                onOpenChat={openWhatsAppChat}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                              <Heart className="h-8 w-8 text-white/40" />
                            </div>
                            <p className="text-white/80 text-sm font-medium">No family linked yet</p>
                            <p className="text-white/60 text-xs mt-2 px-4">Your family will appear here once they register and verify your account</p>
                          </div>
                        )}
                        </>
                      )}
                      
                      {selectedTab === 'community' && (
                        <div className="space-y-4">
                          {/* Tools Grid - Full Width Optimized */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/20 backdrop-blur-sm cursor-pointer hover:bg-blue-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/study-planner')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl group-hover:bg-blue-500/30 transition-colors">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">AI Study Planner</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Personalized study schedules & reminders</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <Zap className="h-3 w-3 text-blue-400" />
                                        <span className="text-white/70 text-xs">AI-powered</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">Smart scheduling</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-400/30 text-xs px-2 py-0.5">
                                      Popular
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-sm cursor-pointer hover:bg-purple-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/grade-analytics')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl group-hover:bg-purple-500/30 transition-colors">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300 group-hover:text-purple-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Grade Analytics</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Track academic progress & insights</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <TrendingUp className="h-3 w-3 text-purple-400" />
                                        <span className="text-white/70 text-xs">Progress tracking</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">Analytics</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-400/30 text-xs px-2 py-0.5">
                                      Insights
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 backdrop-blur-sm cursor-pointer hover:bg-green-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/homework-helper')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-green-500/20 rounded-lg sm:rounded-xl group-hover:bg-green-500/30 transition-colors">
                                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 group-hover:text-green-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">AI Homework Helper</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Smart assignment assistance & tutoring</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <Brain className="h-3 w-3 text-green-400" />
                                        <span className="text-white/70 text-xs">AI tutor</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">24/7 help</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-400/30 text-xs px-2 py-0.5">
                                      Smart
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Study Groups */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-400/20 backdrop-blur-sm cursor-pointer hover:bg-rose-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/study-groups')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-rose-500/20 rounded-lg sm:rounded-xl group-hover:bg-rose-500/30 transition-colors">
                                    <Users2 className="h-4 w-4 sm:h-5 sm:w-5 text-rose-300 group-hover:text-rose-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Study Groups</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Collaborative learning spaces with peers</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex -space-x-1">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-rose-400 rounded-full border border-white/20"></div>
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-pink-400 rounded-full border border-white/20"></div>
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-400 rounded-full border border-white/20"></div>
                                      </div>
                                      <span className="text-white/50 text-xs">12+ active groups</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-400/30 text-xs px-2 py-0.5">
                                      Hot
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Peer Tutoring */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 backdrop-blur-sm cursor-pointer hover:bg-cyan-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/peer-tutoring')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-cyan-500/20 rounded-lg sm:rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Peer Tutoring</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Connect with experienced student tutors</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span className="text-white/70 text-xs">4.8 rating</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">8 tutors online</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-400/30 text-xs px-2 py-0.5">
                                      New
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              {/* School Events Hub */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20 backdrop-blur-sm cursor-pointer hover:bg-orange-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/school-events')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-orange-500/20 rounded-lg sm:rounded-xl group-hover:bg-orange-500/30 transition-colors">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-300 group-hover:text-orange-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">School Events Hub</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Discover & join exciting school activities</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3 text-orange-400" />
                                        <span className="text-white/70 text-xs">3 events today</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">15 upcoming</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-300 border-orange-400/30 text-xs px-2 py-0.5">
                                      Live
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>
                              
                              {/* Achievement Center */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 backdrop-blur-sm cursor-pointer hover:bg-yellow-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/achievement-center')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-yellow-500/20 rounded-lg sm:rounded-xl group-hover:bg-yellow-500/30 transition-colors">
                                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300 group-hover:text-yellow-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Achievement Center</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Unlock badges, trophies & exclusive rewards</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <div className="flex -space-x-0.5">
                                          <div className="w-3 h-3 bg-yellow-400 rounded-sm rotate-45"></div>
                                          <div className="w-3 h-3 bg-orange-400 rounded-sm rotate-45"></div>
                                          <div className="w-3 h-3 bg-red-400 rounded-sm rotate-45"></div>
                                        </div>
                                        <span className="text-white/70 text-xs">7 badges earned</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">3 new available</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-300 border-yellow-400/30 text-xs px-2 py-0.5">
                                      Trending
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Learning Games */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 backdrop-blur-sm cursor-pointer hover:bg-indigo-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/learning-games')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-indigo-500/20 rounded-lg sm:rounded-xl group-hover:bg-indigo-500/30 transition-colors">
                                    <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Learning Games</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Interactive educational mini-games & challenges</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <Zap className="h-3 w-3 text-indigo-400" />
                                        <span className="text-white/70 text-xs">5 games unlocked</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">Level 12</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-400/30 text-xs px-2 py-0.5">
                                      Fun
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>
                              
                              {/* Digital Portfolio */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-400/20 backdrop-blur-sm cursor-pointer hover:bg-pink-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/digital-portfolio')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-pink-500/20 rounded-lg sm:rounded-xl group-hover:bg-pink-500/30 transition-colors">
                                    <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-pink-300 group-hover:text-pink-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Digital Portfolio</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Showcase your best work & achievements</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <div className="flex -space-x-1">
                                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-pink-400 to-rose-400 rounded border border-white/20 flex items-center justify-center">
                                            <ImageIcon className="h-2 w-2 text-white" />
                                          </div>
                                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-400 to-pink-400 rounded border border-white/20 flex items-center justify-center">
                                            <BookOpen className="h-2 w-2 text-white" />
                                          </div>
                                        </div>
                                        <span className="text-white/70 text-xs">12 projects</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">85% complete</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-pink-500/10 text-pink-300 border-pink-400/30 text-xs px-2 py-0.5">
                                      Popular
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Project Showcase */}
                              <motion.div
                                className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500/10 to-green-500/10 border border-teal-400/20 backdrop-blur-sm cursor-pointer hover:bg-teal-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/student/project-showcase')}
                              >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <div className="relative p-2 sm:p-3 bg-teal-500/20 rounded-lg sm:rounded-xl group-hover:bg-teal-500/30 transition-colors">
                                    <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-teal-300 group-hover:text-teal-200 transition-colors" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="text-white/90 font-semibold text-sm sm:text-base truncate">Project Showcase</p>
                                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs sm:text-sm line-clamp-1">Share creative projects with the community</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                        <Heart className="h-3 w-3 text-teal-400 fill-current" />
                                        <span className="text-white/70 text-xs">24 likes</span>
                                      </div>
                                      <span className="text-white/50 text-xs">•</span>
                                      <span className="text-white/50 text-xs">5 comments</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge variant="outline" className="bg-teal-500/10 text-teal-300 border-teal-400/30 text-xs px-2 py-0.5">
                                      Creative
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
  )
} 


export default function StudentMessagingPage() {
  return (
    <UnifiedAuthGuard requiredRole="student">
      <StudentMessagingContent />
    </UnifiedAuthGuard>
  )
}
