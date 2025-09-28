'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Eye, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Bell,
  Search,
  User,
  Clock,
  Send,
  Settings,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AuthGuard } from '@/components/auth/auth-guard';

interface Child {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName: string;
}

interface Conversation {
  id: string;
  teacherId: string;
  teacherName: string;
  childId: string;
  childName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isEncrypted: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
  isFlagged: boolean;
}

interface ChildMessage {
  id: string;
  childId: string;
  teacherId: string;
  content: string;
  timestamp: string;
  direction: 'sent' | 'received';
  isRead: boolean;
}

function ParentCommunicationsContent() {
  const [children, setChildren] = useState<Child[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [childMessages, setChildMessages] = useState<ChildMessage[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from API
      setChildren([
        {
          id: 'child_1',
          name: 'Emma Johnson',
          grade: '5th Grade',
          teacherId: 'teacher_1',
          teacherName: 'Ms. Smith'
        },
        {
          id: 'child_2',
          name: 'Jake Johnson',
          grade: '3rd Grade',
          teacherId: 'teacher_2',
          teacherName: 'Mr. Davis'
        }
      ]);

      setConversations([
        {
          id: 'conv_1',
          teacherId: 'teacher_1',
          teacherName: 'Ms. Smith',
          childId: 'child_1',
          childName: 'Emma Johnson',
          lastMessage: 'Emma is doing very well in math this week',
          lastMessageTime: '2024-01-15T14:30:00Z',
          unreadCount: 0,
          isEncrypted: true
        },
        {
          id: 'conv_2',
          teacherId: 'teacher_2',
          teacherName: 'Mr. Davis',
          childId: 'child_2',
          childName: 'Jake Johnson',
          lastMessage: 'Thank you for your support with Jake\'s reading',
          lastMessageTime: '2024-01-14T16:45:00Z',
          unreadCount: 1,
          isEncrypted: true
        }
      ]);

      setChildMessages([
        {
          id: 'child_msg_1',
          childId: 'child_1',
          teacherId: 'teacher_1',
          content: 'Can you help me understand the math homework?',
          timestamp: '2024-01-15T10:15:00Z',
          direction: 'sent',
          isRead: true
        },
        {
          id: 'child_msg_2',
          childId: 'child_1',
          teacherId: 'teacher_1',
          content: 'Of course! Let\'s work through problem 3 together.',
          timestamp: '2024-01-15T10:20:00Z',
          direction: 'received',
          isRead: true
        },
        {
          id: 'child_msg_3',
          childId: 'child_1',
          teacherId: 'teacher_1',
          content: 'Thank you! That makes much more sense now.',
          timestamp: '2024-01-15T10:25:00Z',
          direction: 'sent',
          isRead: true
        }
      ]);
    } catch (error: any) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Mock messages - in production, this would fetch from API
      const mockMessages: Message[] = [
        {
          id: 'msg_1',
          senderId: 'parent_current',
          senderName: 'You',
          senderRole: 'parent',
          content: 'Hi Ms. Smith, I wanted to ask about Emma\'s progress in math class.',
          timestamp: '2024-01-15T14:00:00Z',
          isEncrypted: true,
          isFlagged: false
        },
        {
          id: 'msg_2',
          senderId: 'teacher_1',
          senderName: 'Ms. Smith',
          senderRole: 'teacher',
          content: 'Hello! Emma is doing very well. She\'s shown great improvement in problem-solving.',
          timestamp: '2024-01-15T14:15:00Z',
          isEncrypted: true,
          isFlagged: false
        },
        {
          id: 'msg_3',
          senderId: 'teacher_1',
          senderName: 'Ms. Smith',
          senderRole: 'teacher',
          content: 'Emma is doing very well in math this week',
          timestamp: '2024-01-15T14:30:00Z',
          isEncrypted: true,
          isFlagged: false
        }
      ];
      setMessages(mockMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      // In production, this would call the secure API
      const response = await fetch('/api/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedConversation,
          content: newMessage,
          recipientId: conversation.teacherId,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add message to local state
        const newMsg: Message = {
          id: result.messageId,
          senderId: 'parent_current',
          senderName: 'You',
          senderRole: 'parent',
          content: newMessage,
          timestamp: new Date().toISOString(),
          isEncrypted: true,
          isFlagged: false
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');

        // Update conversation last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
              : conv
          )
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  const acknowledgeChildMessage = async (messageId: string) => {
    try {
      // In production, this would mark the message as acknowledged
      setChildMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error: any) {
      console.error('Error acknowledging message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChildMessages = (childId: string) => {
    return childMessages.filter(msg => msg.childId === childId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Communication Hub</h1>
              <p className="text-gray-600">Stay connected with your children's teachers</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
              <span className="text-sm text-gray-600">Notifications</span>
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </motion.div>

        {/* Children Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {children.map((child) => (
            <Card key={child.id} className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-blue-900">{child.name}</h3>
                    <p className="text-sm text-blue-600">{child.grade}</p>
                  </div>
                  <User className="w-8 h-8 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">
                    <strong>Teacher:</strong> {child.teacherName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">Recent Messages</span>
                    <Badge className="bg-blue-500 text-white">
                      {getChildMessages(child.id).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="teacher-chat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teacher-chat" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Teacher Messages</span>
              </TabsTrigger>
              <TabsTrigger value="child-messages" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Child's Messages</span>
              </TabsTrigger>
            </TabsList>

            {/* Teacher Chat Tab */}
            <TabsContent value="teacher-chat">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversation List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Teacher Conversations</span>
                      <Badge variant="outline">{filteredConversations.length}</Badge>
                    </CardTitle>
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {filteredConversations.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 cursor-pointer border-b transition-colors ${
                            selectedConversation === conversation.id
                              ? 'bg-green-50 border-green-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setSelectedConversation(conversation.id);
                            loadMessages(conversation.id);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {conversation.teacherName}
                              </span>
                              <Shield className="w-3 h-3 text-green-500" />
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Child:</strong> {conversation.childName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conversation.lastMessageTime).toLocaleString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                  {selectedConversation ? (
                    <>
                      <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <CardTitle>
                                {conversations.find(c => c.id === selectedConversation)?.teacherName}
                              </CardTitle>
                              <CardDescription className="flex items-center space-x-2">
                                <span>
                                  Re: {conversations.find(c => c.id === selectedConversation)?.childName}
                                </span>
                                <div className="flex items-center space-x-1 text-green-600">
                                  <Lock className="w-3 h-3" />
                                  <span className="text-xs">End-to-End Encrypted</span>
                                </div>
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${
                                message.senderId === 'parent_current' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderId === 'parent_current'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className={`text-xs ${
                                    message.senderId === 'parent_current' ? 'text-green-100' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </p>
                                  <Shield className={`w-3 h-3 ${
                                    message.senderId === 'parent_current' ? 'text-green-200' : 'text-green-500'
                                  }`} />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Message Input */}
                        <div className="border-t p-4">
                          <div className="flex space-x-3">
                            <Textarea
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="flex-1 min-h-[60px] resize-none"
                              onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                            />
                            <Button
                              onClick={sendMessage}
                              disabled={!newMessage.trim()}
                              className="self-end bg-green-600 hover:bg-green-700"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a conversation to start messaging</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Child Messages Tab */}
            <TabsContent value="child-messages">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Child Selection */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Select Child</CardTitle>
                    <CardDescription>View your child's teacher communications</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {children.map((child) => (
                        <motion.div
                          key={child.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 cursor-pointer border-b transition-colors ${
                            selectedChild === child.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedChild(child.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{child.name}</p>
                              <p className="text-sm text-gray-600">{child.grade}</p>
                              <p className="text-sm text-gray-500">Teacher: {child.teacherName}</p>
                            </div>
                            <Badge variant="outline">
                              {getChildMessages(child.id).length}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Child Messages Display */}
                <Card className="lg:col-span-2">
                  {selectedChild ? (
                    <>
                      <CardHeader className="border-b">
                        <CardTitle className="flex items-center space-x-2">
                          <Eye className="w-5 h-5 text-blue-500" />
                          <span>{children.find(c => c.id === selectedChild)?.name}'s Messages</span>
                        </CardTitle>
                        <CardDescription>
                          Transparent view of your child's teacher communications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {getChildMessages(selectedChild).map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${
                                message.direction === 'sent' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.direction === 'sent'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className={`text-xs ${
                                    message.direction === 'sent' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {message.direction === 'sent' ? 'Your child' : 'Teacher'} • {new Date(message.timestamp).toLocaleTimeString()}
                                  </p>
                                  {!message.isRead && message.direction === 'sent' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs text-blue-200 hover:text-white"
                                      onClick={() => acknowledgeChildMessage(message.id)}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Acknowledge
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        {getChildMessages(selectedChild).length === 0 && (
                          <div className="text-center text-gray-500 py-8">
                            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No messages yet for this child</p>
                          </div>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a child to view their messages</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

export default function ParentCommunications() {
  return (
    <AuthGuard requiredRole="parent">
      <ParentCommunicationsContent />
    </AuthGuard>
  );
}
