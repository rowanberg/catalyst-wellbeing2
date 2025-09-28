'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Clock, Users } from 'lucide-react'

interface Conversation {
  id: string
  parent?: {
    id: string
    name: string
  }
  child?: {
    id: string
    name: string
    grade: string
  }
  latest_message?: {
    message_text: string
    created_at: string
  }[]
  created_at: string
  updated_at: string
}

interface FamilyConversationListProps {
  userRole: 'parent' | 'student'
  onSelectConversation: (conversationId: string, participantName: string, participantRole: string) => void
}

export function FamilyConversationList({ userRole, onSelectConversation }: FamilyConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/family-messaging', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching family conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading conversations...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>Family Conversations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No family conversations yet</p>
            <p className="text-sm text-gray-400">
              {userRole === 'parent' 
                ? 'Start a conversation with your child from their profile'
                : 'Your parents can message you here when they\'re ready to chat'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <span>Family Conversations</span>
          <Badge variant="secondary" className="ml-auto">
            {conversations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conversations.map((conversation) => {
          const participant = userRole === 'parent' ? conversation.child : conversation.parent
          const lastMessage = conversation.latest_message?.[0]
          
          return (
            <div
              key={conversation.id}
              className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectConversation(
                conversation.id,
                participant?.name || 'Family Member',
                userRole === 'parent' ? 'student' : 'parent'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {participant?.name?.split(' ').map(n => n[0]).join('') || 'F'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {participant?.name || 'Family Member'}
                    </p>
                    {userRole === 'parent' && conversation.child?.grade && (
                      <p className="text-sm text-gray-500">{conversation.child.grade}</p>
                    )}
                    {lastMessage && (
                      <p className="text-sm text-gray-600 truncate max-w-[200px]">
                        {lastMessage.message_text}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  {lastMessage && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(lastMessage.created_at)}
                    </div>
                  )}
                  <Badge className="bg-pink-100 text-pink-700 text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    Family
                  </Badge>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
