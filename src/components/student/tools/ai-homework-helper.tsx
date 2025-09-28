'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Brain, 
  ArrowLeft, 
  Send, 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  Clock, 
  Star, 
  Zap,
  Settings,
  Camera,
  Mic,
  Paperclip,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Download,
  Sparkles,
  Target,
  HelpCircle,
  Calculator,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Upload,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  subject?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  helpful?: boolean
  attachments?: {
    type: 'image' | 'document'
    name: string
    url: string
  }[]
  imageData?: string
  model?: string
}

interface HomeworkSession {
  id: string
  subject: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  startTime: string
  duration: number
  messagesCount: number
  completed: boolean
  rating?: number
}

export function AIHomeworkHelper({ onBack }: { onBack: () => void }) {
  const [currentView, setCurrentView] = useState<'chat' | 'history' | 'subjects' | 'settings'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('General')
  const [sessions, setSessions] = useState<HomeworkSession[]>([])
  const [currentSession, setCurrentSession] = useState<HomeworkSession | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [currentModel, setCurrentModel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const subjects = [
    { name: 'Mathematics', icon: Calculator, color: 'blue' },
    { name: 'Science', icon: Zap, color: 'green' },
    { name: 'English', icon: FileText, color: 'purple' },
    { name: 'History', icon: BookOpen, color: 'orange' },
    { name: 'General', icon: HelpCircle, color: 'gray' }
  ]

  // Check Gemini configuration on component mount
  useEffect(() => {
    checkGeminiConfig()
  }, [])

  const checkGeminiConfig = async () => {
    try {
      const response = await fetch('/api/student/gemini-config')

      if (response.ok) {
        const config = await response.json()
        setIsConfigured(config.isConfigured)
        setCurrentModel(config.selectedModel || 'gemini-1.5-flash')
        
        if (config.isConfigured) {
          setMessages([
            {
              id: '1',
              type: 'ai',
              content: `Hi! I'm your AI Homework Helper powered by ${config.selectedModel}. I'm here to guide you through your assignments and help you understand concepts better. What subject are you working on today?`,
              timestamp: new Date().toISOString(),
              subject: 'General',
              model: config.selectedModel
            }
          ])
        } else {
          setMessages([
            {
              id: '1',
              type: 'ai',
              content: "Hi! To use the AI Homework Helper, you need to configure your Gemini API key in Settings. Click the settings button above to get started!",
              timestamp: new Date().toISOString(),
              subject: 'General'
            }
          ])
        }
      }
    } catch (error) {
      console.error('Error checking Gemini config:', error)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Initialize sessions data
  useEffect(() => {
    setSessions([
      {
        id: '1',
        subject: 'Mathematics',
        topic: 'Quadratic Equations',
        difficulty: 'medium',
        startTime: '2025-09-26T14:30:00',
        duration: 25,
        messagesCount: 12,
        completed: true,
        rating: 5
      },
      {
        id: '2',
        subject: 'Science',
        topic: 'Photosynthesis Process',
        difficulty: 'easy',
        startTime: '2025-09-25T16:00:00',
        duration: 18,
        messagesCount: 8,
        completed: true,
        rating: 4
      }
    ])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return
    if (!isConfigured) {
      alert('Please configure your Gemini API key in Settings first!')
      return
    }

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

    try {
      const response = await fetch('/api/student/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          imageData: selectedImage,
          conversationHistory: messages.slice(-5).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.response,
          timestamp: data.timestamp,
          subject: selectedSubject,
          model: data.model
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const error = await response.json()
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: `Sorry, I encountered an error: ${error.error}`,
          timestamp: new Date().toISOString(),
          subject: selectedSubject
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered a connection error. Please try again.',
        timestamp: new Date().toISOString(),
        subject: selectedSubject
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  const generateAIResponse = (question: string, subject: string): string => {
    const responses = {
      Mathematics: [
        "Let me break this down step by step for you. First, let's identify what type of problem this is...",
        "Great question! In mathematics, it's important to understand the underlying concept. Here's how we can approach this...",
        "I can see you're working on this problem. Let's solve it together by following these steps..."
      ],
      Science: [
        "That's an excellent scientific question! Let me explain the concept and then we can explore it further...",
        "Science is all about understanding how things work. For this topic, let's start with the basics...",
        "I love helping with science! This concept is really interesting. Here's what you need to know..."
      ],
      English: [
        "Language and literature are fascinating! Let me help you understand this concept better...",
        "Great question about English! Let's explore this topic and improve your understanding...",
        "Writing and reading skills are so important. Here's how we can approach this..."
      ],
      History: [
        "History helps us understand our world! Let me provide some context for this topic...",
        "That's a thoughtful historical question. Let's explore the background and significance...",
        "Understanding history requires looking at different perspectives. Here's what happened..."
      ]
    }

    const subjectResponses = responses[subject as keyof typeof responses] || responses.Mathematics
    return subjectResponses[Math.floor(Math.random() * subjectResponses.length)]
  }

  const markHelpful = (messageId: string, helpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    )
  }

  const startNewSession = () => {
    const newSession: HomeworkSession = {
      id: Date.now().toString(),
      subject: selectedSubject,
      topic: 'New Session',
      difficulty: 'medium',
      startTime: new Date().toISOString(),
      duration: 0,
      messagesCount: 0,
      completed: false
    }
    setCurrentSession(newSession)
    setMessages([
      {
        id: Date.now().toString(),
        type: 'ai',
        content: `Great! Let's start a new ${selectedSubject} session. What specific topic or assignment are you working on?`,
        timestamp: new Date().toISOString(),
        subject: selectedSubject
      }
    ])
  }

  const getSubjectColor = (subject: string) => {
    const subjectData = subjects.find(s => s.name === subject)
    return subjectData?.color || 'gray'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const renderChat = () => (
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Brain className="h-5 w-5 text-green-300" />
            </div>
            <div>
              <p className="text-white/90 font-medium">AI Homework Helper</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-white/60 text-xs">Online & Ready to Help</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs px-2 py-1 ${
              selectedSubject === 'Mathematics' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
              selectedSubject === 'Science' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
              selectedSubject === 'English' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' :
              selectedSubject === 'History' ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' :
              'bg-gray-500/20 text-gray-300 border-gray-400/30'
            }`}>
              {selectedSubject}
            </Badge>
            <Button
              onClick={startNewSession}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
              <div className={`p-4 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                  : 'bg-white/10 border border-white/20 text-white/90'
              }`}>
                {/* Image Display */}
                {message.imageData && (
                  <div className="mb-3">
                    <img 
                      src={message.imageData} 
                      alt="User uploaded" 
                      className="max-w-full h-48 object-cover rounded-lg border border-white/20"
                    />
                  </div>
                )}
                
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* AI Model Info */}
                {message.type === 'ai' && message.model && (
                  <div className="mt-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      {message.model}
                    </Badge>
                  </div>
                )}
                
                {message.type === 'ai' && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => markHelpful(message.id, true)}
                        variant="ghost"
                        size="sm"
                        className={`p-1 rounded-full ${
                          message.helpful === true ? 'bg-green-500/20 text-green-300' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => markHelpful(message.id, false)}
                        variant="ghost"
                        size="sm"
                        className={`p-1 rounded-full ${
                          message.helpful === false ? 'bg-red-500/20 text-red-300' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 rounded-full text-white/60 hover:text-white"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-white/50">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mr-12">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-white/60 text-xs">AI is thinking...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm rounded-b-2xl">
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-3 p-3 bg-white/10 rounded-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Selected Image</span>
              <Button
                onClick={removeImage}
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-red-500/20 rounded-full text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="max-w-full h-32 object-cover rounded-lg border border-white/20"
            />
          </div>
        )}

        {/* Configuration Status */}
        {!isConfigured && (
          <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <div className="text-yellow-300 text-sm">
                <p className="font-medium">Gemini AI not configured</p>
                <p className="text-yellow-200/80">Configure your API key in Settings to use AI assistance</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={isConfigured ? "Ask me anything about your homework..." : "Configure Gemini AI in Settings to start chatting..."}
              className="w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none pr-20"
              rows={2}
              disabled={!isConfigured}
            />
            
            {/* Action Buttons */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="sm"
                disabled={!isConfigured || !currentModel.includes('1.5')}
                className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white disabled:opacity-50"
                title={currentModel.includes('1.5') ? 'Upload image' : 'Image support only available with Gemini 1.5 models'}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
              >
                <Paperclip className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
              >
                <Mic className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Button
            onClick={sendMessage}
            disabled={(!inputMessage.trim() && !selectedImage) || isTyping || !isConfigured}
            className={`px-4 py-2 rounded-xl shadow-lg transition-all duration-200 ${
              isConfigured 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white' 
                : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isTyping ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30">
                  <Brain className="h-6 w-6 text-green-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">AI Homework Helper</h1>
                  <p className="text-white/60 text-sm">Get smart assistance with your assignments</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Subject Selector */}
          <motion.div
            className="flex space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {subjects.map((subject) => {
              const Icon = subject.icon
              return (
                <Button
                  key={subject.name}
                  onClick={() => setSelectedSubject(subject.name)}
                  className={`flex-1 py-2 px-3 rounded-xl font-medium text-sm transition-all ${
                    selectedSubject === subject.name
                      ? `bg-gradient-to-r ${
                          subject.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                          subject.color === 'green' ? 'from-green-500 to-emerald-500' :
                          subject.color === 'purple' ? 'from-purple-500 to-pink-500' :
                          subject.color === 'orange' ? 'from-orange-500 to-red-500' :
                          'from-gray-500 to-slate-500'
                        } text-white shadow-lg`
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {subject.name}
                </Button>
              )
            })}
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
              {renderChat()}
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
