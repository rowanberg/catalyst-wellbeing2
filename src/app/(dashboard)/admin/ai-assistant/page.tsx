'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Send, Bot, User, Sparkles, TrendingUp, Users, GraduationCap,
  Calendar, Activity, BarChart3, Brain, Loader2, Copy, Check,
  Plus, History, Menu, X, Shield, TrendingDown, AlertCircle,
  Building2, ChevronRight, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIMessageRenderer } from '@/components/shared/AIMessageRenderer'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

interface QuickPrompt {
  icon: React.ElementType
  label: string
  prompt: string
  category: 'performance' | 'wellbeing' | 'operations'
}

// LocalStorage helpers
const SESSIONS_KEY = 'catalyst_admin_chat_sessions'
const RETENTION_MONTHS = 12

const loadSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(SESSIONS_KEY)
    if (!stored) return []
    
    const sessions: ChatSession[] = JSON.parse(stored)
    const retentionDate = new Date()
    retentionDate.setMonth(retentionDate.getMonth() - RETENTION_MONTHS)
    
    const validSessions = sessions.filter(session => {
      const sessionDate = new Date(session.createdAt)
      return sessionDate > retentionDate
    })
    
    if (validSessions.length !== sessions.length) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions))
    }
    
    return validSessions
  } catch (error) {
    console.error('Failed to load sessions:', error)
    return []
  }
}

const saveSessions = (sessions: ChatSession[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('Failed to save sessions:', error)
  }
}

const generateSessionTitle = (firstMessage: string): string => {
  const cleaned = firstMessage.trim().split(/[.!?\n]/)[0]
  return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned || 'New Analysis'
}

export default function AIAssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [analysisContext, setAnalysisContext] = useState<'performance' | 'wellbeing' | 'operations' | 'general'>('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const quickPrompts: QuickPrompt[] = [
    {
      icon: TrendingUp,
      label: 'Performance Trends',
      prompt: 'Analyze overall school performance trends for the current semester',
      category: 'performance'
    },
    {
      icon: Activity,
      label: 'Wellbeing Analysis',
      prompt: 'Show me student wellbeing and mood patterns this month',
      category: 'wellbeing'
    },
    {
      icon: GraduationCap,
      label: 'Academic Insights',
      prompt: 'What are the top performing subjects and areas needing improvement?',
      category: 'performance'
    },
    {
      icon: Users,
      label: 'Teacher Metrics',
      prompt: 'Provide teacher performance metrics and engagement analysis',
      category: 'operations'
    },
    {
      icon: Calendar,
      label: 'Attendance Patterns',
      prompt: 'Analyze attendance patterns and identify concerning trends',
      category: 'operations'
    },
    {
      icon: BarChart3,
      label: 'Action Items',
      prompt: 'What are the most critical action items for school improvement?',
      category: 'operations'
    },
    {
      icon: AlertCircle,
      label: 'Risk Assessment',
      prompt: 'Identify students at risk and recommend intervention strategies',
      category: 'wellbeing'
    },
    {
      icon: TrendingDown,
      label: 'Declining Performance',
      prompt: 'Show classes or students with declining academic performance',
      category: 'performance'
    }
  ]

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load sessions from localStorage
  useEffect(() => {
    const loadedSessions = loadSessions()
    setSessions(loadedSessions)
    
    if (loadedSessions.length === 0) {
      const welcomeSession: ChatSession = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Welcome',
        messages: [{
          id: '1',
          role: 'assistant',
          content: `# School Intelligence Assistant

Welcome to Catalyst's AI-powered analytics platform. I can help you analyze and optimize every aspect of your school's performance.

## Quick Analysis Options

**📈 Academic Performance**
- Grade distributions and trends
- Subject-specific insights
- Student progress tracking

**💙 Student Wellbeing**
- Behavioral patterns
- Engagement metrics
- Risk identification

**⚙️ Operations**
- Attendance analysis
- Teacher performance
- Resource optimization

Select a quick prompt or ask me anything about your school data.`,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setSessions([welcomeSession])
      setCurrentSessionId(welcomeSession.id)
      setMessages(welcomeSession.messages)
    } else {
      const mostRecent = loadedSessions[0]
      setCurrentSessionId(mostRecent.id)
      setMessages(mostRecent.messages)
    }
  }, [])

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions)
    }
  }, [sessions])

  // Update current session when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: messages,
            updatedAt: new Date().toISOString(),
            title: session.title === 'New Analysis' && messages[0]?.role === 'user'
              ? generateSessionTitle(messages[0].content)
              : session.title
          }
        }
        return session
      }))
    }
  }, [messages, currentSessionId])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          context: analysisContext,
          stream: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulatedContent += parsed.content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ))
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = `❌ I apologize, but I encountered an error while processing your request.

**Error**: ${error instanceof Error ? error.message : 'Unknown error'}

Please ensure:
- You have admin access
- The Gemini API key is configured
- Your school data is properly set up

Try again or contact support if the issue persists.`
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: errorMessage }
          : msg
      ))
      setIsLoading(false)
    } finally {
      inputRef.current?.focus()
    }
  }

  const handleQuickPrompt = (prompt: string, category: 'performance' | 'wellbeing' | 'operations') => {
    setInput(prompt)
    setAnalysisContext(category)
    inputRef.current?.focus()
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Analysis',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
    setShowHistory(false)
    setIsMobileSidebarOpen(false)
  }

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setShowHistory(false)
      setIsMobileSidebarOpen(false)
    }
  }

  const copyMessage = useCallback((messageId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessage(messageId)
    setTimeout(() => setCopiedMessage(null), 2000)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">School Intelligence Assistant</h1>
                <p className="text-xs text-slate-500">AI-powered analytics platform</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="hidden lg:flex"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              onClick={createNewSession}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat History (Desktop) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden lg:block w-72 bg-white border-r border-slate-200 flex-shrink-0"
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Analysis History</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">{sessions.length} sessions</p>
              </div>
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-2 space-y-1">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => switchSession(session.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        currentSessionId === session.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-slate-50 border border-transparent"
                      )}
                    >
                      <div className="font-medium text-sm text-slate-800 truncate">
                        {session.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {session.messages.length} messages
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl"
              >
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">Analysis History</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">{sessions.length} sessions</p>
                </div>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <div className="p-2 space-y-1">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => switchSession(session.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          currentSessionId === session.id
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-slate-50 border border-transparent"
                        )}
                      >
                        <div className="font-medium text-sm text-slate-800 truncate">
                          {session.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    "flex-1 max-w-2xl",
                    message.role === 'user' && "flex justify-end"
                  )}>
                    <div className={cn(
                      "rounded-2xl p-4",
                      message.role === 'user'
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : "bg-white border border-slate-200 shadow-sm"
                    )}>
                      {message.role === 'assistant' ? (
                        <AIMessageRenderer
                          content={message.content}
                          accentColor="blue"
                          theme="light"
                          showCopyButton={true}
                        />
                      ) : (
                        <p className="text-white whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700">
                        <User className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-2xl">
                    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-blue-100 animate-pulse"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 mb-1">
                            Analyzing School Data
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs text-slate-600">Processing insights</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about school performance, student wellbeing, or operational insights..."
                  className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[52px] max-h-32"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-[52px] px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Prompts */}
        <div className="hidden xl:block w-80 bg-white border-l border-slate-200 flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-slate-800 mb-4">Quick Analysis</h3>
            
            <div className="space-y-6">
              {['performance', 'wellbeing', 'operations'].map((category) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {quickPrompts
                      .filter(p => p.category === category)
                      .map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickPrompt(prompt.prompt, prompt.category)}
                          className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "p-1.5 rounded-lg flex-shrink-0",
                              category === 'performance' && "bg-blue-100 text-blue-600",
                              category === 'wellbeing' && "bg-purple-100 text-purple-600",
                              category === 'operations' && "bg-slate-100 text-slate-600"
                            )}>
                              <prompt.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-800 group-hover:text-blue-700">
                                {prompt.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {prompt.prompt}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Card */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Session Info</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Sessions:</span>
                  <span className="font-medium">{sessions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
