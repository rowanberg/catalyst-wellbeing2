'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BarChart3,
  Lightbulb,
  Target,
  Heart,
  Shield,
  Zap,
  RefreshCw,
  Download,
  Share,
  Settings,
  HelpCircle,
  ChevronDown,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Search,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  LineChart,
  Clock,
  Star,
  Calendar,
  GraduationCap,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { SchoolContext } from '@/lib/huggingface-api'
import SchoolContextService from '@/lib/school-context'
import { toast } from 'sonner'

// Rich Content Renderer Component (simplified without charts for now)
const RichContentRenderer = ({ content }: { content: any }) => {
  switch (content.type) {
    case 'chart':
      return (
        <div className="w-full h-64 my-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chart: {content.data.chartType}</p>
            <p className="text-sm text-gray-500">Chart library integration needed</p>
          </div>
        </div>
      )
    
    case 'table':
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                {content.data.headers.map((header: string, index: number) => (
                  <th key={index} className="px-4 py-2 text-left font-medium text-gray-900 border-b">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.data.rows.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="px-4 py-2 text-gray-700 border-b">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    
    case 'list':
      return (
        <div className="my-4">
          {content.data.ordered ? (
            <ol className="list-decimal list-inside space-y-2">
              {content.data.items.map((item: string, index: number) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc list-inside space-y-2">
              {content.data.items.map((item: string, index: number) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )}
        </div>
      )
    
    case 'image':
      return (
        <div className="my-4">
          <Image 
            src={content.data.url} 
            alt={content.data.alt || 'AI Generated Image'} 
            width={800}
            height={600}
            className="max-w-full h-auto rounded-lg shadow-md"
          />
          {content.data.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              {content.data.caption}
            </p>
          )}
        </div>
      )
    
    default:
      return <div className="text-gray-500 italic">Unsupported content type</div>
  }
}

interface AIInsight {
  id: string
  type: 'wellbeing' | 'academic' | 'engagement' | 'safety' | 'behavioral' | 'attendance'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
  actionable: boolean
  impact: 'critical' | 'moderate' | 'low'
  affectedStudents?: number
  recommendedAction?: string
  confidence: number
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  isLoading?: boolean
  richContent?: {
    type: 'table' | 'chart' | 'list' | 'image' | 'markdown'
    data: any
  }
  reactions?: string[]
  isTyping?: boolean
  avatar?: string
  status?: 'sent' | 'delivered' | 'read'
}

interface AnalyticsData {
  totalInteractions: number
  averageResponseTime: number
  avgResponseTime: number
  satisfactionScore: number
  topQueries: Array<{ query: string; count: number; question: string }>
  insightAccuracy: number
  insightsGenerated: number
  responseRelevance?: number
  trendsData?: Array<{ date: string; insights: number; chats: number }>
}

export default function AIAssistantPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [schoolContext, setSchoolContext] = useState<SchoolContext | null>(null)
  const [realStats, setRealStats] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you with school management today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '🤖',
      status: 'read'
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')
  const [insightFilter, setInsightFilter] = useState('all')
  const [chatFilter, setChatFilter] = useState('')
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [contextService] = useState(() => new SchoolContextService())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeAIAssistant()
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeAIAssistant = async () => {
    try {
      setLoading(true)
      
      // Fetch real school info from admin API
      console.log('🔍 Fetching school info from /api/admin/school...')
      const schoolResponse = await fetch('/api/admin/school')
      let schoolInfo: { name: string; [key: string]: any } | null = null
      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json()
        schoolInfo = schoolData.school
        console.log('✅ School info fetched:', schoolInfo)
      } else {
        console.error('❌ Failed to fetch school info:', schoolResponse.status, schoolResponse.statusText)
      }
      
      // Fetch real stats from admin API
      console.log('🔍 Fetching real stats from /api/admin/stats...')
      const statsResponse = await fetch('/api/admin/stats')
      let stats: { 
        totalStudents: number; 
        totalTeachers: number; 
        totalParents: number; 
        helpRequests: number; 
        atRisk: number;
        [key: string]: any 
      } | null = null
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        stats = statsData.stats
        console.log('✅ Real stats fetched:', stats)
        setRealStats(stats)
      } else {
        console.error('❌ Failed to fetch stats:', statsResponse.status, statsResponse.statusText)
      }
      
      // Initialize school context service
      const contextService = new SchoolContextService()
      const context = await contextService.getSchoolContext()
      
      // Override context with real school info and stats
      if (schoolInfo) {
        context.schoolName = schoolInfo.name
        console.log('🏫 Updated school name:', schoolInfo.name)
      }
      
      if (stats) {
        console.log('🔄 Overriding context with real stats:', {
          students: stats.totalStudents,
          teachers: stats.totalTeachers,
          helpRequests: stats.helpRequests
        })
        context.totalStudents = stats.totalStudents
        context.totalTeachers = stats.totalTeachers
        context.totalParents = stats.totalParents
        context.wellbeingMetrics = {
          ...context.wellbeingMetrics,
          helpRequests: stats.helpRequests,
          averageMoodScore: 7.5,
          engagementLevel: 85
        }
        context.academicMetrics = {
          ...context.academicMetrics,
          strugglingStudents: stats.atRisk || 0
        }
        console.log('✅ Updated context:', {
          schoolName: context.schoolName,
          totalStudents: context.totalStudents,
          totalTeachers: context.totalTeachers,
          helpRequests: context.wellbeingMetrics.helpRequests
        })
      } else {
        console.log('⚠️ No real stats available, using fallback data')
      }
      
      setSchoolContext(context)
      
      // Generate initial insights
      await generateAIInsights(context)
      
      // Load analytics data
      const analytics: AnalyticsData = {
        totalInteractions: Math.floor(Math.random() * 200) + 100,
        averageResponseTime: Math.floor(Math.random() * 1000) + 500,
        avgResponseTime: Math.floor(Math.random() * 3) + 1,
        satisfactionScore: Math.floor(Math.random() * 20) + 80,
        topQueries: [
          { query: "student wellbeing", count: 45, question: "What are the current wellbeing trends?" },
          { query: "academic performance", count: 38, question: "How are students performing academically?" },
          { query: "behavioral insights", count: 29, question: "What behavioral patterns do you see?" },
          { query: "attendance data", count: 22, question: "What are the attendance trends?" }
        ],
        insightAccuracy: Math.floor(Math.random() * 10) + 85,
        insightsGenerated: Math.floor(Math.random() * 50) + 100
      }
      setAnalyticsData(analytics)
      
      // Initialize chat with welcome message including real data
      const welcomeMessage: ChatMessage = {
        id: 'welcome-1',
        type: 'assistant',
        content: `Hello! I'm your AI assistant for ${context.schoolName}. I have access to your current school data:

📊 **School Overview:**
• **${stats?.totalStudents ?? context.totalStudents ?? 0} Students** enrolled
• **${stats?.totalTeachers ?? context.totalTeachers ?? 0} Teachers** on staff
• **${stats?.totalParents ?? context.totalParents ?? 0} Parents** in community
• **${stats?.helpRequests ?? context.wellbeingMetrics?.helpRequests ?? 0} Active Help Requests**
• **${stats?.atRisk ?? context.academicMetrics?.strugglingStudents ?? 0} Students** needing support

I can analyze this data to provide insights, answer questions about school performance, and help with decision-making. What would you like to explore today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages([welcomeMessage])
      
    } catch (error) {
      console.error('Failed to initialize AI Assistant:', error)
    } finally {
      setLoading(false)
    }
  }



  const initializeAI = async () => {
    try {
      // Load school context
      const context = await contextService.getSchoolContext()
      setSchoolContext(context)

      // Initialize chat with welcome message
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'assistant',
        content: `Hello! I'm Whiskers, your AI assistant for ${context.schoolName}. I can analyze your school data with ${context.totalStudents} students and ${context.totalTeachers} teachers to provide insights and recommendations. What would you like to explore today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages([welcomeMessage])

      // Generate initial insights using Gemini API
      await generateAIInsights(context)
      
      setLoading(false)
    } catch (error) {
      console.error('Error initializing AI:', error)
      setLoading(false)
      toast.error('Failed to initialize AI assistant. Please check your Gemini API configuration.')
    }
  }

  const loadAnalyticsData = async () => {
    // Simulate analytics data loading - replace with real API calls
    const mockAnalytics: AnalyticsData = {
      totalInteractions: 247,
      averageResponseTime: 1200,
      avgResponseTime: 1.2,
      satisfactionScore: 87,
      topQueries: [
        { query: "student wellbeing", count: 45, question: "What are the current wellbeing trends?" },
        { query: "academic performance", count: 38, question: "How are students performing academically?" },
        { query: "behavioral insights", count: 29, question: "What behavioral patterns do you see?" },
        { query: "attendance data", count: 22, question: "What are the attendance trends?" }
      ],
      insightAccuracy: 87,
      insightsGenerated: 156,
      responseRelevance: 92,
      trendsData: [
        { date: "2025-09-07", insights: 12, chats: 34 },
        { date: "2025-09-08", insights: 15, chats: 28 },
        { date: "2025-09-09", insights: 18, chats: 42 },
        { date: "2025-09-10", insights: 14, chats: 39 },
        { date: "2025-09-11", insights: 21, chats: 45 }
      ]
    }
    setAnalyticsData(mockAnalytics)
  }


  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const timestamp = Date.now()
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      type: 'user',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setChatMessages(prev => [...prev, userMessage])
    setConversationHistory(prev => [...prev, { role: 'user' as const, content: newMessage }])
    setNewMessage('')

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${timestamp}`,
      type: 'assistant',
      content: 'Thinking...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    }
    setChatMessages(prev => [...prev, loadingMessage])

    try {
      // Try Gemini API first with timeout and retry
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const geminiResponse = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          schoolContext: {
            ...schoolContext,
            // Include real-time school data overview for AI context
            realTimeData: {
              totalStudents: realStats?.totalStudents ?? schoolContext?.totalStudents ?? 0,
              totalTeachers: realStats?.totalTeachers ?? schoolContext?.totalTeachers ?? 0,
              totalParents: realStats?.totalParents ?? schoolContext?.totalParents ?? 0,
              helpRequests: realStats?.helpRequests ?? schoolContext?.wellbeingMetrics?.helpRequests ?? 0,
              strugglingStudents: realStats?.atRisk ?? schoolContext?.academicMetrics?.strugglingStudents ?? 0,
              averageMoodScore: schoolContext?.wellbeingMetrics?.averageMoodScore ?? 7.5,
              engagementLevel: schoolContext?.wellbeingMetrics?.engagementLevel ?? 85
            }
          }
        })
      })
      
      clearTimeout(timeoutId)

      if (geminiResponse.ok) {
        const data = await geminiResponse.json()
        
        // Remove loading message and add AI response
        setChatMessages(prev => {
          const filtered = prev.filter(msg => !msg.isLoading)
          return [...filtered, {
            id: `assistant-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'assistant',
            content: data.message || data.error,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        })

        setConversationHistory(prev => [...prev, { role: 'assistant' as const, content: data.message || data.error }])
      } else {
        // Handle API error response - Gemini only, no fallbacks
        const errorData = await geminiResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Gemini API failed:', errorData.error)
        
        setChatMessages(prev => {
          const filtered = prev.filter(msg => !msg.isLoading)
          return [...filtered, {
            id: `error-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'assistant',
            content: `Gemini API Error: ${errorData.error || 'Failed to get response from Gemini API'}. Please check your API configuration in Settings.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        })
      }
    } catch (error) {
      console.error('Gemini API network error:', error)
      
      setChatMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading)
        return [...filtered, {
          id: `error-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant',
          content: 'Network error connecting to Gemini API. Please check your internet connection and Gemini API configuration in Settings.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      })
    }
  }

  const generateAIInsights = async (context: SchoolContext) => {
    setGeneratingInsights(true)
    try {
      // Generate AI insights using Gemini API only
      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on the following school data, generate 3 actionable insights for school administrators. Format as JSON array with objects containing: id, type (wellbeing/academic/behavioral), title, description, priority (high/medium/low), actionable (boolean), impact (high/moderate/low), confidence (0-100), affectedStudents (number), recommendedAction.

School Data:
- Total Students: ${context.totalStudents}
- Total Teachers: ${context.totalTeachers}
- Help Requests: ${context.wellbeingMetrics.helpRequests}
- Average Mood Score: ${context.wellbeingMetrics.averageMoodScore}/10
- Engagement Level: ${context.wellbeingMetrics.engagementLevel}%
- Struggling Students: ${context.academicMetrics.strugglingStudents}
- Positive Interactions: ${context.behavioralMetrics?.positiveInteractions || 0}
- Black Marks: ${context.behavioralMetrics?.blackMarks || 0}

Please provide practical, data-driven insights that can help improve student outcomes.`,
          conversationHistory: [],
          schoolContext: context
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        try {
          // Try to parse JSON insights from Gemini response
          const insightsText = data.message
          const jsonMatch = insightsText.match(/\[[\s\S]*\]/)
          
          if (jsonMatch) {
            const parsedInsights = JSON.parse(jsonMatch[0])
            const formattedInsights = parsedInsights.map((insight: any, index: number) => ({
              ...insight,
              id: insight.id || (index + 1).toString(),
              timestamp: 'Just now'
            }))
            
            setInsights(formattedInsights)
            toast.success('AI insights generated successfully!')
          } else {
            throw new Error('Could not parse insights from Gemini response')
          }
        } catch (parseError) {
          console.error('Error parsing Gemini insights:', parseError)
          toast.error('Failed to parse AI insights. Please try again.')
        }
      } else {
        const errorData = await response.json()
        console.error('Gemini API error for insights:', errorData)
        toast.error('Failed to generate insights. Please check your Gemini API configuration.')
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      toast.error('Failed to generate AI insights. Please check your Gemini API configuration.')
    } finally {
      setGeneratingInsights(false)
    }
  }

  const refreshInsights = async () => {
    if (schoolContext) {
      await generateAIInsights(schoolContext)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wellbeing': return <Heart className="w-4 h-4" />
      case 'academic': return <BookOpen className="w-4 h-4" />
      case 'engagement': return <Users className="w-4 h-4" />
      case 'safety': return <AlertTriangle className="w-4 h-4" />
      case 'behavioral': return <ThumbsUp className="w-4 h-4" />
      case 'attendance': return <Calendar className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500 text-white'
      case 'moderate': return 'bg-orange-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const filteredInsights = insights.filter(insight => 
    insightFilter === 'all' || insight.priority === insightFilter
  )

  const filteredChatMessages = chatMessages.filter(msg =>
    msg.content.toLowerCase().includes(chatFilter.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <UnifiedAuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
            <div className="px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto"
                >
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                      AI Assistant
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                      <span className="hidden sm:inline">AI-powered insights and recommendations for </span>
                      <span className="sm:hidden">Insights for </span>
                      {schoolContext?.schoolName || 'your school'}
                    </p>
                  </div>
                </motion.div>
                
                <div className="flex items-center justify-end w-full sm:w-auto">
                  <Link href="/admin">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      <span className="hidden sm:inline">Back to </span>Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-purple-100 text-xs sm:text-sm font-medium truncate">Active Insights</p>
                        <p className="text-lg sm:text-2xl lg:text-3xl font-bold">{insights.length}</p>
                      </div>
                      <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-200 flex-shrink-0 self-end sm:self-auto" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-pink-100 text-xs sm:text-sm font-medium truncate">High Priority</p>
                        <p className="text-lg sm:text-2xl lg:text-3xl font-bold">{insights.filter(i => i.priority === 'high').length}</p>
                      </div>
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-pink-200 flex-shrink-0 self-end sm:self-auto" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-blue-100 text-xs sm:text-sm font-medium truncate">Actionable Items</p>
                        <p className="text-lg sm:text-2xl lg:text-3xl font-bold">{insights.filter(i => i.actionable).length}</p>
                      </div>
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-200 flex-shrink-0 self-end sm:self-auto" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-emerald-100 text-xs sm:text-sm font-medium truncate">AI Accuracy</p>
                        <p className="text-lg sm:text-2xl lg:text-3xl font-bold">94%</p>
                      </div>
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-emerald-200 flex-shrink-0 self-end sm:self-auto" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm">
                <TabsTrigger value="insights" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Insights</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">AI Chat</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Analytics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI-Generated Insights</h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Real-time analysis of school performance and recommendations</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <select
                      value={insightFilter}
                      onChange={(e) => setInsightFilter(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    <ClientWrapper>
                      <Button 
                        variant="outline"
                        onClick={() => setGeneratingInsights(true)}
                        disabled={generatingInsights}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 w-full sm:w-auto text-sm"
                      >
                      {generatingInsights ? (
                        <>
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Generating...</span>
                          <span className="sm:hidden">Gen...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="hidden sm:inline">Generate New Insights</span>
                          <span className="sm:hidden">Generate</span>
                        </>
                      )}
                      </Button>
                    </ClientWrapper>
                  </div>
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {filteredInsights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                {getTypeIcon(insight.type)}
                              </div>
                              <div>
                                <h3 className="text-base sm:text-lg font-semibold">{insight.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600">{insight.timestamp}</p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                                {insight.priority}
                              </Badge>
                              {insight.actionable && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                                  Actionable
                                </Badge>
                              )}
                            </div>
                          </div>
                      
                          <p className="text-sm sm:text-base text-gray-700 mb-4">{insight.description}</p>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                              <div className="flex items-center space-x-2">
                                <Badge className={getImpactColor(insight.impact)} variant="secondary">
                                  {insight.impact} impact
                                </Badge>
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {insight.confidence}% confidence
                                </span>
                              </div>
                              {insight.affectedStudents && insight.affectedStudents > 0 && (
                                <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{insight.affectedStudents} students affected</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {insight.recommendedAction && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-blue-900">Recommended Action</p>
                                  <p className="text-xs sm:text-sm text-blue-800">{insight.recommendedAction}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {insight.actionable && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                              <ClientWrapper>
                                <Button 
                                  size="sm" 
                                  className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                                  onClick={() => {
                                    toast.info('Action functionality coming soon!')
                                  }}
                                >
                                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  {insight.title === 'Configure AI Assistant' ? 'Configure Now' : 'Take Action'}
                                </Button>
                              </ClientWrapper>
                              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                                View Details
                              </Button>
                            </div>
                          )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI Chat Assistant</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Intelligent conversations about your school's data and insights</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <Input
                  placeholder="Search conversations..."
                  value={chatFilter}
                  onChange={(e) => setChatFilter(e.target.value)}
                  className="w-full sm:w-64 text-sm"
                />
                <ClientWrapper>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChatMessages([])
                      toast.success('Chat history cleared')
                    }}
                    className="w-full sm:w-auto text-sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="hidden sm:inline">Clear History</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                </ClientWrapper>
              </div>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="border-b border-gray-100 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">AI Chat Assistant</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Powered by Gemini AI</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" className="text-xs w-full sm:w-auto">
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div className={`${chatExpanded ? 'h-[500px] sm:h-[600px]' : 'h-80 sm:h-96'} overflow-y-auto space-y-3 sm:space-y-4 p-3 sm:p-6 bg-gradient-to-b from-gray-50/30 to-white/50 transition-all duration-300`}>
                    {filteredChatMessages.length === 0 && chatFilter && (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No messages found matching "{chatFilter}"</p>
                      </div>
                    )}
                    
                    {filteredChatMessages.length === 0 && !chatFilter && (
                      <div className="text-center py-6 sm:py-8">
                        <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 mb-2">Start a conversation with Whiskers AI</p>
                        <p className="text-xs sm:text-sm text-gray-400">Ask about student data, trends, or get recommendations</p>
                      </div>
                    )}
                    
                    {filteredChatMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[90%] sm:max-w-xs lg:max-w-md ${
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.type === 'user' 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            ) : (
                              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md max-w-[85%] sm:max-w-[70%]'
                                : message.isLoading
                                ? 'bg-blue-50 border border-blue-200 text-blue-800 rounded-bl-md max-w-[90%] sm:max-w-[80%]'
                                : 'bg-white border border-gray-200 rounded-bl-md max-w-[90%] sm:max-w-[80%] hover:shadow-md'
                            }`}
                          >
                            {message.isLoading && (
                              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                                <div className="relative">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-75"></div>
                                  </div>
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <div className="text-xs text-gray-500 animate-pulse">AI is thinking...</div>
                                </div>
                              </div>
                            )}
                            <div className="text-xs sm:text-sm">
                              {message.richContent ? (
                                <RichContentRenderer content={message.richContent} />
                              ) : (
                                <div className="whitespace-pre-wrap">
                                  {message.content}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 sm:mt-3 space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-2">
                                {message.avatar && (
                                  <span className="text-sm sm:text-lg">{message.avatar}</span>
                                )}
                                <p className={`text-xs ${
                                  message.type === 'user' ? 'text-purple-200' : 'text-gray-500'
                                }`}>
                                  {message.timestamp}
                                </p>
                                {message.status && message.type === 'user' && (
                                  <div className="flex items-center space-x-1">
                                    {message.status === 'sent' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>}
                                    {message.status === 'delivered' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>}
                                    {message.status === 'read' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>}
                                  </div>
                                )}
                              </div>
                              {message.type === 'assistant' && !message.isLoading && (
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-100 transition-colors"
                                    onClick={() => {
                                      // Add reaction logic
                                      toast.success('Thanks for the feedback!')
                                    }}
                                  >
                                    <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-red-100 transition-colors"
                                    onClick={() => {
                                      toast.error('We\'ll improve our responses')
                                    }}
                                  >
                                    <ThumbsDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-blue-100 transition-colors"
                                    onClick={() => {
                                      navigator.clipboard.writeText(message.content)
                                      toast.success('Message copied!')
                                    }}
                                  >
                                    <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-yellow-100 transition-colors"
                                    onClick={() => {
                                      toast.success('Added to favorites!')
                                    }}
                                  >
                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-600" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-100 p-3 sm:p-4 bg-white/50">
                    <div className="space-y-2 sm:space-y-3">
                      {/* Chat Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`text-xs sm:text-sm ${voiceEnabled ? 'bg-blue-100 text-blue-700' : ''}`}
                          >
                            {voiceEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />}
                            <span className="hidden sm:inline ml-2">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatExpanded(!chatExpanded)}
                            className="text-xs sm:text-sm"
                          >
                            {chatExpanded ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                            <span className="hidden sm:inline ml-2">{chatExpanded ? 'Minimize' : 'Expand'}</span>
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>AI Online</span>
                          </div>
                        </div>
                      </div>

                      {/* Message Input */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex-1 space-y-2">
                          <div className="relative">
                            <Textarea
                              placeholder="Ask me anything about your school... (Press Shift+Enter for new line)"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendMessage()
                                }
                              }}
                              className="min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none pr-10 sm:pr-12 rounded-2xl border-2 border-gray-200 focus:border-purple-500 transition-colors text-sm"
                              rows={2}
                            />
                            <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                onClick={() => setIsListening(!isListening)}
                              >
                                {isListening ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
                            <span className="sm:hidden">Enter to send</span>
                            <span>{newMessage.length}/500</span>
                          </div>
                        </div>
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-[50px] sm:h-[60px] px-4 sm:px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                        >
                          {isGenerating ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </Button>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewMessage("Show me today's student wellbeing summary")}
                          className="text-xs h-6 sm:h-7 rounded-full hover:bg-purple-50 transition-colors px-2 sm:px-3"
                        >
                          📊 <span className="hidden sm:inline">Wellbeing Summary</span><span className="sm:hidden">Wellbeing</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewMessage("What are the academic trends this week?")}
                          className="text-xs h-6 sm:h-7 rounded-full hover:bg-blue-50 transition-colors px-2 sm:px-3"
                        >
                          📈 <span className="hidden sm:inline">Academic Trends</span><span className="sm:hidden">Trends</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewMessage("Generate a behavioral report")}
                          className="text-xs h-6 sm:h-7 rounded-full hover:bg-green-50 transition-colors px-2 sm:px-3"
                        >
                          🎯 <span className="hidden sm:inline">Behavior Report</span><span className="sm:hidden">Report</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI Analytics Dashboard</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-full sm:w-auto">
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <Button variant="outline" className="w-full sm:w-auto text-sm">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="hidden sm:inline">Export Report</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>

            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Interactions</p>
                        <p className="text-2xl sm:text-3xl font-bold">{analyticsData?.totalInteractions || 0}</p>
                        <p className="text-blue-200 text-xs mt-1">+12% from last week</p>
                      </div>
                      <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs sm:text-sm font-medium">Avg Response Time</p>
                        <p className="text-2xl sm:text-3xl font-bold">{analyticsData?.averageResponseTime || 0}ms</p>
                        <p className="text-green-200 text-xs mt-1">-8% faster</p>
                      </div>
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs sm:text-sm font-medium">Satisfaction Score</p>
                        <p className="text-2xl sm:text-3xl font-bold">{analyticsData?.satisfactionScore || 0}%</p>
                        <p className="text-purple-200 text-xs mt-1">+5% improvement</p>
                      </div>
                      <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs sm:text-sm font-medium">Insights Generated</p>
                        <p className="text-2xl sm:text-3xl font-bold">{analyticsData?.insightsGenerated || 0}</p>
                        <p className="text-orange-200 text-xs mt-1">+18% this week</p>
                      </div>
                      <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts and Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Usage Trends Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                    <LineChart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Usage Trends</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">AI assistant usage over time</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-600">Interactive chart visualization</p>
                      <p className="text-xs sm:text-sm text-gray-500">Chart library integration coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Queries */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Top Queries</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Most frequently asked questions</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {analyticsData?.topQueries?.map((query, index) => (
                      <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="text-xs sm:text-sm font-medium truncate">{query.question}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <Badge variant="outline" className="text-xs">{query.count} times</Badge>
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div 
                              className="bg-purple-600 h-1.5 sm:h-2 rounded-full" 
                              style={{ width: `${(query.count / (analyticsData?.topQueries?.[0]?.count || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-6 sm:py-8">
                        <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-500">No query data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                  <CardDescription>AI model accuracy and reliability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Insight Accuracy</span>
                        <span className="text-sm text-gray-600">{analyticsData?.insightAccuracy || 0}%</span>
                      </div>
                      <Progress value={analyticsData?.insightAccuracy || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response Relevance</span>
                        <span className="text-sm text-gray-600">{analyticsData?.responseRelevance || 0}%</span>
                      </div>
                      <Progress value={analyticsData?.responseRelevance || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">User Satisfaction</span>
                        <span className="text-sm text-gray-600">{analyticsData?.satisfactionScore || 0}%</span>
                      </div>
                      <Progress value={analyticsData?.satisfactionScore || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">System Uptime</span>
                        <span className="text-sm text-gray-600">99.8%</span>
                      </div>
                      <Progress value={99.8} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* School Data Overview */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5" />
                    <span>School Data Overview</span>
                  </CardTitle>
                  <CardDescription>Current school metrics being analyzed</CardDescription>
                </CardHeader>
                <CardContent>
                  {realStats || schoolContext ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">STUDENTS</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {realStats?.totalStudents ?? schoolContext?.totalStudents ?? 0}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">TEACHERS</p>
                          <p className="text-2xl font-bold text-green-900">
                            {realStats?.totalTeachers ?? schoolContext?.totalTeachers ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Average Mood Score</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {schoolContext?.wellbeingMetrics?.averageMoodScore ?? 7.5}/10
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Engagement Level</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {schoolContext?.wellbeingMetrics?.engagementLevel ?? 85}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Help Requests</span>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            {realStats?.helpRequests ?? schoolContext?.wellbeingMetrics?.helpRequests ?? 0}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Struggling Students</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            {realStats?.atRisk ?? schoolContext?.academicMetrics?.strugglingStudents ?? 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Loading school data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
            </Tabs>
          </div>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}
