'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  MessageSquare, 
  Shield, 
  Megaphone,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtime } from './RealtimeProvider';
import { RealtimeNotification } from '@/lib/realtime';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  // Safe realtime context usage with comprehensive error handling
  const [manager, setManager] = useState<any>(null);
  const [markNotificationAsRead, setMarkNotificationAsRead] = useState<any>(null);
  
  useEffect(() => {
    try {
      const realtimeContext = useRealtime();
      if (realtimeContext) {
        setManager(realtimeContext.manager);
        setMarkNotificationAsRead(() => realtimeContext.markNotificationAsRead);
      }
    } catch (error) {
      console.warn('Realtime context not available:', error);
      setManager(null);
      setMarkNotificationAsRead(null);
    }
  }, []);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from API
      const mockNotifications: RealtimeNotification[] = [
        {
          id: '1',
          user_id: 'current_user',
          type: 'emergency',
          title: '🚨 Emergency Alert',
          message: 'Safety incident reported in classroom 3B',
          data: { incident_id: 'inc_123', severity: 'high' },
          is_read: false,
          created_at: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: '2',
          user_id: 'current_user',
          type: 'moderation',
          title: '⚠️ Content Flagged',
          message: 'Message from student requires review',
          data: { message_id: 'msg_456', risk_level: 'medium' },
          is_read: false,
          created_at: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          id: '3',
          user_id: 'current_user',
          type: 'message',
          title: '💬 New Message',
          message: 'Parent Sarah Johnson sent you a message',
          data: { channel_id: 'ch_789', sender_name: 'Sarah Johnson' },
          is_read: true,
          created_at: new Date(Date.now() - 30 * 60000).toISOString()
        },
        {
          id: '4',
          user_id: 'current_user',
          type: 'announcement',
          title: '📢 Class Announcement',
          message: 'New homework assignment posted for Math class',
          data: { class_id: 'class_101', teacher_name: 'Ms. Smith' },
          is_read: true,
          created_at: new Date(Date.now() - 60 * 60000).toISOString()
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (markNotificationAsRead && manager) {
        await markNotificationAsRead(notificationId);
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <Shield className="w-5 h-5 text-red-500" />;
      case 'moderation': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? 'opacity-60' : '';
    switch (type) {
      case 'emergency': return `bg-red-50 border-red-200 ${opacity}`;
      case 'moderation': return `bg-yellow-50 border-yellow-200 ${opacity}`;
      case 'message': return `bg-blue-50 border-blue-200 ${opacity}`;
      case 'announcement': return `bg-purple-50 border-purple-200 ${opacity}`;
      default: return `bg-gray-50 border-gray-200 ${opacity}`;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Notification Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <span>Notifications</span>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {notifications.filter(n => !n.is_read).length}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <Bell className="w-12 h-12 mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getNotificationColor(notification.type, notification.is_read)}`}
                          onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`text-sm font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-1 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTimeAgo(notification.created_at)}</span>
                                </div>
                                {notification.is_read ? (
                                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                                    <Eye className="w-3 h-3" />
                                    <span>Read</span>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
