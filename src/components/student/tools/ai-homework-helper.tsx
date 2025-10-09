'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Send, 
  BookOpen, 
  Calculator,
  FileText,
  Image as ImageIcon,
  X,
  Zap,
  HelpCircle
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  subject?: string
  imageData?: string
}

export function AIHomeworkHelper({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const subjects = [
    { name: 'Mathematics', icon: Calculator, color: 'blue' },
    { name: 'Science', icon: Zap, color: 'green' },
    { name: 'English', icon: FileText, color: 'purple' },
    { name: 'History', icon: BookOpen, color: 'orange' }
  ]

  // Initialize with sample messages
  useEffect(() => {
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: `Hi! I'm your AI Homework Helper. I'm here to guide you through your ${selectedSubject} assignments and help you understand concepts better. What would you like to work on today?`,
        timestamp: new Date().toISOString(),
        subject: selectedSubject
      }
    ])
  }, [selectedSubject])

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-green-900/50 to-slate-900/50 relative overflow-hidden rounded-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(34,197,94,0.1)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col">
        {/* Compact Header */}
        <motion.div 
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/30">
              <Brain className="h-5 w-5 text-green-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">AI Homework Helper</h1>
              <p className="text-white/60 text-xs sm:text-sm">Smart assignment assistance</p>
            </div>
          </div>
          
          <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
            {selectedSubject}
          </Badge>
        </motion.div>

        {/* Subject Selector */}
        <motion.div
          className="flex space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-xl border border-white/20 mb-4"
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
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-xs transition-all ${
                  selectedSubject === subject.name
                    ? `bg-gradient-to-r ${
                        subject.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                        subject.color === 'green' ? 'from-green-500 to-emerald-500' :
                        subject.color === 'purple' ? 'from-purple-500 to-pink-500' :
                        'from-orange-500 to-red-500'
                      } text-white shadow-lg`
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{subject.name}</span>
                <span className="sm:hidden">{subject.name.slice(0, 4)}</span>
              </Button>
            )
          })}
        </motion.div>

        {/* Chat Area */}
        <motion.div
          className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`max-w-[80%] p-3 rounded-xl ${
                  message.type === 'user' 
                    ? 'bg-green-500/20 text-white border border-green-400/30' 
                    : 'bg-white/10 text-white border border-white/20'
                }`}>
                  {message.imageData && (
                    <img 
                      src={message.imageData} 
                      alt="Uploaded" 
                      className="w-full max-w-xs rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-white/10 text-white border border-white/20 p-3 rounded-xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10">
            {selectedImage && (
              <div className="mb-2 relative inline-block">
                <img src={selectedImage} alt="Selected" className="w-16 h-16 rounded-lg object-cover" />
                <Button
                  onClick={removeImage}
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 hover:bg-red-600 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <div className="flex space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 p-2"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`Ask about ${selectedSubject}...`}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400 focus:ring-green-400/20"
              />
              
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() && !selectedImage}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
