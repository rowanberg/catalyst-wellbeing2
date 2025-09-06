'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Flag, 
  Trash2, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRealtime } from './RealtimeProvider';
import { RealtimeMessage } from '@/lib/realtime';

interface Message extends RealtimeMessage {
  isFromCurrentUser?: boolean;
  isEncrypted?: boolean;
  isDeleted?: boolean;
  flaggedReason?: string;
}

interface MessageThreadProps {
  channelId: string;
  messages: Message[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function MessageThread({ 
  channelId, 
  messages, 
  onLoadMore, 
  hasMore = false, 
  loading = false 
}: MessageThreadProps) {
  const { profile } = useAuth();
  const { subscribeToChannel, unsubscribeFromChannel } = useRealtime();
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (channelId) {
      // Subscribe to real-time messages
      subscribeToChannel(channelId, (newMessage: RealtimeMessage) => {
        setLocalMessages(prev => {
          // Check if message already exists
          if (prev.find(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage as Message];
        });
      });

      return () => {
        unsubscribeFromChannel(channelId);
      };
    }
  }, [channelId, subscribeToChannel, unsubscribeFromChannel]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [localMessages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/communications/messages?messageId=${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLocalMessages(prev => 
          prev.map(m => 
            m.id === messageId 
              ? { ...m, content: '[Message deleted]', isDeleted: true }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleFlagMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/communications/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reason: 'inappropriate_content' })
      });

      if (response.ok) {
        setLocalMessages(prev => 
          prev.map(m => 
            m.id === messageId 
              ? { ...m, is_flagged: true, flaggedReason: 'Flagged by user' }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.isDeleted) return <Trash2 className="w-3 h-3 text-gray-400" />;
    if (message.is_flagged) return <Flag className="w-3 h-3 text-red-500" />;
    if (message.isEncrypted) return <Lock className="w-3 h-3 text-blue-500" />;
    return null;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'parent': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canDeleteMessage = (message: Message) => {
    return message.isFromCurrentUser || profile?.role === 'admin';
  };

  const canFlagMessage = (message: Message) => {
    return !message.isFromCurrentUser && !message.is_flagged;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 text-center border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load older messages'}
          </Button>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {localMessages.map((message, index) => {
            const showAvatar = index === 0 || 
              localMessages[index - 1]?.sender_id !== message.sender_id ||
              new Date(message.created_at).getTime() - new Date(localMessages[index - 1]?.created_at).getTime() > 300000; // 5 minutes

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${message.isFromCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {showAvatar && !message.isFromCurrentUser && (
                    <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {message.sender_name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`relative group ${showAvatar && !message.isFromCurrentUser ? '' : 'ml-10'}`}>
                    {/* Sender Info */}
                    {showAvatar && (
                      <div className={`flex items-center space-x-2 mb-1 ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-medium text-gray-600">
                          {message.isFromCurrentUser ? 'You' : message.sender_name}
                        </span>
                        <Badge variant="outline" className={`text-xs ${getRoleColor(message.sender_role)}`}>
                          {message.sender_role}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div
                      className={`px-4 py-2 rounded-lg relative ${
                        message.isFromCurrentUser
                          ? message.isDeleted 
                            ? 'bg-gray-100 text-gray-500'
                            : message.is_flagged
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-blue-600 text-white'
                          : message.isDeleted
                          ? 'bg-gray-100 text-gray-500'
                          : message.is_flagged
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {/* Message Text */}
                      <p className={`text-sm ${message.isDeleted ? 'italic' : ''}`}>
                        {message.content}
                      </p>
                      
                      {/* Message Status Icons */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          {getMessageStatusIcon(message)}
                          {message.is_flagged && message.flaggedReason && (
                            <span className="text-xs opacity-70">
                              {message.flaggedReason}
                            </span>
                          )}
                        </div>
                        
                        {!showAvatar && (
                          <span className={`text-xs ${message.isFromCurrentUser ? 'text-blue-100' : 'text-gray-400'}`}>
                            {formatTimestamp(message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      {/* Message Actions */}
                      {!message.isDeleted && (canDeleteMessage(message) || canFlagMessage(message)) && (
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full shadow-sm"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canFlagMessage(message) && (
                                <DropdownMenuItem
                                  onClick={() => handleFlagMessage(message.id)}
                                  className="text-yellow-600"
                                >
                                  <Flag className="w-4 h-4 mr-2" />
                                  Flag message
                                </DropdownMenuItem>
                              )}
                              {canDeleteMessage(message) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete message
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Empty State */}
        {localMessages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Shield className="w-12 h-12 mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
