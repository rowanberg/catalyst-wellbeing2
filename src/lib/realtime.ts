import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealtimeMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  encrypted_content?: string;
  message_type: 'text' | 'announcement' | 'emergency';
  created_at: string;
  is_flagged: boolean;
}

export interface RealtimeNotification {
  id: string;
  user_id: string;
  type: 'message' | 'emergency' | 'moderation' | 'announcement';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface RealtimeEmergencyIncident {
  id: string;
  incident_type: string;
  reporter_id: string;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  created_at: string;
}

export class RealtimeManager {
  private supabase = supabase;
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageCallbacks: Map<string, (message: RealtimeMessage) => void> = new Map();
  private notificationCallbacks: Set<(notification: RealtimeNotification) => void> = new Set();
  private emergencyCallbacks: Set<(incident: RealtimeEmergencyIncident) => void> = new Set();
  private userId: string | null = null;

  async initialize(userId: string) {
    this.userId = userId;
    
    // Subscribe to user notifications
    await this.subscribeToNotifications();
    
    // Subscribe to emergency incidents (for admins)
    await this.subscribeToEmergencyIncidents();
  }

  async subscribeToChannel(channelId: string, onMessage: (message: RealtimeMessage) => void) {
    if (this.channels.has(channelId)) {
      // Update callback for existing channel
      this.messageCallbacks.set(channelId, onMessage);
      return;
    }

    const channel = this.supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'secure_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessage>) => {
          if (payload.new) {
            onMessage(payload.new as RealtimeMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'secure_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessage>) => {
          if (payload.new) {
            onMessage(payload.new as RealtimeMessage);
          }
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);
    this.messageCallbacks.set(channelId, onMessage);
  }

  async unsubscribeFromChannel(channelId: string) {
    const channel = this.channels.get(channelId);
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelId);
      this.messageCallbacks.delete(channelId);
    }
  }

  private async subscribeToNotifications() {
    if (!this.userId) return;

    const channel = this.supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload: RealtimePostgresChangesPayload<RealtimeNotification>) => {
          if (payload.new) {
            this.notificationCallbacks.forEach(callback => {
              callback(payload.new as RealtimeNotification);
            });
          }
        }
      )
      .subscribe();

    this.channels.set('notifications', channel);
  }

  private async subscribeToEmergencyIncidents() {
    if (!this.userId) return;

    // Check if user is admin
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', this.userId)
      .single();

    if (profile?.role !== 'admin') return;

    const channel = this.supabase
      .channel('emergency_incidents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_incidents'
        },
        (payload: RealtimePostgresChangesPayload<RealtimeEmergencyIncident>) => {
          if (payload.new) {
            this.emergencyCallbacks.forEach(callback => {
              callback(payload.new as RealtimeEmergencyIncident);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_incidents'
        },
        (payload: RealtimePostgresChangesPayload<RealtimeEmergencyIncident>) => {
          if (payload.new) {
            this.emergencyCallbacks.forEach(callback => {
              callback(payload.new as RealtimeEmergencyIncident);
            });
          }
        }
      )
      .subscribe();

    this.channels.set('emergency', channel);
  }

  onNotification(callback: (notification: RealtimeNotification) => void) {
    this.notificationCallbacks.add(callback);
  }

  offNotification(callback: (notification: RealtimeNotification) => void) {
    this.notificationCallbacks.delete(callback);
  }

  onEmergencyIncident(callback: (incident: RealtimeEmergencyIncident) => void) {
    this.emergencyCallbacks.add(callback);
  }

  offEmergencyIncident(callback: (incident: RealtimeEmergencyIncident) => void) {
    this.emergencyCallbacks.delete(callback);
  }

  async sendMessage(channelId: string, content: string, messageType: 'text' | 'announcement' | 'emergency' = 'text') {
    try {
      const response = await fetch('/api/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          content,
          messageType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  }

  async getUnreadNotificationCount(): Promise<number> {
    if (!this.userId) return 0;

    try {
      const { count, error } = await this.supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread notification count:', error);
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  async createNotification(
    userId: string, 
    type: RealtimeNotification['type'], 
    title: string, 
    message: string, 
    data: any = {}
  ) {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          is_read: false
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error: any) {
      console.error('Error creating notification:', error);
    }
  }

  async cleanup() {
    // Unsubscribe from all channels
    for (const [channelId, channel] of Array.from(this.channels.entries())) {
      await this.supabase.removeChannel(channel);
    }
    
    this.channels.clear();
    this.messageCallbacks.clear();
    this.notificationCallbacks.clear();
    this.emergencyCallbacks.clear();
  }
}

// Global realtime manager instance
let realtimeManager: RealtimeManager | null = null;

export const getRealtimeManager = (): RealtimeManager => {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager();
  }
  return realtimeManager;
};

export const initializeRealtime = async (userId: string) => {
  const manager = getRealtimeManager();
  await manager.initialize(userId);
  return manager;
};

// Notification utility functions
export const showBrowserNotification = (title: string, message: string, options: NotificationOptions = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Emergency notification sound
export const playEmergencySound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create emergency alert tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);
  } catch (error: any) {
    console.warn('Could not play emergency sound:', error);
  }
};
