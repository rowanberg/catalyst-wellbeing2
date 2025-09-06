'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  RealtimeManager, 
  RealtimeMessage, 
  RealtimeNotification, 
  RealtimeEmergencyIncident,
  getRealtimeManager,
  showBrowserNotification,
  playEmergencySound
} from '@/lib/realtime';

interface RealtimeContextType {
  manager: RealtimeManager | null;
  unreadCount: number;
  isConnected: boolean;
  subscribeToChannel: (channelId: string, onMessage: (message: RealtimeMessage) => void) => Promise<void>;
  unsubscribeFromChannel: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, messageType?: 'text' | 'announcement' | 'emergency') => Promise<any>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, profile } = useAuth();
  const [manager, setManager] = useState<RealtimeManager | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const initializeRealtime = async () => {
      try {
        const realtimeManager = getRealtimeManager();
        await realtimeManager.initialize(user.id);
        
        // Set up notification handler
        realtimeManager.onNotification((notification: RealtimeNotification) => {
          // Update unread count
          updateUnreadCount();
          
          // Show browser notification
          showBrowserNotification(notification.title, notification.message, {
            tag: notification.type,
            requireInteraction: notification.type === 'emergency'
          });
          
          // Play sound for emergency notifications
          if (notification.type === 'emergency') {
            playEmergencySound();
          }
        });

        // Set up emergency incident handler (for admins)
        if (profile?.role === 'admin') {
          realtimeManager.onEmergencyIncident((incident: RealtimeEmergencyIncident) => {
            // Show critical notification
            showBrowserNotification(
              '🚨 EMERGENCY INCIDENT',
              `${incident.incident_type.toUpperCase()}: ${incident.description}`,
              {
                tag: 'emergency',
                requireInteraction: true,
                icon: '/emergency-icon.png'
              }
            );
            
            // Play emergency sound
            playEmergencySound();
            
            // Update unread count
            updateUnreadCount();
          });
        }

        setManager(realtimeManager);
        setIsConnected(true);
        
        // Get initial unread count
        updateUnreadCount();
        
      } catch (error) {
        console.error('Failed to initialize realtime:', error);
        setIsConnected(false);
      }
    };

    initializeRealtime();

    return () => {
      if (manager) {
        manager.cleanup();
      }
    };
  }, [user?.id, profile?.role]);

  const updateUnreadCount = async () => {
    if (manager) {
      const count = await manager.getUnreadNotificationCount();
      setUnreadCount(count);
    }
  };

  const subscribeToChannel = async (channelId: string, onMessage: (message: RealtimeMessage) => void) => {
    if (manager) {
      await manager.subscribeToChannel(channelId, onMessage);
    }
  };

  const unsubscribeFromChannel = async (channelId: string) => {
    if (manager) {
      await manager.unsubscribeFromChannel(channelId);
    }
  };

  const sendMessage = async (channelId: string, content: string, messageType: 'text' | 'announcement' | 'emergency' = 'text') => {
    if (manager) {
      return await manager.sendMessage(channelId, content, messageType);
    }
    throw new Error('Realtime manager not initialized');
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (manager) {
      await manager.markNotificationAsRead(notificationId);
      updateUnreadCount();
    }
  };

  const contextValue: RealtimeContextType = {
    manager,
    unreadCount,
    isConnected,
    subscribeToChannel,
    unsubscribeFromChannel,
    sendMessage,
    markNotificationAsRead
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}
