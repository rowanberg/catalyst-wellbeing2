'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'

interface FamilyMessageComposerProps {
  conversationId: string
  receiverId?: string
  placeholder?: string
  onMessageSent?: () => void
}

export function FamilyMessageComposer({ 
  conversationId, 
  receiverId, 
  placeholder = "Type your message...",
  onMessageSent 
}: FamilyMessageComposerProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || !receiverId || sending) return

    try {
      setSending(true)
      const response = await fetch('/api/family/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: message.trim(),
          receiverId
        })
      })

      if (response.ok) {
        setMessage('')
        onMessageSent?.()
        // Trigger a refresh of the message thread
        window.dispatchEvent(new CustomEvent('familyMessageSent', { 
          detail: { conversationId } 
        }))
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex space-x-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={sending}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || !receiverId || sending}
        className="bg-pink-500 hover:bg-pink-600"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
