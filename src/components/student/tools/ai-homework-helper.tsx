'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Brain, 
  Send, 
  BookOpen, 
  Calculator,
  FileText,
  Image as ImageIcon,
  X,
  Zap,
  HelpCircle,
  Lightbulb,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Mic,
  Camera,
  Paperclip,
  Trophy,
  TrendingUp,
  Star,
  AlertCircle,
  History,
  Bookmark,
  Code,
  Globe,
  Beaker,
  PenTool
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  subject?: string
  imageData?: string
}

interface QuickPrompt {
  id: string
  text: string
  icon: any
  category: string
}

interface StudyTip {
  subject: string
  tip: string
  effectiveness: number
}

export function AIHomeworkHelper({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('Mathematics')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [voiceMode, setVoiceMode] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [helpCount, setHelpCount] = useState(0)
  const [accuracy, setAccuracy] = useState(85)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([])
  const [messageLoadCount, setMessageLoadCount] = useState(20) // Load 20 messages at a time
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profile = useAppSelector((state) => state.auth.user)

  const getStorageKey = useCallback(() => {
    return `ai_homework_chat_${profile?.id || 'guest'}`
  }, [profile?.id])

  // Load messages on mount
  useEffect(() => {
    if (!profile?.id) return

    const storageKey = `ai_homework_chat_${profile.id}`
    const savedMessages = localStorage.getItem(storageKey)
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed)
        setHasInitialized(true)
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } catch (error) {
        console.error('Error parsing saved messages:', error)
      }
    } else {
      // Show welcome message for new users
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: `Hi! I'm your AI Homework Helper. I'm here to guide you through your ${selectedSubject} assignments and help you understand concepts better. What would you like to work on today?`,
          timestamp: new Date().toISOString(),
          subject: selectedSubject
        }
      ])
      setHasInitialized(true)
    }
  }, [profile?.id, selectedSubject])

  // Lazy load messages - show last N messages
  useEffect(() => {
    if (messages.length <= messageLoadCount) {
      setDisplayedMessages(messages)
    } else {
      // Show most recent messages
      setDisplayedMessages(messages.slice(-messageLoadCount))
    }
  }, [messages, messageLoadCount])

  // Load more messages when scrolling to top
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop } = messagesContainerRef.current
    
    // If scrolled near top and there are more messages to load
    if (scrollTop < 100 && displayedMessages.length < messages.length) {
      setMessageLoadCount(prev => prev + 20)
    }
  }, [displayedMessages.length, messages.length])

  useEffect(() => {
    if (!profile?.id) return
    if (messages.length === 0) return

    const storageKey = getStorageKey()
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
      console.log('Messages saved to localStorage:', storageKey, messages.length)
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }, [messages, profile?.id, getStorageKey])

  useEffect(() => {
    if (!profile?.id) return

    const currentKey = getStorageKey()
    const allKeys = Object.keys(localStorage)
    
    allKeys.forEach(key => {
      if (key.startsWith('ai_homework_chat_') && key !== currentKey) {
        localStorage.removeItem(key)
      }
    })
  }, [profile?.id, getStorageKey])

  const subjects = [
    { name: 'Mathematics', icon: Calculator, color: 'blue' },
    { name: 'Science', icon: Beaker, color: 'green' },
    { name: 'English', icon: PenTool, color: 'purple' },
    { name: 'History', icon: BookOpen, color: 'orange' },
    { name: 'Computer Science', icon: Code, color: 'cyan' },
    { name: 'Geography', icon: Globe, color: 'emerald' }
  ]

  const quickPrompts: QuickPrompt[] = [
    { id: '1', text: "Explain this concept", icon: Lightbulb, category: 'explain' },
    { id: '2', text: "Show me examples", icon: BookOpen, category: 'example' },
    { id: '3', text: "Step-by-step solution", icon: Target, category: 'solve' },
    { id: '4', text: "Check my answer", icon: CheckCircle2, category: 'check' },
    { id: '5', text: "Practice problems", icon: Brain, category: 'practice' },
    { id: '6', text: "Related topics", icon: Sparkles, category: 'explore' }
  ]

  const studyTips: StudyTip[] = [
    { subject: 'Mathematics', tip: 'Break complex problems into smaller steps', effectiveness: 92 },
    { subject: 'Science', tip: 'Draw diagrams to visualize concepts', effectiveness: 88 },
    { subject: 'English', tip: 'Read passages twice before answering', effectiveness: 85 }
  ]

  // This effect is no longer needed - welcome message is handled in the load effect above

  // Optimized functions with useCallback
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() && !selectedImage) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      subject: selectedSubject,
      imageData: selectedImage || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSelectedImage(null)
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're working on ${selectedSubject}. Let me help you break this down step by step. ${selectedImage ? 'I can see the image you shared - ' : ''}Here's how we can approach this problem...`,
        timestamp: new Date().toISOString(),
        subject: selectedSubject
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000)
  }, [inputMessage, selectedImage, selectedSubject])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const removeImage = useCallback(() => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Timer for session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0f0a] overflow-hidden">
      {/* Top Bar - Responsive */}
      <motion.div
        className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-b border-green-500/10 bg-[#0a0f0a] z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">AI Homework Helper</h1>
              <p className="text-xs text-green-400 truncate">{selectedSubject}</p>
            </div>
          </div>
          
          {/* Subject Selector - Responsive */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {subjects.map((subject) => {
              const Icon = subject.icon
              return (
                <Button
                  key={subject.name}
                  onClick={() => setSelectedSubject(subject.name)}
                  size="sm"
                  variant="ghost"
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs transition-all ${
                    selectedSubject === subject.name
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden md:inline">{subject.name}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Messages Area - Responsive */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
          {displayedMessages.length < messages.length && (
            <div className="text-center py-2">
              <button
                onClick={() => setMessageLoadCount(prev => prev + 20)}
                className="text-white/60 hover:text-white text-sm"
              >
                Load {Math.min(20, messages.length - displayedMessages.length)} older messages
              </button>
            </div>
          )}
          
          {displayedMessages.length === 0 && (
            <motion.div
              className="text-center py-12 sm:py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-green-500/30">
                <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 px-4">How can I help you today?</h2>
              <p className="text-white/50 text-sm sm:text-lg px-4">Ask me anything about your homework</p>
            </motion.div>
          )}
          
          {displayedMessages.map((message, index) => (
            <motion.div
              key={message.id}
              className="flex gap-3 sm:gap-5 group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 pt-1">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'
                }`}>
                  {message.type === 'user' ? (
                    <span className="text-white text-[10px] sm:text-xs font-bold">You</span>
                  ) : (
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 space-y-2 sm:space-y-3 pb-2 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {message.type === 'user' ? 'You' : 'AI Helper'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/30">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {message.imageData && (
                  <img 
                    src={message.imageData} 
                    alt="Uploaded" 
                    className="max-w-full sm:max-w-md rounded-lg sm:rounded-xl border border-green-500/20 shadow-lg"
                  />
                )}
                
                <div className="text-white/90 text-sm sm:text-base leading-relaxed break-words">
                  {message.content}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              className="flex gap-3 sm:gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex-shrink-0 pt-1">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2 sm:space-y-3 pb-2">
                <span className="text-xs sm:text-sm font-semibold text-white block">AI Helper</span>
                <div className="flex space-x-1 sm:space-x-1.5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Responsive - Safe Area for Mobile Keyboards */}
      <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-5 border-t border-green-500/10 bg-[#0a0f0a] z-10 safe-bottom">
        <div className="max-w-5xl mx-auto">
          {selectedImage && (
            <div className="mb-3 sm:mb-4 relative inline-block">
              <img src={selectedImage} alt="Preview" className="h-16 sm:h-24 w-auto rounded-lg sm:rounded-xl border border-green-500/20 shadow-lg" />
              <Button
                onClick={() => setSelectedImage(null)}
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          )}
          
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                onFocus={(e) => {
                  // Scroll input into view when keyboard appears on mobile
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }, 300)
                }}
                placeholder="Message AI Homework Helper..."
                className="w-full bg-white/5 border-green-500/20 text-white placeholder:text-white/40 pr-20 sm:pr-24 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg sm:rounded-xl transition-all"
                >
                  <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  onClick={() => setVoiceMode(!voiceMode)}
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg sm:rounded-xl transition-all ${
                    voiceMode 
                      ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30' 
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() && !selectedImage}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
