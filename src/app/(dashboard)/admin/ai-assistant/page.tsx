'use client'

export const dynamic = 'force-dynamic'
// Fast Refresh: v1.0.2

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send, Bot, User, Sparkles, Home, BarChart3, Users, Settings,
  MessageSquare, Mic, Plus, Moon, Sun, Menu, X, Clock, History,
  AlertCircle, CheckCircle2, Loader2, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIMessageRenderer } from '@/components/shared/AIMessageRenderer'
import { toast } from 'sonner'

// ============================================
// THINKING INDICATOR (ChatGPT-style Multi-Stage)
// ============================================

const ThinkingIndicator = memo(({ action, stage = 'thinking' }: { action?: string, stage?: 'thinking' | 'analyzing' | 'processing' | 'formatting' }) => {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Map tool names to user-friendly actions with stage progression
  const getActionText = (toolName?: string, currentStage?: string) => {
    if (!toolName) {
      // Generic stages
      if (currentStage === 'thinking') return 'Thinking'
      if (currentStage === 'processing') return 'Processing request'
      if (currentStage === 'formatting') return 'Formatting response'
      return 'Thinking'
    }

    // Tool-specific messages with stages
    const toolMessages: Record<string, Record<string, string>> = {
      'get_wellbeing_severity': {
        analyzing: 'Analyzing student wellbeing data',
        processing: 'Evaluating risk levels',
        formatting: 'Preparing wellbeing report'
      },
      'student_search': {
        analyzing: 'Searching student database',
        processing: 'Filtering student records',
        formatting: 'Organizing results'
      },
      'get_today_attendance': {
        analyzing: 'Checking today\'s attendance',
        processing: 'Calculating attendance metrics',
        formatting: 'Preparing attendance summary'
      },
      'get_attendance_by_date': {
        analyzing: 'Retrieving attendance records',
        processing: 'Analyzing attendance patterns',
        formatting: 'Compiling attendance report'
      },
      'get_class_details': {
        analyzing: 'Loading class information',
        processing: 'Gathering class data',
        formatting: 'Organizing class details'
      },
      'send_school_broadcast': {
        analyzing: 'Preparing announcement',
        processing: 'Validating broadcast content',
        formatting: 'Ready to send'
      },
      'get_help_requests': {
        analyzing: 'Fetching help requests',
        processing: 'Prioritizing requests',
        formatting: 'Organizing help queue'
      },
      'get_school_stats': {
        analyzing: 'Gathering school statistics',
        processing: 'Computing metrics',
        formatting: 'Preparing statistics report'
      },
      'get_student_profile': {
        analyzing: 'Loading student profile',
        processing: 'Gathering student data',
        formatting: 'Organizing profile details'
      },
      'list_students': {
        analyzing: 'Listing students',
        processing: 'Filtering student records',
        formatting: 'Organizing student list'
      },
      'get_teacher_timetable': {
        analyzing: 'Checking timetable',
        processing: 'Retrieving schedule data',
        formatting: 'Preparing timetable view'
      },
    }

    const messages = toolMessages[toolName]
    if (messages && currentStage) {
      return messages[currentStage] || messages.analyzing || 'Processing'
    }

    return currentStage === 'analyzing' ? 'Processing request' : 'Working on it'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 dark:bg-muted/20 border border-border/40 max-w-fit"
    >
      <div className="flex gap-1.5">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 rounded-full bg-accent"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          className="w-2 h-2 rounded-full bg-accent"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
          className="w-2 h-2 rounded-full bg-accent"
        />
      </div>
      <span className="text-sm text-muted-foreground font-medium">
        {getActionText(action, stage)}{dots}
      </span>
    </motion.div>
  )
})
ThinkingIndicator.displayName = 'ThinkingIndicator'

// ============================================
// TYPES
// ============================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
  toolName?: string  // Track which tool is being used
  stage?: 'thinking' | 'analyzing' | 'processing' | 'formatting'  // Current processing stage
  confirmationRequest?: ConfirmationRequest  // Pending confirmation
  confirmationId?: string  // ID needed to approve the confirmation
}

interface ConfirmationRequest {
  action: string
  target: string
  changes: Array<{ field: string; oldValue: any; newValue: any }>
  warning?: string
  pendingAction: any
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_CONTEXT_MESSAGES = 20  // Extended for longer conversations

// Admin-specific suggestions (exactly 8 like in image)
const SUGGESTIONS = [
  "Show school statistics",
  "List at-risk students",
  "Analyze wellbeing trends",
  "View help requests",
  "Export user report",
  "Check active sessions",
  "Attendance overview",
  "Create announcement"
]

// ============================================
// UTILITY FUNCTIONS (API-BASED)
// ============================================

// Fetch sessions from server API
const fetchSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch('/api/admin/chat-sessions')
    if (!response.ok) {
      console.error('Failed to fetch sessions:', response.status)
      return []
    }
    const data = await response.json()
    // Transform API response to ChatSession format
    return (data.sessions || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      messages: [], // Messages loaded on demand
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }))
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
}

// Load session messages from server
const fetchSessionMessages = async (sessionId: string): Promise<Message[]> => {
  try {
    const response = await fetch(`/api/admin/chat-sessions/${sessionId}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.session?.messages || []
  } catch (error) {
    console.error('Error fetching session messages:', error)
    return []
  }
}

// Create a new session on server
const createSession = async (title: string, messages: Message[]): Promise<string | null> => {
  try {
    const response = await fetch('/api/admin/chat-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, messages })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.session?.id || null
  } catch (error) {
    console.error('Error creating session:', error)
    return null
  }
}

// Add messages to existing session
const addMessagesToSession = async (sessionId: string, messages: Message[]): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/chat-sessions/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    })
    return response.ok
  } catch (error) {
    console.error('Error adding messages:', error)
    return false
  }
}

// Delete session from server
const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/chat-sessions/${sessionId}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Error deleting session:', error)
    return false
  }
}

// ============================================
// MEMOIZED COMPONENTS
// ============================================

const StreamingText = memo(({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (!text) return

    setDisplayedText('')
    let cancelled = false

    // Split into words for more natural streaming
    const words = text.split(' ')
    let currentWordIndex = 0
    let currentCharIndex = 0
    let accumulatedText = ''

    const CHARS_PER_FRAME = 2 // Stream 2 characters per frame for ultra-smooth effect
    const TARGET_FPS = 60 // Target 60fps for buttery smooth animation
    const targetFrameTime = 1000 / TARGET_FPS

    const animate = (timestamp: number) => {
      if (cancelled) return

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current

      // Stream characters
      if (currentWordIndex < words.length) {
        const currentWord = words[currentWordIndex]
        const targetChars = currentWord.slice(0, currentCharIndex + CHARS_PER_FRAME)

        if (currentCharIndex < currentWord.length) {
          currentCharIndex += CHARS_PER_FRAME
          accumulatedText = words.slice(0, currentWordIndex).join(' ') +
            (currentWordIndex > 0 ? ' ' : '') +
            targetChars
          setDisplayedText(accumulatedText)
        } else {
          // Move to next word
          currentWordIndex++
          currentCharIndex = 0
          accumulatedText = words.slice(0, currentWordIndex).join(' ')
          if (currentWordIndex < words.length) {
            accumulatedText += ' '
          }
          setDisplayedText(accumulatedText)
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelled = true
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      startTimeRef.current = undefined
    }
  }, [text])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 530) // Slightly faster blink for more responsiveness

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <span className="inline-block">
      {displayedText}
      {cursorVisible && text !== displayedText && (
        <span className="inline-block w-[2px] h-[1.1em] bg-foreground ml-1 -mb-[0.1em] align-middle" />
      )}
    </span>
  )
})
StreamingText.displayName = 'StreamingText'

const MessageBubble = memo(({ message, onConfirm, onCancel }: {
  message: Message
  onConfirm: (id: string, request: ConfirmationRequest, confirmationId: string) => void
  onCancel: (id: string) => void
}) => {
  const isUser = message.role === 'user'

  // Debug: Log confirmation data
  if (message.role === 'assistant') {
    console.log(`🎨 MessageBubble rendering msg ${message.id}:`, {
      hasConfirmation: !!message.confirmationRequest,
      contentLength: message.content?.length
    })
    if (message.confirmationRequest) {
      console.log('   ✅ Confirmation request present:', message.confirmationRequest)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "px-4",
        isUser ? "py-3" : "py-6"
      )}
    >
      <div className="max-w-3xl mx-auto">
        {isUser ? (
          /* User message - smooth rounded container like Copilot */
          <div className="flex justify-end">
            <div className="inline-block max-w-[85%] px-4 py-2.5 rounded-2xl bg-muted dark:bg-muted/40">
              <p className="text-[15px] leading-relaxed text-foreground font-normal">
                {message.content}
              </p>
            </div>
          </div>
        ) : (
          /* AI message - clean text or thinking indicator */
          <div className="text-[15px] leading-relaxed text-foreground">
            {message.isStreaming && !message.content ? (
              <ThinkingIndicator action={message.toolName} stage={message.stage} />
            ) : message.isStreaming ? (
              <StreamingText text={message.content} />
            ) : (
              <AIMessageRenderer content={message.content} />
            )}
          </div>
        )}
        {/* Confirmation Dialog */}
        {message.role === 'assistant' && message.confirmationRequest && (
          <ConfirmationDialog
            confirmation={message.confirmationRequest}
            onAccept={() => onConfirm(message.id, message.confirmationRequest!, message.confirmationId!)}
            onDecline={() => onCancel(message.id)}
            isProcessing={false}
          />
        )}
      </div>
    </motion.div>
  )
})
MessageBubble.displayName = 'MessageBubble'

const SuggestionPill = memo(({ suggestion, onClick }: {
  suggestion: string
  onClick: (text: string) => void
}) => (
  <button
    onClick={() => onClick(suggestion)}
    className="px-4 py-2.5 rounded-full border border-border/60 bg-transparent hover:bg-muted/50 text-[13px] font-normal text-foreground/90 whitespace-nowrap transition-all hover:border-border"
  >
    {suggestion}
  </button>
))
SuggestionPill.displayName = 'SuggestionPill'

// ============================================
// CONFIRMATION DIALOG COMPONENT  
// ============================================

// ============================================
// CONFIRMATION DIALOG COMPONENT  
// ============================================

const ConfirmationDialog = memo(({ confirmation, onAccept, onDecline, isProcessing }: {
  confirmation: ConfirmationRequest
  onAccept: () => void
  onDecline: () => void
  isProcessing: boolean
}) => {
  const [showDetails, setShowDetails] = useState(false)

  console.log('🛡️ ConfirmationDialog mounted:', {
    action: confirmation.action,
    target: confirmation.target,
    changesCount: confirmation.changes?.length
  })

  return (
    <div className="mt-2 flex flex-col gap-2 w-full max-w-md">
      <div className="flex items-center justify-between gap-2 p-2 pl-3 pr-2 rounded-xl bg-indigo-50/80 border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-indigo-900 truncate">
              Confirm Action
            </span>
            <span className="text-[11px] text-indigo-600/80 truncate">
              {confirmation.action}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/50"
          >
            <span className="hidden sm:inline">{showDetails ? 'Hide' : 'Details'}</span>
            <span className="sm:hidden"><ChevronRight className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-90")} /></span>
          </Button>
          <div className="w-px h-4 bg-indigo-200 mx-1" />
          <Button
            onClick={onDecline}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
            disabled={isProcessing}
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={onAccept}
            size="sm"
            className="h-7 px-3 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg ml-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Approve'
            )}
          </Button>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-xs space-y-2 ml-1">
              <div className="grid grid-cols-[60px_1fr] gap-2">
                <span className="text-slate-500">Target:</span>
                <span className="font-medium text-slate-900">{confirmation.target}</span>
              </div>
              {confirmation.changes.length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-500 block mb-1">Changes:</span>
                  {confirmation.changes.map((change, idx) => (
                    <div key={idx} className="pl-2 border-l-2 border-indigo-100 py-0.5">
                      <span className="text-slate-500">{change.field}: </span>
                      <span className="font-medium text-slate-900">{String(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              )}
              {confirmation.warning && (
                <div className="flex gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{confirmation.warning}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
ConfirmationDialog.displayName = 'ConfirmationDialog'

// ============================================
// EXPANDABLE ICON SIDEBAR COMPONENT
// ============================================

const IconOnlySidebar = memo(({
  onNewChat,
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  isMobileOpen,
  onMobileClose,
  showHistory,
  onHistoryToggle
}: {
  onNewChat: () => void
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (id: string) => void
  onSessionDelete: (id: string) => void
  isMobileOpen: boolean
  onMobileClose: () => void
  showHistory: boolean
  onHistoryToggle: () => void
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', onClick: onNewChat },
    { icon: BarChart3, label: 'Analytics', onClick: () => { } },
    { icon: Users, label: 'Students', onClick: () => { } },
    { icon: MessageSquare, label: 'Messages', onClick: () => { } },
    { icon: History, label: 'History', onClick: onHistoryToggle },
    { icon: Settings, label: 'Settings', onClick: () => { } },
  ]

  return (
    <>
      {/* Mobile overlay - Full screen */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Expandable sidebar - Full width on mobile, hidden by default */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : (isExpanded ? 0 : 0),
          width: isMobileOpen ? '85%' : (isExpanded ? 220 : 56)
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onMouseEnter={() => !isMobileOpen && setIsExpanded(true)}
        onMouseLeave={() => !isMobileOpen && setIsExpanded(false)}
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-card border-r border-border flex flex-col py-4 overflow-hidden",
          // Mobile: completely hidden unless menu is open, higher z-index when open
          isMobileOpen ? "z-[70] shadow-2xl" : "hidden lg:flex lg:z-10"
        )}
      >
        {/* Logo/Brand - Always show text on mobile */}
        <div className="px-3 mb-6">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors">
              <Sparkles className="h-5 w-5 text-accent shrink-0" />
              <AnimatePresence>
                {(isExpanded || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-semibold text-foreground whitespace-nowrap overflow-hidden"
                  >
                    Catalyst AI
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {/* Close button - mobile only */}
            {isMobileOpen && (
              <Button variant="ghost" size="sm" onClick={onMobileClose} className="lg:hidden">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2.5 hover:bg-muted rounded-lg transition-colors group",
                item.icon === History && showHistory && "bg-muted"
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-muted-foreground group-hover:text-foreground whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <div className="px-2 mt-auto">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-2.5 py-2.5 hover:bg-muted rounded-lg transition-colors group"
            title={!isExpanded ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm text-muted-foreground group-hover:text-foreground whitespace-nowrap overflow-hidden"
                >
                  {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-14 lg:left-14 top-0 h-screen w-80 bg-card border-r border-border z-40 flex flex-col shadow-xl"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Chat History</h2>
              <Button variant="ghost" size="sm" onClick={onHistoryToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No chat history yet
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-all",
                        currentSessionId === session.id && "bg-accent/10 border-accent/50"
                      )}
                      onClick={() => {
                        onSessionSelect(session.id)
                        onHistoryToggle()
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(session.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.messages.length} messages
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSessionDelete(session.id)
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})
IconOnlySidebar.displayName = 'IconOnlySidebar'

// ============================================
// MAIN COMPONENT
// ============================================

export default function AIAssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<{ messageId: string; confirmation: ConfirmationRequest } | null>(null)
  const [isConfirmationProcessing, setIsConfirmationProcessing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions from API on mount
  useEffect(() => {
    const loadFromServer = async () => {
      setIsLoadingSessions(true)
      try {
        const loaded = await fetchSessions()
        setSessions(loaded.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
        // Load messages for the most recent session if exists
        if (loaded.length > 0 && !currentSessionId) {
          setCurrentSessionId(loaded[0].id)
          const sessionMessages = await fetchSessionMessages(loaded[0].id)
          setMessages(sessionMessages)
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
      } finally {
        setIsLoadingSessions(false)
      }
    }
    loadFromServer()
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message with extended context
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantId = `assistant-${Date.now()}`
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      stage: 'thinking'
    }])

    // Auto-progress through stages
    const stageTimer1 = setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, stage: 'analyzing' as const } : m
      ))
    }, 800) // After 800ms, move to analyzing
    let stageTimer2: NodeJS.Timeout | null = null

    try {
      // Convert history to Gemini format: {role, parts[{text}]} with 'model' instead of 'assistant'
      const contextMessages = messages.slice(-MAX_CONTEXT_MESSAGES).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const response = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory: contextMessages,
          stream: false // Temporarily disabled - using non-streaming path with MCP tools
        })
      })

      if (!response.ok) throw new Error('Failed')

      // Check if response is streaming or JSON
      const contentType = response.headers.get('content-type')
      const isStreaming = contentType?.includes('text/event-stream')

      if (!isStreaming) {
        // Handle non-streaming JSON response
        const data = await response.json()

        console.log('📥 Frontend received API response:', {
          hasConfirmation: !!data.confirmationRequest,
          confirmationData: data.confirmationRequest
        })

        if (data.confirmationRequest) {
          console.log('🔔 Setting confirmation request in state for message:', assistantId)
        }

        clearTimeout(stageTimer1)
        if (stageTimer2) clearTimeout(stageTimer2)

        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? {
              ...m,
              content: data.response,
              isStreaming: false,
              stage: undefined,
              toolName: undefined,
              confirmationRequest: data.confirmationRequest, // Capture confirmation request
              confirmationId: data.confirmationId // Capture confirmation ID
            }
            : m
        ))
        setIsLoading(false)
        return
      }

      // Streaming response handling
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let currentToolName = ''
      let hasStartedContent = false

      // Move to processing stage when we start getting data
      stageTimer2 = setTimeout(() => {
        if (!hasStartedContent) {
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, stage: 'processing' as const } : m
          ))
        }
      }, 2000)

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              // Handle function calls - move to analyzing/processing
              if (data.type === 'function_call' && data.name) {
                currentToolName = data.name
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, toolName: currentToolName, stage: 'processing' as const } : m
                ))
              }

              // Handle content - move to formatting then start showing
              if (data.content) {
                if (!hasStartedContent) {
                  hasStartedContent = true
                  clearTimeout(stageTimer2)
                  // Brief formatting stage before showing content
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, stage: 'formatting' as const } : m
                  ))
                  await new Promise(resolve => setTimeout(resolve, 400))
                }

                fullText += data.content
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullText, toolName: undefined, stage: undefined } : m
                ))
              }
            } catch { }
          }
        }
      }

      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)

      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, isStreaming: false } : m
      ))

      // Create or update session via API
      const messagesToSave = [userMessage, {
        id: assistantId,
        role: 'assistant' as const,
        content: fullText,
        timestamp: new Date().toISOString()
      }]

      if (!currentSessionId) {
        // Create new session on server
        const title = content.slice(0, 60) + (content.length > 60 ? '...' : '')
        const newSessionId = await createSession(title, messagesToSave)
        if (newSessionId) {
          const newSession: ChatSession = {
            id: newSessionId,
            title,
            messages: [...messages, ...messagesToSave],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          setSessions(prev => [newSession, ...prev])
          setCurrentSessionId(newSessionId)
        }
      } else {
        // Add messages to existing session
        await addMessagesToSession(currentSessionId, messagesToSave)
        // Update local state
        setSessions(prev => prev.map(s =>
          s.id === currentSessionId
            ? { ...s, messages: [...messages, ...messagesToSave], updatedAt: new Date().toISOString() }
            : s
        ))
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, currentSessionId, sessions])

  const handleNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    setIsMobileSidebarOpen(false)
    setShowHistory(false)
  }

  const handleSessionSelect = useCallback(async (id: string) => {
    setCurrentSessionId(id)
    // Fetch messages from API
    const sessionMessages = await fetchSessionMessages(id)
    setMessages(sessionMessages)
  }, [])

  const handleSessionDelete = useCallback(async (id: string) => {
    // Delete from server first
    const success = await deleteSession(id)
    if (success) {
      setSessions(prev => prev.filter(s => s.id !== id))
      if (currentSessionId === id) {
        setMessages([])
        setCurrentSessionId(null)
      }
    } else {
      toast.error('Failed to delete session')
    }
  }, [currentSessionId])

  const handleHistoryToggle = () => {
    setShowHistory(prev => !prev)
  }

  const handleConfirm = useCallback(async (messageId: string, request: ConfirmationRequest, confirmationId: string) => {
    setIsConfirmationProcessing(true)

    // Add user confirmation message
    const confirmMsgId = `user-confirm-${Date.now()}`
    setMessages(prev => [...prev, {
      id: confirmMsgId,
      role: 'user',
      content: 'Confirmed',
      timestamp: new Date().toISOString()
    }])

    try {
      // Call API with confirmation ID
      const response = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationId // Send the confirmation ID to execute the pending action
        })
      })

      if (!response.ok) throw new Error('Failed to confirm')

      const data = await response.json()

      // Add AI response
      setMessages(prev => [...prev, {
        id: `assistant-confirm-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }])

      // Remove confirmation request from the original message to prevent re-clicking
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, confirmationRequest: undefined }
          : m
      ))

    } catch (error) {
      console.error('Confirmation error:', error)
      toast.error('Failed to process confirmation')
    } finally {
      setIsConfirmationProcessing(false)
    }
  }, [])

  const handleCancel = useCallback((messageId: string) => {
    // Remove confirmation request
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, confirmationRequest: undefined }
        : m
    ))

    // Add cancellation message
    setMessages(prev => [...prev, {
      id: `system-cancel-${Date.now()}`,
      role: 'assistant',
      content: '❌ Action cancelled.',
      timestamp: new Date().toISOString()
    }])
  }, [])

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Icon-only sidebar - Desktop */}
      <IconOnlySidebar
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionDelete={handleSessionDelete}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        showHistory={showHistory}
        onHistoryToggle={handleHistoryToggle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile header - Fixed at top */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-semibold text-sm text-foreground">Catalyst AI</span>
          <button
            onClick={handleNewChat}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Messages area - Scrollable */}
        <ScrollArea className="flex-1">
          {isEmpty ? (
            <div className="flex flex-col justify-center min-h-[calc(100vh-280px)] px-6 lg:px-4">
              <h1 className="text-[28px] lg:text-[28px] font-normal text-foreground text-left lg:text-center leading-tight">
                Hey, nice to see you.<br className="lg:hidden" /> What's new?
              </h1>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area - Fixed at bottom */}
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm safe-bottom">
          <div className="max-w-3xl mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-3 lg:space-y-4">
            {/* Suggestion pills - Horizontal scroll on mobile */}
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {SUGGESTIONS.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-[13px] font-normal whitespace-nowrap flex-shrink-0",
                      "border border-border/60 bg-card text-foreground",
                      "shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]",
                      "hover:bg-muted/40 hover:border-border hover:text-foreground",
                      "hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]",
                      "dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]",
                      "dark:hover:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)]",
                      "transition-all duration-200 ease-out active:scale-95"
                    )}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Input container with Copilot-style shadow and focus effect */}
            <div className="relative group">
              <div className={cn(
                "rounded-3xl lg:rounded-3xl border border-border bg-card overflow-hidden transition-all duration-200",
                "shadow-[0_1px_2px_0_rgba(0,0,0,0.03),0_4px_8px_0_rgba(0,0,0,0.04)]",
                "dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.2),0_4px_12px_0_rgba(0,0,0,0.3)]",
                "hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.05),0_8px_16px_0_rgba(0,0,0,0.06)]",
                "dark:hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.3),0_8px_20px_0_rgba(0,0,0,0.4)]",
                "focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent/50"
              )}>
                <div className="flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3">
                  {/* Model selector with hover effect */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5 lg:mr-1.5" />
                    <span className="hidden sm:inline">Smart (GPT-2.0)</span>
                  </Button>

                  {/* Textarea with smooth transitions */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage(input)
                      }
                    }}
                    placeholder="Message Catalyst AI"
                    className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] placeholder:text-muted-foreground transition-all duration-150"
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                    rows={1}
                  />

                  {/* Voice button with hover effect */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 w-8 p-0 hover:bg-muted/50 transition-all duration-150"
                  >
                    <Mic className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
