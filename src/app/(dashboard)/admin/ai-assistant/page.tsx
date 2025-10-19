'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Loader2,
  BookOpen,
  Heart,
  Target,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ClientWrapper } from '@/components/providers/ClientWrapper'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    dataType?: string[]
    metrics?: any
  }
}

interface QuickPrompt {
  icon: React.ElementType
  label: string
  prompt: string
  color: string
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Initializing...')
  const [revealedMessages, setRevealedMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickPrompts: QuickPrompt[] = [
    {
      icon: TrendingUp,
      label: 'Performance Analysis',
      prompt: 'Analyze overall school performance trends for the current semester',
      color: 'bg-blue-600'
    },
    {
      icon: Activity,
      label: 'Student Wellbeing',
      prompt: 'Show me student wellbeing and mood patterns this month',
      color: 'bg-slate-600'
    },
    {
      icon: GraduationCap,
      label: 'Academic Insights',
      prompt: 'What are the top performing subjects and areas needing improvement?',
      color: 'bg-blue-700'
    },
    {
      icon: Users,
      label: 'Teacher Performance',
      prompt: 'Provide teacher performance metrics and engagement analysis',
      color: 'bg-slate-700'
    },
    {
      icon: Calendar,
      label: 'Attendance Patterns',
      prompt: 'Analyze attendance patterns and identify concerning trends',
      color: 'bg-blue-600'
    },
    {
      icon: BarChart3,
      label: 'Action Items',
      prompt: 'What are the most critical action items for school improvement?',
      color: 'bg-slate-600'
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mark message as revealed with smooth liquid effect
  const revealMessage = (messageId: string) => {
    setTimeout(() => {
      setRevealedMessages(prev => new Set(prev).add(messageId))
    }, 100)
  }

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: '1',
      role: 'assistant' as const,
      content: `# School Intelligence Assistant

An enterprise analytics platform providing real-time insights from your institution's comprehensive data ecosystem.

## Analytical Capabilities

### Academic Performance
- Grade distributions and trend analysis across subjects
- Assessment performance patterns and benchmarking
- Subject-specific strengths and improvement areas
- Student progress tracking and predictive analytics

### Student Wellbeing
- Emotional health metrics and behavioral patterns
- Engagement and motivation indicators
- Early intervention identification for at-risk students
- Wellness trend analysis

### Operational Intelligence
- Attendance patterns and absenteeism trends
- Teacher performance metrics and effectiveness analysis
- Class-level and institution-wide performance indicators
- Resource allocation recommendations

---

**Getting Started:** Select a quick analysis option below or enter a specific query about your school's performance metrics.

*For optimal results, provide specific parameters in your queries. Examples: "Analyze Mathematics performance trends for Grade 10" or "Identify students requiring wellbeing intervention support."*`,
      timestamp: new Date(),
      metadata: {
        dataType: ['welcome']
      }
    }
    setMessages([welcomeMessage])
    // Trigger reveal for welcome message
    revealMessage('1')
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setRevealedMessages(prev => new Set(prev).add(userMessage.id))
    setInput('')
    setIsLoading(true)
    setIsTyping(true)
    
    // Dynamic loading status updates
    setLoadingStatus('Authenticating request...')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setLoadingStatus('Fetching school data...')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    setLoadingStatus('Analyzing performance metrics...')

    try {
      const response = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          context: 'school_analytics'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }

      setLoadingStatus('Generating insights...')
      const data = await response.json()
      
      setLoadingStatus('Formatting response...')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Trigger smooth reveal for the new message
      revealMessage(assistantMessage.id)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ I apologize, but I encountered an error while processing your request.

**Error Details**: ${error instanceof Error ? error.message : 'Unknown error'}

Please ensure:
- You have admin access
- The Gemini API key is configured in the environment
- Your school data is properly set up

Try again or contact support if the issue persists.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const formatContent = (content: string) => {
    // Custom markdown renderer for professional formatting
    return (
      <div className="prose prose-sm md:prose-base max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 leading-tight border-l-4 border-blue-600 pl-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl md:text-2xl font-semibold mb-3 text-slate-800 border-b border-slate-200 pb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-slate-700 flex items-center">
                <span className="w-1 h-5 bg-blue-600 mr-3 rounded"></span>
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-slate-600 leading-relaxed text-base">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-1 space-y-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-1 space-y-2 list-decimal list-inside">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-slate-600 flex items-start text-base">
                <span className="text-blue-600 mr-3 text-sm">•</span>
                <span className="flex-1">{children}</span>
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-slate-600">{children}</em>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-600 pl-4 py-3 my-4 bg-slate-100 rounded-r">
                <div className="text-slate-700 font-medium">{children}</div>
              </blockquote>
            ),
            code: ({ node, className, children, ...props }) => {
              const isInline = !className
              return isInline ? (
                <code className="bg-slate-100 text-slate-800 text-sm px-2 py-0.5 rounded font-mono" {...props}>{children}</code>
              ) : (
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 border border-slate-700">
                  <code className="text-sm font-mono" {...props}>{children}</code>
                </pre>
              )
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-slate-100 border-b-2 border-slate-300">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-slate-200">{children}</tbody>
            ),
            th: ({ children }) => (
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100">{children}</th>
            ),
            td: ({ children }) => (
              <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{children}</td>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
            ),
            hr: () => (
              <hr className="my-6 border-t border-slate-200" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-2.5 md:p-3 bg-blue-600 rounded-lg shadow-sm">
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-semibold text-slate-900">
                  School Intelligence Assistant
                </h1>
                <p className="text-xs md:text-sm text-slate-600 font-normal hidden md:block">
                  Enterprise Analytics Platform
                </p>
              </div>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-8 md:h-9 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-72px)]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <AnimatePresence>
              {messages.map((message) => {
                const isRevealed = revealedMessages.has(message.id)
                return (
                <motion.div
                  key={message.id}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                      <AvatarFallback
                        className={
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                        }
                      >
                        {message.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <Card
                      className={`transition-all duration-300 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white border-0 shadow-sm hover:shadow-md'
                          : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                      }`}
                    >
                      <CardContent className="p-4 md:p-5">
                        {message.role === 'assistant' ? (
                          <div className="space-y-3">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ 
                                opacity: isRevealed ? 1 : 0,
                                height: isRevealed ? 'auto' : 0
                              }}
                              transition={{ 
                                opacity: { duration: 0.6, ease: 'easeOut' },
                                height: { duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }
                              }}
                              style={{ overflow: 'hidden' }}
                            >
                              {formatContent(message.content)}
                            </motion.div>
                            {isRevealed && message.metadata?.dataType && message.metadata.dataType.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100"
                              >
                                <span className="text-xs text-slate-500 font-medium">Data Sources:</span>
                                {message.metadata.dataType.map((type) => (
                                  <Badge
                                    key={type}
                                    variant="outline"
                                    className="text-[10px] md:text-xs bg-slate-50 border-slate-300 text-slate-700 font-normal"
                                  >
                                    {type}
                                  </Badge>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        ) : (
                          <motion.div
                            initial={false}
                            animate={{ opacity: 1 }}
                          >
                            <p className="text-sm md:text-base font-medium leading-relaxed">{message.content}</p>
                          </motion.div>
                        )}
                        <p
                          className={`text-[10px] md:text-xs mt-3 flex items-center gap-1 ${
                            message.role === 'user'
                              ? 'text-blue-100'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )
              })}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-2 md:gap-3">
                  <Avatar className="w-8 h-8 md:w-10 md:h-10">
                    <AvatarFallback className="bg-slate-700 text-white">
                      <Bot className="w-4 h-4 md:w-5 md:h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="bg-white border border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <div>
                          <span className="text-sm font-medium text-slate-700">{loadingStatus}</span>
                          <div className="text-xs text-slate-500 mt-0.5">Please wait</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Prompts - Only show when no messages or just welcome */}
        {messages.length <= 1 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-slate-200 bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs md:text-sm text-slate-700 font-medium mb-3">Quick Analysis Options</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {quickPrompts.map((prompt) => (
                  <ClientWrapper key={prompt.label}>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      className="h-auto p-2 md:p-3 flex flex-col items-center justify-center gap-1.5 md:gap-2 border-slate-300 hover:bg-white hover:border-blue-600 transition-all"
                    >
                      <div className={`p-1.5 md:p-2 rounded ${prompt.color}`}>
                        <prompt.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <span className="text-[10px] md:text-xs text-center line-clamp-2 text-slate-700 font-medium">
                        {prompt.label}
                      </span>
                    </Button>
                  </ClientWrapper>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-3 md:p-4">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2 md:gap-3"
            >
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about student performance, attendance, wellbeing, or any school metrics..."
                  disabled={isLoading}
                  className="h-10 md:h-11 text-sm md:text-base border-slate-300 focus:border-blue-600 focus:ring-blue-600 bg-white pl-4 pr-4"
                />
              </div>
              <ClientWrapper>
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 h-10 md:h-11 px-4 md:px-6 font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden md:inline ml-2">Send</span>
                    </>
                  )}
                </Button>
              </ClientWrapper>
            </form>
            <p className="text-[10px] md:text-xs text-slate-500 mt-2 text-center">
              Powered by Gemini 2.5 Flash | Real-time school data analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
