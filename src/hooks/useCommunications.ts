'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import { useRealtime } from '@/components/communications/RealtimeProvider';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  encryptedContent?: string;
  messageType: 'text' | 'announcement' | 'emergency';
  timestamp: string;
  isFlagged: boolean;
  flaggedReason?: string;
  isFromCurrentUser: boolean;
  isEncrypted?: boolean;
  isDeleted?: boolean;
}

interface Channel {
  id: string;
  type: 'direct' | 'class_announcement' | 'emergency';
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  isEncrypted: boolean;
  createdAt: string;
}

interface UseCommunicationsReturn {
  channels: Channel[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  selectedChannelId: string | null;
  loadChannels: () => Promise<void>;
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, messageType?: 'text' | 'announcement' | 'emergency') => Promise<void>;
  createChannel: (participantIds: string[], channelType: 'direct' | 'class_announcement', isEncrypted?: boolean) => Promise<string>;
  selectChannel: (channelId: string) => void;
  markMessagesAsRead: (channelId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  flagMessage: (messageId: string, reason: string) => Promise<void>;
}

export function useCommunications(): UseCommunicationsReturn {
  const { user, profile } = useAppSelector((state) => state.auth);
  const { subscribeToChannel, unsubscribeFromChannel, sendMessage: realtimeSendMessage } = useRealtime();
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/communications/channels');
      if (!response.ok) {
        throw new Error('Failed to load channels');
      }
      
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
      console.error('Error loading channels:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/communications/messages?channelId=${channelId}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Subscribe to real-time updates for this channel
      await subscribeToChannel(channelId, (newMessage) => {
        setMessages(prev => {
          // Check if message already exists
          if (prev.find(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender_name,
            senderRole: newMessage.sender_role,
            content: newMessage.content,
            encryptedContent: newMessage.encrypted_content,
            messageType: newMessage.message_type,
            timestamp: newMessage.created_at,
            isFlagged: newMessage.is_flagged,
            isFromCurrentUser: newMessage.sender_id === user?.id,
            isEncrypted: !!newMessage.encrypted_content
          }];
        });
      });
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, subscribeToChannel]);

  const sendMessage = useCallback(async (
    channelId: string, 
    content: string, 
    messageType: 'text' | 'announcement' | 'emergency' = 'text'
  ) => {
    if (!channelId || !content.trim()) return;

    try {
      await realtimeSendMessage(channelId, content, messageType);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
      throw err;
    }
  }, [realtimeSendMessage]);

  const createChannel = useCallback(async (
    participantIds: string[], 
    channelType: 'direct' | 'class_announcement', 
    isEncrypted: boolean = false
  ): Promise<string> => {
    try {
      const response = await fetch('/api/communications/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelType,
          participantIds,
          isEncrypted
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      const data = await response.json();
      
      // Reload channels to include the new one
      await loadChannels();
      
      return data.channel.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
      console.error('Error creating channel:', err);
      throw err;
    }
  }, [loadChannels]);

  const selectChannel = useCallback(async (channelId: string) => {
    // Unsubscribe from previous channel
    if (selectedChannelId) {
      await unsubscribeFromChannel(selectedChannelId);
    }
    
    setSelectedChannelId(channelId);
    await loadMessages(channelId);
  }, [selectedChannelId, unsubscribeFromChannel, loadMessages]);

  const markMessagesAsRead = useCallback(async (channelId: string) => {
    try {
      const response = await fetch('/api/communications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/communications/messages?messageId=${messageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Update local state
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, content: '[Message deleted]', isDeleted: true }
            : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      console.error('Error deleting message:', err);
      throw err;
    }
  }, []);

  const flagMessage = useCallback(async (messageId: string, reason: string) => {
    try {
      const response = await fetch('/api/communications/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to flag message');
      }

      // Update local state
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, isFlagged: true, flaggedReason: reason }
            : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag message');
      console.error('Error flagging message:', err);
      throw err;
    }
  }, []);

  // Load channels on mount
  useEffect(() => {
    if (user?.id) {
      loadChannels();
    }
  }, [user?.id, loadChannels]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (selectedChannelId) {
        unsubscribeFromChannel(selectedChannelId);
      }
    };
  }, [selectedChannelId, unsubscribeFromChannel]);

  return {
    channels,
    messages,
    loading,
    error,
    selectedChannelId,
    loadChannels,
    loadMessages,
    sendMessage,
    createChannel,
    selectChannel,
    markMessagesAsRead,
    deleteMessage,
    flagMessage
  };
}
