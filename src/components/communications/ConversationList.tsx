'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Shield, 
  AlertTriangle,
  Search,
  Plus,
  MoreVertical,
  Archive,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/hooks/useAuth';

interface Conversation {
  id: string;
  type: 'direct' | 'class_announcement' | 'emergency';
  participants: {
    id: string;
    name: string;
    role: string;
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    senderName: string;
  } | null;
  unreadCount: number;
  isArchived: boolean;
  isFlagged: boolean;
  isStarred: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation?: () => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  loading = false
}: ConversationListProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv => 
        conv.participants.some(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'class_announcement') {
      return 'Class Announcements';
    }
    
    const otherParticipants = conversation.participants.filter(p => p.id !== profile?.id);
    if (otherParticipants.length === 1) {
      return otherParticipants[0].name;
    }
    
    return otherParticipants.map(p => p.name).join(', ');
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.type === 'class_announcement') {
      return 'Teacher announcements and updates';
    }
    
    const otherParticipants = conversation.participants.filter(p => p.id !== profile?.id);
    return otherParticipants.map(p => p.role).join(', ');
  };

  const getConversationIcon = (conversation: Conversation) => {
    switch (conversation.type) {
      case 'class_announcement': return <Users className="w-5 h-5 text-purple-500" />;
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    // In production, this would call API
    console.log('Archive conversation:', conversationId);
  };

  const handleStarConversation = async (conversationId: string) => {
    // In production, this would call API
    console.log('Star conversation:', conversationId);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          {onCreateConversation && (
            <Button
              onClick={onCreateConversation}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-center">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && onCreateConversation && (
              <Button
                variant="outline"
                onClick={onCreateConversation}
                className="mt-4"
              >
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-sm ${
                    selectedConversationId === conversation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${conversation.isArchived ? 'opacity-60' : ''}`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Avatar/Icon */}
                      <div className="flex-shrink-0">
                        {conversation.type === 'direct' && conversation.participants.length === 2 ? (
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {getConversationTitle(conversation).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            {getConversationIcon(conversation)}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {getConversationTitle(conversation)}
                          </h3>
                          <div className="flex items-center space-x-1 ml-2">
                            {conversation.isStarred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            {conversation.isFlagged && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Badge>
                            )}
                            
                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStarConversation(conversation.id);
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-2" />
                                  {conversation.isStarred ? 'Unstar' : 'Star'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveConversation(conversation.id);
                                  }}
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          {getConversationSubtitle(conversation)}
                        </p>
                        
                        {/* Last Message */}
                        {conversation.lastMessage ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate flex-1">
                              <span className="font-medium">
                                {conversation.lastMessage.senderName}:
                              </span>{' '}
                              {conversation.lastMessage.content}
                            </p>
                            <div className="flex items-center space-x-1 ml-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(conversation.lastMessage.timestamp)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No messages yet</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
