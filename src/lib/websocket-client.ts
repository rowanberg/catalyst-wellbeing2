/**
 * WebSocket Client for Real-time Teacher Messaging
 * Provides real-time updates for messages, student status, and notifications
 */

import { toast } from 'sonner'
import HapticFeedback from './haptic-feedback'
import React from 'react'

export interface WebSocketMessage {
  type: 'message' | 'student_status' | 'notification' | 'wellbeing_update'
  data: any
  timestamp: string
  sender?: string
}

export interface StudentStatusUpdate {
  studentId: string
  isOnline: boolean
  mood?: string
  lastActive: string
}

export interface WellbeingUpdate {
  studentId: string
  wellbeingStatus: 'thriving' | 'needs_support' | 'at_risk'
  mood: string
  timestamp: string
}

class TeacherWebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false

  constructor(private teacherId: string, private schoolId: string) {
    this.connect()
  }

  private connect() {
    try {
      // Use secure WebSocket in production, regular in development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws/teacher?teacherId=${this.teacherId}&schoolId=${this.schoolId}`
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.scheduleReconnect()
    }
  }

  private handleOpen() {
    console.log('✅ WebSocket connected for teacher messaging')
    this.isConnected = true
    this.reconnectAttempts = 0
    this.startHeartbeat()
    
    // Send authentication message
    this.send({
      type: 'auth',
      data: {
        teacherId: this.teacherId,
        schoolId: this.schoolId,
        timestamp: new Date().toISOString()
      }
    })

    this.emit('connected', { connected: true })
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      switch (message.type) {
        case 'message':
          this.handleNewMessage(message.data)
          break
        case 'student_status':
          this.handleStudentStatusUpdate(message.data)
          break
        case 'notification':
          this.handleNotification(message.data)
          break
        case 'wellbeing_update':
          this.handleWellbeingUpdate(message.data)
          break
        default:
          console.log('Unknown message type:', message.type)
      }

      this.emit(message.type, message.data)
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.code, event.reason)
    this.isConnected = false
    this.stopHeartbeat()
    
    if (event.code !== 1000) { // Not a normal closure
      this.scheduleReconnect()
    }

    this.emit('disconnected', { connected: false })
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error)
    this.emit('error', error)
  }

  private handleNewMessage(data: any) {
    // Trigger haptic feedback for new messages
    HapticFeedback.notification()
    
    // Show toast notification
    toast.info(`New message from ${data.senderName}`, {
      duration: 4000,
      action: {
        label: 'View',
        onClick: () => {
          this.emit('message_click', data)
        }
      }
    })
  }

  private handleStudentStatusUpdate(data: StudentStatusUpdate) {
    // Subtle haptic feedback for status updates
    HapticFeedback.select()
    
    console.log('Student status update:', data)
  }

  private handleNotification(data: any) {
    HapticFeedback.notification()
    
    toast(data.message, {
      duration: 5000,
      className: data.type === 'urgent' ? 'border-red-500' : 'border-blue-500'
    })
  }

  private handleWellbeingUpdate(data: WellbeingUpdate) {
    if (data.wellbeingStatus === 'at_risk') {
      HapticFeedback.error()
      toast.error(`${data.studentId} needs attention - wellbeing status changed to at risk`, {
        duration: 8000,
        action: {
          label: 'Check',
          onClick: () => {
            this.emit('wellbeing_alert', data)
          }
        }
      })
    } else {
      HapticFeedback.select()
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', data: { timestamp: Date.now() } })
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      toast.error('Connection lost. Please refresh the page.', {
        duration: 10000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      })
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  public send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket event callback:', error)
        }
      })
    }
  }

  public disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.listeners.clear()
  }

  public getConnectionStatus() {
    return {
      connected: this.isConnected,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // Teacher-specific methods
  public subscribeToStudent(studentId: string) {
    this.send({
      type: 'subscribe_student',
      data: { studentId }
    })
  }

  public unsubscribeFromStudent(studentId: string) {
    this.send({
      type: 'unsubscribe_student',
      data: { studentId }
    })
  }

  public sendMessage(recipientId: string, message: string, type: 'student' | 'parent' = 'student') {
    this.send({
      type: 'send_message',
      data: {
        recipientId,
        message,
        recipientType: type,
        timestamp: new Date().toISOString()
      }
    })
  }

  public markMessageRead(messageId: string) {
    this.send({
      type: 'mark_read',
      data: { messageId }
    })
  }
}

// React hook for WebSocket integration
export const useTeacherWebSocket = (teacherId: string, schoolId: string) => {
  const [client, setClient] = React.useState<TeacherWebSocketClient | null>(null)
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    if (!teacherId || !schoolId) return

    const wsClient = new TeacherWebSocketClient(teacherId, schoolId)
    
    wsClient.on('connected', () => setConnected(true))
    wsClient.on('disconnected', () => setConnected(false))
    
    setClient(wsClient)

    return () => {
      wsClient.disconnect()
    }
  }, [teacherId, schoolId])

  return {
    client,
    connected,
    send: client?.send.bind(client),
    subscribe: client?.on.bind(client),
    unsubscribe: client?.off.bind(client)
  }
}

export default TeacherWebSocketClient
