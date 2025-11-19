'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// WebSocket message types
interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  userId?: string
  sessionId?: string
}

interface NotificationUpdate {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: number
  read: boolean
}

interface DataUpdate {
  type: 'dashboard' | 'wellbeing' | 'community' | 'analytics' | 'profile'
  studentId?: string
  data: any
  timestamp: number
}

interface PresenceUpdate {
  userId: string
  status: 'online' | 'offline' | 'away'
  lastSeen: number
}

// WebSocket connection manager
class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageHandlers = new Map<string, Set<(data: any) => void>>()
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected'
  private userId?: string
  private userRole?: string

  constructor() {
    this.connect()
  }

  private connect() {
    if (typeof window === 'undefined') return

    this.connectionState = 'connecting'
    
    try {
      // Use secure WebSocket in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws`
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      this.scheduleReconnect()
    }
  }

  private handleOpen() {
    console.log('[WebSocket] Connected successfully')
    this.connectionState = 'connected'
    this.reconnectAttempts = 0
    
    // Send authentication if user is set
    if (this.userId && this.userRole) {
      this.send({
        type: 'auth',
        payload: {
          userId: this.userId,
          userRole: this.userRole,
          timestamp: Date.now()
        }
      })
    }
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Notify handlers
    this.notifyHandlers('connection', { status: 'connected' })
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle system messages
      if (message.type === 'pong') {
        return // Heartbeat response
      }
      
      if (message.type === 'error') {
        console.error('[WebSocket] Server error:', message.payload)
        return
      }
      
      // Notify specific handlers
      this.notifyHandlers(message.type, message.payload)
      
      // Notify all message handlers
      this.notifyHandlers('message', message)
      
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error)
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('[WebSocket] Connection closed:', event.code, event.reason)
    this.connectionState = 'disconnected'
    
    this.stopHeartbeat()
    this.notifyHandlers('connection', { status: 'disconnected' })
    
    // Reconnect unless it was a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private handleError(error: Event) {
    console.error('[WebSocket] Connection error:', error)
    this.connectionState = 'error'
    this.notifyHandlers('connection', { status: 'error' })
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', payload: { timestamp: Date.now() } })
      }
    }, 30000) // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private notifyHandlers(type: string, data: any) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${type}:`, error)
        }
      })
    }
  }

  // Public methods
  setUser(userId: string, userRole: string) {
    this.userId = userId
    this.userRole = userRole
    
    // Send auth if already connected
    if (this.connectionState === 'connected') {
      this.send({
        type: 'auth',
        payload: {
          userId,
          userRole,
          timestamp: Date.now()
        }
      })
    }
  }

  send(message: Partial<WebSocketMessage>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type || 'message',
        payload: message.payload || {},
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: message.sessionId
      }
      
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      console.warn('[WebSocket] Cannot send message - not connected')
    }
  }

  subscribe(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    
    this.messageHandlers.get(type)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(type)
        }
      }
    }
  }

  getConnectionState() {
    return this.connectionState
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }
}

// Global WebSocket manager
let wsManager: WebSocketManager | null = null

const getWebSocketManager = () => {
  if (!wsManager) {
    wsManager = new WebSocketManager()
  }
  return wsManager
}

// React hooks for WebSocket functionality
export const useWebSocket = () => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const manager = useRef(getWebSocketManager())

  useEffect(() => {
    const unsubscribe = manager.current.subscribe('connection', (data: { status: string }) => {
      setConnectionState(data.status as any)
    })

    // Set initial state
    setConnectionState(manager.current.getConnectionState())

    return unsubscribe
  }, [])

  const send = useCallback((message: Partial<WebSocketMessage>) => {
    manager.current.send(message)
  }, [])

  const subscribe = useCallback((type: string, handler: (data: any) => void) => {
    return manager.current.subscribe(type, handler)
  }, [])

  const setUser = useCallback((userId: string, userRole: string) => {
    manager.current.setUser(userId, userRole)
  }, [])

  return {
    connectionState,
    send,
    subscribe,
    setUser,
    isConnected: connectionState === 'connected'
  }
}

// Hook for real-time notifications
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationUpdate[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { subscribe } = useWebSocket()

  useEffect(() => {
    const unsubscribe = subscribe('notification', (notification: NotificationUpdate) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50
      
      if (!notification.read) {
        setUnreadCount(prev => prev + 1)
      }
    })

    return unsubscribe
  }, [subscribe])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  }
}

// Hook for real-time data updates
export const useRealTimeDataUpdates = (dataTypes: string[] = []) => {
  const [updates, setUpdates] = useState<Record<string, any>>({})
  const { subscribe } = useWebSocket()

  useEffect(() => {
    const unsubscribes = dataTypes.map(type => 
      subscribe(`data_update_${type}`, (update: DataUpdate) => {
        setUpdates(prev => ({
          ...prev,
          [type]: {
            data: update.data,
            timestamp: update.timestamp,
            studentId: update.studentId
          }
        }))
      })
    )

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [dataTypes, subscribe])

  return updates
}

// Hook for user presence
export const useUserPresence = () => {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceUpdate>>({})
  const { subscribe, send } = useWebSocket()

  useEffect(() => {
    const unsubscribe = subscribe('presence', (update: PresenceUpdate) => {
      setPresenceMap(prev => ({
        ...prev,
        [update.userId]: update
      }))
    })

    // Send presence update on visibility change
    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'away'
      send({
        type: 'presence',
        payload: { status, timestamp: Date.now() }
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [subscribe, send])

  const updatePresence = useCallback((status: 'online' | 'offline' | 'away') => {
    send({
      type: 'presence',
      payload: { status, timestamp: Date.now() }
    })
  }, [send])

  return {
    presenceMap,
    updatePresence
  }
}

// Hook for parent-specific real-time updates
export const useParentRealTimeUpdates = (studentId?: string) => {
  const notifications = useRealTimeNotifications()
  const dataUpdates = useRealTimeDataUpdates(['dashboard', 'wellbeing', 'community', 'analytics'])
  const { subscribe } = useWebSocket()
  
  const [childUpdates, setChildUpdates] = useState<any[]>([])

  useEffect(() => {
    if (!studentId) return

    const unsubscribe = subscribe(`child_update_${studentId}`, (update: any) => {
      setChildUpdates(prev => [update, ...prev.slice(0, 9)]) // Keep last 10
    })

    return unsubscribe
  }, [studentId, subscribe])

  return {
    notifications,
    dataUpdates,
    childUpdates,
    hasUpdates: notifications.unreadCount > 0 || childUpdates.length > 0
  }
}

// Cleanup function
export const cleanupWebSocket = () => {
  if (wsManager) {
    wsManager.disconnect()
    wsManager = null
  }
}

export default {
  useWebSocket,
  useRealTimeNotifications,
  useRealTimeDataUpdates,
  useUserPresence,
  useParentRealTimeUpdates,
  cleanupWebSocket
}
