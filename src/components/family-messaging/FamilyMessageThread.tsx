'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Heart, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  message_text: string
  message_type: string
  is_read: boolean
  created_at: string
  sender: {
    id: string
    name: string
    role: string
  }
  receiver: {
    id: string
    name: string
    role: string
  }
}

interface FamilyMessageThreadProps {
  conversationId: string
  participantName: string
  participantRole: string
  currentUserId: string
  participantId: string
  onBack: () => void
}

export function FamilyMessageThread({
  conversationId,
  participantName,
  participantRole,
  currentUserId,
  participantId,
  onBack
}: FamilyMessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchMessages()
  }, [conversationId])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/family-messaging?conversationId=${conversationId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        const unreadMessageIds = data.messages
          ?.filter((msg: Message) => !msg.is_read && msg.receiver.id === currentUserId)
          ?.map((msg: Message) => msg.id)

        if (unreadMessageIds?.length > 0) {
          await fetch('/api/family-messaging', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ messageIds: unreadMessageIds })
          })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      // Use participantId as the receiver ID - this is passed from parent component
      const receiverId = participantId

      if (!receiverId) {
        console.error('Could not determine receiver ID - participantId is missing')
        return
      }

      const response = await fetch('/api/family-messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId,
          messageText: newMessage.trim(),
          messageType: 'text'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        scrollToBottom()
      } else {
        const errorData = await response.text()
        console.error('Failed to send message:', errorData)
      }
    } catch (error) {
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const dateKey = new Date(message.created_at).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-pink-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {participantName.split(' ').map(n => n[0]).join('')}
              </div>
              <span>{participantName}</span>
              <Badge variant="secondary" className="text-xs">
                {participantRole === 'student' ? 'Child' : 'Parent'}
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1 text-pink-600">
            <Heart className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">Family Chat</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : Object.keys(messageGroups).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Heart className="h-8 w-8 text-pink-300 mb-2" />
              <p className="text-gray-500">Start your family conversation!</p>
              <p className="text-sm text-gray-400">Send a message to begin chatting</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([dateKey, dayMessages]: [string, any]) => (
              <div key={dateKey}>
                <div className="flex justify-center mb-4">
                  <Badge variant="outline" className="text-xs text-gray-500">
                    {formatDate(dayMessages[0].created_at)}
                  </Badge>
                </div>
                {dayMessages.map((message: any) => {
                  const isCurrentUser = message.sender.id === currentUserId
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message_text}</p>
                        <div className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-pink-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                          {isCurrentUser && (
                            <span className="ml-2">
                              {message.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-gray-50">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            🔒 Private family conversation - Safe and secure
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
