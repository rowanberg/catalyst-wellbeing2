'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings,
  Bell,
  Search,
  Filter,
  Plus,
  Mic,
  MicOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'parent' | 'student';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isEncrypted: boolean;
  status: 'active' | 'archived';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
  isFlagged: boolean;
  contentScore: number;
}

interface OfficeHours {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

function TeacherCommunicationsContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [officeHours, setOfficeHours] = useState<OfficeHours[]>([]);
  const [isOfficeHoursActive, setIsOfficeHoursActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    loadData();
    checkOfficeHours();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from API
      setConversations([
        {
          id: 'conv_1',
          participantId: 'parent_123',
          participantName: 'Sarah Johnson',
          participantRole: 'parent',
          lastMessage: 'Thank you for the update on Emma\'s progress',
          lastMessageTime: '2024-01-15T14:30:00Z',
          unreadCount: 0,
          isEncrypted: true,
          status: 'active'
        },
        {
          id: 'conv_2',
          participantId: 'student_456',
          participantName: 'Alex Wilson',
          participantRole: 'student',
          lastMessage: 'Can you help me understand the math homework?',
          lastMessageTime: '2024-01-15T10:15:00Z',
          unreadCount: 1,
          isEncrypted: false,
          status: 'active'
        },
        {
          id: 'conv_3',
          participantId: 'parent_789',
          participantName: 'Michael Davis',
          participantRole: 'parent',
          lastMessage: 'When is the next parent-teacher conference?',
          lastMessageTime: '2024-01-14T16:45:00Z',
          unreadCount: 2,
          isEncrypted: true,
          status: 'active'
        }
      ]);

      setOfficeHours([
        { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isActive: true },
        { id: '2', dayOfWeek: 3, startTime: '14:00', endTime: '15:00', isActive: true },
        { id: '3', dayOfWeek: 5, startTime: '11:00', endTime: '12:00', isActive: true }
      ]);
    } catch (error: any) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOfficeHours = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const isActive = officeHours.some(hours => {
      if (!hours.isActive || hours.dayOfWeek !== currentDay) return false;
      
      const [startHour, startMin] = hours.startTime.split(':').map(Number);
      const [endHour, endMin] = hours.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      return currentTime >= startMinutes && currentTime <= endMinutes;
    });

    setIsOfficeHoursActive(isActive);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Mock messages - in production, this would fetch from API
      const mockMessages: Message[] = [
        {
          id: 'msg_1',
          senderId: 'parent_123',
          senderName: 'Sarah Johnson',
          content: 'Hi Ms. Smith, I wanted to ask about Emma\'s progress in math class.',
          timestamp: '2024-01-15T14:00:00Z',
          isEncrypted: true,
          isFlagged: false,
          contentScore: 0.95
        },
        {
          id: 'msg_2',
          senderId: 'teacher_current',
          senderName: 'You',
          content: 'Hello Sarah! Emma is doing very well. She\'s shown great improvement in problem-solving.',
          timestamp: '2024-01-15T14:15:00Z',
          isEncrypted: true,
          isFlagged: false,
          contentScore: 0.98
        },
        {
          id: 'msg_3',
          senderId: 'parent_123',
          senderName: 'Sarah Johnson',
          content: 'Thank you for the update on Emma\'s progress',
          timestamp: '2024-01-15T14:30:00Z',
          isEncrypted: true,
          isFlagged: false,
          contentScore: 0.99
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
          recipientId: conversation.participantId,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add message to local state
        const newMsg: Message = {
          id: result.messageId,
          senderId: 'teacher_current',
          senderName: 'You',
          content: newMessage,
          timestamp: new Date().toISOString(),
          isEncrypted: conversation.isEncrypted,
          isFlagged: false,
          contentScore: result.contentAnalysis?.safetyScore || 1.0
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

  const reportConversation = async (conversationId: string) => {
    try {
      // In production, this would report to admin
      console.log('Reporting conversation:', conversationId);
      // Show success message
    } catch (error: any) {
      console.error('Error reporting conversation:', error);
    }
  };

  const sendClassAnnouncement = async (announcement: string) => {
    try {
      // In production, this would send to all parents in class
      console.log('Sending class announcement:', announcement);
      // Show success message
    } catch (error: any) {
      console.error('Error sending announcement:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || conv.participantRole === filterRole;
    return matchesSearch && matchesRole;
  });

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Communications</h1>
              <p className="text-gray-600">Secure messaging with parents and students</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isOfficeHoursActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isOfficeHoursActive ? 'Office Hours Active' : 'Outside Office Hours'}
              </span>
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="conversations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversations" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Conversations</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Class Announcements</span>
              </TabsTrigger>
              <TabsTrigger value="office-hours" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Office Hours</span>
              </TabsTrigger>
            </TabsList>

            {/* Conversations Tab */}
            <TabsContent value="conversations">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversation List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Conversations</span>
                      <Badge variant="outline">{filteredConversations.length}</Badge>
                    </CardTitle>
                    <div className="space-y-3">
                      <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="parent">Parents</SelectItem>
                          <SelectItem value="student">Students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {filteredConversations.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 cursor-pointer border-b transition-colors ${
                            selectedConversation === conversation.id
                              ? 'bg-blue-50 border-blue-200'
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
                                {conversation.participantName}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={
                                  conversation.participantRole === 'parent' 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-blue-50 text-blue-700'
                                }
                              >
                                {conversation.participantRole}
                              </Badge>
                              {conversation.isEncrypted && (
                                <Shield className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
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
                                {conversations.find(c => c.id === selectedConversation)?.participantName}
                              </CardTitle>
                              <CardDescription className="flex items-center space-x-2">
                                <span>
                                  {conversations.find(c => c.id === selectedConversation)?.participantRole}
                                </span>
                                {conversations.find(c => c.id === selectedConversation)?.isEncrypted && (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Shield className="w-3 h-3" />
                                    <span className="text-xs">Encrypted</span>
                                  </div>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reportConversation(selectedConversation)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Report
                            </Button>
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
                                message.senderId === 'teacher_current' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderId === 'teacher_current'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className={`text-xs ${
                                    message.senderId === 'teacher_current' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </p>
                                  {message.isEncrypted && (
                                    <Shield className={`w-3 h-3 ${
                                      message.senderId === 'teacher_current' ? 'text-blue-200' : 'text-green-500'
                                    }`} />
                                  )}
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
                              className="self-end"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                          {conversations.find(c => c.id === selectedConversation)?.participantRole === 'student' && !isOfficeHoursActive && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Student messaging is only available during office hours
                            </div>
                          )}
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

            {/* Class Announcements Tab */}
            <TabsContent value="announcements">
              <Card>
                <CardHeader>
                  <CardTitle>Class Announcements</CardTitle>
                  <CardDescription>Send important updates to all parents in your class</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write your class announcement here..."
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Switch id="urgent" />
                        <label htmlFor="urgent" className="text-sm font-medium">
                          Mark as urgent
                        </label>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Send className="w-4 h-4 mr-2" />
                        Send Announcement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Office Hours Tab */}
            <TabsContent value="office-hours">
              <Card>
                <CardHeader>
                  <CardTitle>Office Hours Configuration</CardTitle>
                  <CardDescription>Set when students can message you directly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {officeHours.map((hours) => (
                        <div key={hours.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{getDayName(hours.dayOfWeek)}</h3>
                            <Switch
                              checked={hours.isActive}
                              onCheckedChange={(checked) => {
                                setOfficeHours(prev =>
                                  prev.map(h => h.id === hours.id ? { ...h, isActive: checked } : h)
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={hours.startTime}
                                onChange={(e) => {
                                  setOfficeHours(prev =>
                                    prev.map(h => h.id === hours.id ? { ...h, startTime: e.target.value } : h)
                                  );
                                }}
                                className="text-sm"
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <Input
                                type="time"
                                value={hours.endTime}
                                onChange={(e) => {
                                  setOfficeHours(prev =>
                                    prev.map(h => h.id === hours.id ? { ...h, endTime: e.target.value } : h)
                                  );
                                }}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Office Hours
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherCommunications() {
  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <TeacherCommunicationsContent />
    </UnifiedAuthGuard>
  );
}
