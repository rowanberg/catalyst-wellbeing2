'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppSelector } from '@/lib/redux/hooks'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
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

// Component to render formatted message content with subject-specific colors
function MessageContent({ content, subject }: { content: string; subject?: string }) {
  // Get subject color
  const subjects = [
    { name: 'Mathematics', textColor: 'text-blue-400', borderColor: 'border-blue-500' },
    { name: 'Science', textColor: 'text-green-400', borderColor: 'border-green-500' },
    { name: 'English', textColor: 'text-purple-400', borderColor: 'border-purple-500' },
    { name: 'History', textColor: 'text-orange-400', borderColor: 'border-orange-500' },
    { name: 'Computer Science', textColor: 'text-cyan-400', borderColor: 'border-cyan-500' },
    { name: 'Geography', textColor: 'text-emerald-400', borderColor: 'border-emerald-500' }
  ]
  const subjectInfo = subjects.find(s => s.name === subject) || subjects[0]
  const formatContent = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, partIndex) => {
      // Handle code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim()
        return (
          <pre key={partIndex} className="bg-black/40 p-3 sm:p-4 rounded-lg my-3 overflow-x-auto border border-green-500/20">
            <code className="text-green-300 text-xs sm:text-sm font-mono leading-relaxed">{code}</code>
          </pre>
        )
      }
      
      // Process regular text line by line
      const lines = part.split('\n')
      const elements: JSX.Element[] = []
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i]
        const key = `${partIndex}-${i}`
        
        // Skip empty lines but add spacing
        if (!line.trim()) {
          elements.push(<div key={key} className="h-2" />)
          continue
        }
        
        // Main headers ##
        if (line.startsWith('## ')) {
          elements.push(
            <h2 key={key} className={`text-lg sm:text-xl font-bold mt-4 mb-2 ${subjectInfo.textColor}`}>
              {line.slice(3).trim()}
            </h2>
          )
          continue
        }
        
        // Sub headers ###
        if (line.startsWith('### ')) {
          elements.push(
            <h3 key={key} className={`text-base sm:text-lg font-semibold mt-3 mb-1.5 ${subjectInfo.textColor}`}>
              {line.slice(4).trim()}
            </h3>
          )
          continue
        }
        
        // Numbered lists
        if (line.match(/^\d+\.\s/)) {
          const content = line.replace(/^\d+\.\s/, '')
          elements.push(
            <div key={key} className="flex gap-2 my-1.5 ml-2">
              <span className={`${subjectInfo.textColor} font-semibold min-w-[1.5rem]`}>
                {line.match(/^\d+/)?.[0]}.
              </span>
              <span className="flex-1">{formatInlineText(content)}</span>
            </div>
          )
          continue
        }
        
        // Bullet lists
        if (line.match(/^[-*]\s/)) {
          const content = line.slice(2)
          elements.push(
            <div key={key} className="flex gap-2 my-1.5 ml-2">
              <span className={`${subjectInfo.textColor} font-semibold min-w-[1rem]`}>•</span>
              <span className="flex-1">{formatInlineText(content)}</span>
            </div>
          )
          continue
        }
        
        // Blockquotes
        if (line.startsWith('> ')) {
          elements.push(
            <div key={key} className={`border-l-4 ${subjectInfo.borderColor} ${subjectInfo.textColor}/5 pl-4 py-2 my-2 italic`}>
              {formatInlineText(line.slice(2))}
            </div>
          )
          continue
        }
        
        // Regular paragraphs
        elements.push(
          <p key={key} className="my-1.5 leading-relaxed">
            {formatInlineText(line)}
          </p>
        )
      }
      
      return <React.Fragment key={partIndex}>{elements}</React.Fragment>
    })
  }
  
  // Format inline text (bold, italic, code, links)
  const formatInlineText = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let keyCounter = 0
    
    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/^\*\*([^*]+?)\*\*/)
      if (boldMatch) {
        parts.push(
          <strong key={keyCounter++} className="text-white font-bold">
            {boldMatch[1]}
          </strong>
        )
        remaining = remaining.slice(boldMatch[0].length)
        continue
      }
      
      // Inline code `code`
      const codeMatch = remaining.match(/^`([^`]+)`/)
      if (codeMatch) {
        parts.push(
          <code key={keyCounter++} className="bg-black/40 px-1.5 py-0.5 rounded text-green-400 font-mono text-sm mx-0.5">
            {codeMatch[1]}
          </code>
        )
        remaining = remaining.slice(codeMatch[0].length)
        continue
      }
      
      // Links [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(
          <a key={keyCounter++} href={linkMatch[2]} className="text-green-400 hover:text-green-300 underline">
            {linkMatch[1]}
          </a>
        )
        remaining = remaining.slice(linkMatch[0].length)
        continue
      }
      
      // Italic *text* (single asterisk, but not part of **)
      const italicMatch = remaining.match(/^\*([^*]+?)\*/)
      if (italicMatch && !remaining.startsWith('**')) {
        parts.push(
          <em key={keyCounter++}>
            {italicMatch[1]}
          </em>
        )
        remaining = remaining.slice(italicMatch[0].length)
        continue
      }
      
      // Regular text (find next special character)
      const nextSpecial = remaining.search(/[*`\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining)
        break
      } else if (nextSpecial > 0) {
        parts.push(remaining.slice(0, nextSpecial))
        remaining = remaining.slice(nextSpecial)
      } else {
        // If we can't match anything, just take the first character to avoid infinite loop
        parts.push(remaining[0])
        remaining = remaining.slice(1)
      }
    }
    
    return <>{parts}</>
  }
  
  return <div className="space-y-1">{formatContent(content)}</div>
}

export function AIHomeworkHelper({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
  const profile = useAppSelector((state) => state.auth.profile)

  // Define subjects before using in useMemo
  const subjects = [
    { name: 'Mathematics', icon: Calculator, color: 'blue', gradientFrom: 'from-blue-500', gradientTo: 'to-cyan-600', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', bgColor: 'bg-blue-500/20' },
    { name: 'Science', icon: Beaker, color: 'green', gradientFrom: 'from-green-500', gradientTo: 'to-emerald-600', textColor: 'text-green-400', borderColor: 'border-green-500/20', bgColor: 'bg-green-500/20' },
    { name: 'English', icon: PenTool, color: 'purple', gradientFrom: 'from-purple-500', gradientTo: 'to-pink-600', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', bgColor: 'bg-purple-500/20' },
    { name: 'History', icon: BookOpen, color: 'orange', gradientFrom: 'from-orange-500', gradientTo: 'to-amber-600', textColor: 'text-orange-400', borderColor: 'border-orange-500/20', bgColor: 'bg-orange-500/20' },
    { name: 'Computer Science', icon: Code, color: 'cyan', gradientFrom: 'from-cyan-500', gradientTo: 'to-blue-600', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/20', bgColor: 'bg-cyan-500/20' },
    { name: 'Geography', icon: Globe, color: 'emerald', gradientFrom: 'from-emerald-500', gradientTo: 'to-teal-600', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20', bgColor: 'bg-emerald-500/20' }
  ]
  
  // Get current subject colors
  const currentSubject = useMemo(() => 
    subjects.find(s => s.name === selectedSubject) || subjects[0],
    [selectedSubject, subjects]
  )

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
          content: `Hi ${profile?.first_name || 'there'}! I'm your AI Homework Helper. 🎓\n\nI'm here to guide you through your **${selectedSubject}** assignments and help you understand concepts better.\n\n**I can help you with:**\n- Step-by-step problem solving\n- Explaining difficult concepts\n- Checking your answers\n- Practice problems\n- Study strategies\n\nWhat would you like to work on today?`,
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

    // Prepare message content
    const messageContent = inputMessage.trim() || (selectedImage ? '[Image uploaded - please help me with this problem]' : '')

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      subject: selectedSubject,
      imageData: selectedImage || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSelectedImage(null)
    setIsTyping(true)
    setHelpCount(prev => prev + 1)

    try {
      // Call the Gemini API with streaming
      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          imageData: selectedImage || undefined,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          schoolContext: {
            subject: selectedSubject,
            studentName: profile?.first_name || 'Student',
            schoolName: profile?.schools?.name || profile?.school_name || 'your school',
            imageAttached: !!selectedImage
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get response')
      }

      // Create placeholder message for streaming content
      const aiMessageId = (Date.now() + 1).toString()
      const aiResponse: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date().toISOString(),
        subject: selectedSubject
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false) // Stop typing indicator, start showing content

      // Read streaming response with smooth word-by-word animation
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let displayedText = ''
      let animationQueue: string[] = []
      
      // Start animation loop
      let animationRunning = true
      const animateText = () => {
        if (animationQueue.length > 0 && animationRunning) {
          const word = animationQueue.shift()!
          displayedText += word
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: displayedText }
                : msg
            )
          )
          
          // Continue animation with smooth delay (20-40ms per word)
          setTimeout(animateText, 20)
        } else if (displayedText !== fullText && !animationRunning) {
          // If streaming is done but animation hasn't caught up, show remaining text
          displayedText = fullText
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: displayedText }
                : msg
            )
          )
        }
      }
      
      // Start the animation
      animateText()

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              animationRunning = false
              break
            }

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  animationRunning = false
                  break
                }
                
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.text) {
                    // Add new text to the full text buffer
                    const newText = parsed.text
                    fullText += newText
                    
                    // Split into words and add to animation queue
                    // Split by spaces but keep the spaces
                    const words = newText.split(/(?<=\s)|(?=\s)/)
                    animationQueue.push(...words)
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming read error:', error)
        }
        
        // Ensure all text is displayed when streaming completes
        animationRunning = false
        if (displayedText !== fullText) {
          displayedText = fullText
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullText }
                : msg
            )
          )
        }
      }
      
      // Update accuracy based on successful responses
      setAccuracy(prev => Math.min(100, prev + 0.5))
      
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      
      // Show error message to user
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I apologize, but I'm having trouble processing your request right now.\n\n${error instanceof Error ? error.message : 'Please try again in a moment.'}\n\nIf the problem persists, please contact your teacher or administrator.`,
        timestamp: new Date().toISOString(),
        subject: selectedSubject
      }
      
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }, [inputMessage, selectedImage, selectedSubject, messages, profile?.first_name])

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

  // Handle input change with word count
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    const count = words.length
    
    // Limit to 400 words
    if (count <= 400 || text.length < inputMessage.length) {
      setInputMessage(text)
      setWordCount(count)
      
      // Auto-resize textarea up to max 4 lines (~100px)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        const newHeight = Math.min(textareaRef.current.scrollHeight, 100)
        textareaRef.current.style.height = newHeight + 'px'
      }
    }
  }, [inputMessage.length])

  // Reset textarea height when message is sent
  useEffect(() => {
    if (inputMessage === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [inputMessage])

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
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${currentSubject.gradientFrom} ${currentSubject.gradientTo} rounded-full flex items-center justify-center shadow-lg shadow-${currentSubject.color}-500/20 flex-shrink-0`}>
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">AI Homework Helper</h1>
              <p className={`text-xs ${currentSubject.textColor} truncate`}>{selectedSubject}</p>
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
                      ? `${subject.bgColor} ${subject.textColor} hover:bg-${subject.color}-500/30`
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
                  <div className="relative max-w-full sm:max-w-md">
                    <Image 
                      src={message.imageData} 
                      alt="Uploaded" 
                      width={400}
                      height={300}
                      className="rounded-lg sm:rounded-xl border border-green-500/20 shadow-lg"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </div>
                )}
                
                <div className="text-white/90 text-sm sm:text-base leading-relaxed break-words">
                  <MessageContent content={message.content} subject={message.subject} />
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

      {/* Input Area - Professional & Optimized */}
      <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t border-green-500/10 bg-[#0a0f0a]/95 backdrop-blur-xl z-10">
        <div className="max-w-5xl mx-auto">
          {/* Image Preview */}
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 relative inline-block"
            >
              <div className="relative h-20 sm:h-28 rounded-xl overflow-hidden border border-green-500/20 shadow-lg">
                <Image 
                  src={selectedImage} 
                  alt="Preview" 
                  width={150} 
                  height={112} 
                  className="h-full w-auto object-cover" 
                  style={{ width: 'auto', height: '100%' }} 
                />
              </div>
              <Button
                onClick={removeImage}
                size="sm"
                className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 shadow-lg border-2 border-[#0a0f0a]"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
          
          {/* Input Container */}
          <div className="flex items-end gap-2 sm:gap-3">
            {/* Textarea Container */}
            <div className="flex-1 relative bg-white/5 border border-green-500/20 rounded-xl sm:rounded-2xl overflow-hidden hover:border-green-500/30 focus-within:border-green-500/40 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }, 300)
                }}
                placeholder="Type your question... (Shift+Enter for new line)"
                rows={1}
                className="w-full bg-transparent text-white placeholder:text-white/40 px-3 sm:px-4 py-3 sm:py-3.5 pr-24 sm:pr-28 text-sm sm:text-base focus:outline-none resize-none overflow-y-auto min-h-[52px] sm:min-h-[56px] max-h-[120px]"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(34, 197, 94, 0.3) transparent'
                }}
              />
              
              {/* Word Counter */}
              {inputMessage && (
                <div className={`absolute bottom-2 left-3 sm:left-4 text-[10px] sm:text-xs font-medium transition-colors ${
                  wordCount > 380 ? 'text-red-400' : wordCount > 300 ? 'text-yellow-400' : 'text-white/40'
                }`}>
                  {wordCount}/400
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="absolute right-2 sm:right-2.5 bottom-2 sm:bottom-2.5 flex items-center gap-1">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="ghost"
                  type="button"
                  title="Attach image"
                  className="h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setVoiceMode(!voiceMode)}
                  size="sm"
                  variant="ghost"
                  title={voiceMode ? 'Stop voice input' : 'Start voice input'}
                  className={`h-9 w-9 p-0 rounded-lg transition-all ${
                    voiceMode 
                      ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label="Upload image"
              />
            </div>
            
            {/* Send Button */}
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() && !selectedImage}
              title="Send message"
              className="h-[52px] sm:h-[56px] px-5 sm:px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-2xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all transform hover:scale-105 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Helper Text */}
          <div className="mt-2 px-1 flex items-center justify-between text-[10px] sm:text-xs text-white/30">
            <span>💡 Tip: Upload images for better help</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  )
}
