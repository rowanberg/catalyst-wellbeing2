'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { formatDistanceToNow } from 'date-fns'

interface FamilyMessage {
  id: string
  text: string
  type: string
  isRead: boolean
  createdAt: string
  senderId: string
  receiverId: string
  senderName: string
  senderRole: string
  receiverName: string
  receiverRole: string
  isFromCurrentUser: boolean
}

interface FamilyMessageThreadProps {
  conversationId: string
}

export function FamilyMessageThread({ conversationId }: FamilyMessageThreadProps) {
  const [messages, setMessages] = useState<FamilyMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/family/messages?conversationId=${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error fetching family messages:', error)
      } finally {
        setLoading(false)
      }
    }

    if (conversationId) {
      fetchMessages()
    }
  }, [conversationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-gray-500">No messages yet</p>
          <p className="text-sm text-gray-400">Start a conversation with your family!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-xs lg:max-w-md ${message.isFromCurrentUser ? 'order-2' : 'order-1'}`}>
            <Card className={`p-3 ${
              message.isFromCurrentUser 
                ? 'bg-pink-500 text-white' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-1">
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${
                    message.isFromCurrentUser ? 'text-pink-100' : 'text-gray-500'
                  }`}>
                    {message.senderName} ({message.senderRole})
                  </p>
                  <p className={`text-xs ${
                    message.isFromCurrentUser ? 'text-pink-100' : 'text-gray-400'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  )
}
