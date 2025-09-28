'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClientWrapper } from '@/components/providers/ClientWrapper';
import { 
  MessageSquare, 
  Send, 
  Shield, 
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Lightbulb,
  Heart,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ContentAnalysisEngine } from '@/lib/encryption';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  isAvailable: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isFromTeacher: boolean;
}

interface ConversationStarter {
  id: string;
  text: string;
  category: 'question' | 'help' | 'thanks' | 'clarification';
  icon: string;
}

function StudentCommunicationsContent() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOfficeHours, setIsOfficeHours] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationStarters] = useState<ConversationStarter[]>([
    { id: '1', text: 'Can you please explain...', category: 'question', icon: '❓' },
    { id: '2', text: 'I have a question about...', category: 'question', icon: '🤔' },
    { id: '3', text: 'Could you help me understand...', category: 'help', icon: '🆘' },
    { id: '4', text: 'I\'m having trouble with...', category: 'help', icon: '😅' },
    { id: '5', text: 'Thank you for your help with...', category: 'thanks', icon: '🙏' },
    { id: '6', text: 'I appreciate your feedback on...', category: 'thanks', icon: '💝' },
    { id: '7', text: 'Could you clarify...', category: 'clarification', icon: '🔍' },
    { id: '8', text: 'I would like to know more about...', category: 'question', icon: '📚' }
  ]);
  const [contentAnalysis, setContentAnalysis] = useState<any>(null);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  useEffect(() => {
    loadData();
    checkOfficeHours();
    
    // Check office hours every minute
    const interval = setInterval(checkOfficeHours, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from API
      setTeachers([
        {
          id: 'teacher_1',
          name: 'Ms. Smith',
          subject: 'Mathematics',
          isAvailable: true
        },
        {
          id: 'teacher_2',
          name: 'Mr. Davis',
          subject: 'English',
          isAvailable: false
        },
        {
          id: 'teacher_3',
          name: 'Mrs. Johnson',
          subject: 'Science',
          isAvailable: true
        }
      ]);
    } catch (error: any) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOfficeHours = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Mock office hours: weekdays 9 AM to 5 PM
    const isOfficeTime = day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
    setIsOfficeHours(isOfficeTime);
  };

  const loadMessages = async (teacherId: string) => {
    try {
      // Mock messages - in production, this would fetch from API
      const mockMessages: Message[] = [
        {
          id: 'msg_1',
          senderId: 'student_current',
          senderName: 'You',
          senderRole: 'student',
          content: 'Hi Ms. Smith, can you help me understand the math homework?',
          timestamp: '2024-01-15T10:15:00Z',
          isFromTeacher: false
        },
        {
          id: 'msg_2',
          senderId: teacherId,
          senderName: 'Ms. Smith',
          senderRole: 'teacher',
          content: 'Of course! Which problem are you having trouble with?',
          timestamp: '2024-01-15T10:20:00Z',
          isFromTeacher: true
        },
        {
          id: 'msg_3',
          senderId: 'student_current',
          senderName: 'You',
          senderRole: 'student',
          content: 'Problem number 5 is really confusing for me.',
          timestamp: '2024-01-15T10:22:00Z',
          isFromTeacher: false
        }
      ];
      setMessages(mockMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const analyzeMessage = (content: string) => {
    const analysis = ContentAnalysisEngine.analyzeContent(content);
    setContentAnalysis(analysis);
    return analysis;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTeacher || !isOfficeHours) return;

    try {
      const teacher = teachers.find(t => t.id === selectedTeacher);
      if (!teacher) return;

      // Analyze content before sending
      const analysis = analyzeMessage(newMessage);
      
      if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
        // Show warning but don't block - let moderation system handle it
        console.warn('Message flagged for review:', analysis);
      }

      // In production, this would call the secure API
      const response = await fetch('/api/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: `student_teacher_${selectedTeacher}`,
          content: newMessage,
          recipientId: selectedTeacher,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add message to local state
        const newMsg: Message = {
          id: result.messageId,
          senderId: 'student_current',
          senderName: 'You',
          senderRole: 'student',
          content: newMessage,
          timestamp: new Date().toISOString(),
          isFromTeacher: false
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setContentAnalysis(null);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  const handleConversationStarter = (starter: ConversationStarter) => {
    setNewMessage(starter.text);
  };

  const handleEmergencyButton = async () => {
    if (!showEmergencyConfirm) {
      setShowEmergencyConfirm(true);
      return;
    }

    try {
      // Create emergency incident
      const response = await fetch('/api/communications/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType: 'safety_button',
          teacherId: selectedTeacher,
          description: 'Student pressed "I Feel Unsafe" button during conversation'
        })
      });

      if (response.ok) {
        // Archive conversation from student's view
        setMessages([]);
        setSelectedTeacher(null);
        setShowEmergencyConfirm(false);
        
        // Show success message
        alert('Your safety report has been sent to school administrators. You are safe now.');
      }
    } catch (error: any) {
      console.error('Error creating emergency incident:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'help': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'thanks': return 'bg-green-100 text-green-800 border-green-200';
      case 'clarification': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Teacher Connect</h1>
          <p className="text-gray-600 text-lg">Ask questions and get help from your teachers</p>
          
          {/* Office Hours Status */}
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mt-4 ${
            isOfficeHours 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {isOfficeHours ? '🟢 Teachers are available now!' : '🟡 Outside office hours'}
            </span>
          </div>
        </motion.div>

        {/* Teachers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-500" />
                <span>Your Teachers</span>
              </CardTitle>
              <CardDescription>Choose a teacher to start a conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ClientWrapper>
                  {teachers.map((teacher) => (
                    <motion.div
                      key={teacher.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTeacher === teacher.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => {
                        setSelectedTeacher(teacher.id);
                        loadMessages(teacher.id);
                      }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        teacher.isAvailable && isOfficeHours ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.subject}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {teacher.isAvailable && isOfficeHours ? 'Available now' : 'Not available'}
                    </p>
                    </motion.div>
                  ))}
                </ClientWrapper>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Interface */}
        {selectedTeacher && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Conversation Starters */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>Conversation Starters</span>
                </CardTitle>
                <CardDescription>Click to use these helpful phrases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversationStarters.map((starter) => (
                    <motion.button
                      key={starter.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${getCategoryColor(starter.category)} hover:shadow-sm`}
                      onClick={() => handleConversationStarter(starter)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{starter.icon}</span>
                        <span className="text-sm font-medium">{starter.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {teachers.find(t => t.id === selectedTeacher)?.name}
                    </CardTitle>
                    <CardDescription>
                      {teachers.find(t => t.id === selectedTeacher)?.subject} Teacher
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                    onClick={handleEmergencyButton}
                  >
                    {showEmergencyConfirm ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm - I Feel Unsafe
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        I Feel Unsafe
                      </>
                    )}
                  </Button>
                </div>
                {showEmergencyConfirm && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      This will immediately alert school administrators and archive this conversation. 
                      Are you sure you feel unsafe?
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEmergencyConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
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
                        message.isFromTeacher ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromTeacher
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isFromTeacher ? 'text-gray-500' : 'text-blue-100'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  {isOfficeHours ? (
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <Textarea
                          placeholder="Type your message here... Be respectful and kind! 😊"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            if (e.target.value.trim()) {
                              analyzeMessage(e.target.value);
                            } else {
                              setContentAnalysis(null);
                            }
                          }}
                          className="flex-1 min-h-[80px] resize-none"
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
                          className="self-end bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Content Analysis Feedback */}
                      {contentAnalysis && (
                        <div className={`p-3 rounded-lg border ${
                          contentAnalysis.riskLevel === 'low' 
                            ? 'bg-green-50 border-green-200' 
                            : contentAnalysis.riskLevel === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Heart className={`w-4 h-4 ${
                              contentAnalysis.riskLevel === 'low' ? 'text-green-600' : 
                              contentAnalysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                            <span className={`text-sm font-medium ${
                              contentAnalysis.riskLevel === 'low' ? 'text-green-800' : 
                              contentAnalysis.riskLevel === 'medium' ? 'text-yellow-800' : 'text-red-800'
                            }`}>
                              {contentAnalysis.riskLevel === 'low' ? 'Great message! 👍' : 
                               contentAnalysis.riskLevel === 'medium' ? 'Consider rephrasing 🤔' : 'Please be more respectful 💙'}
                            </span>
                          </div>
                          {contentAnalysis.suggestions.length > 0 && (
                            <div className="space-y-1">
                              {contentAnalysis.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                                <p key={index} className={`text-xs ${
                                  contentAnalysis.riskLevel === 'low' ? 'text-green-700' : 
                                  contentAnalysis.riskLevel === 'medium' ? 'text-yellow-700' : 'text-red-700'
                                }`}>
                                  💡 {suggestion}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 mb-2">Teachers are not available right now</p>
                      <p className="text-sm text-gray-400">
                        Office hours: Monday-Friday, 9:00 AM - 5:00 PM
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <HelpCircle className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">🕐</span>
                  <div>
                    <p className="font-medium text-gray-900">Office Hours</p>
                    <p className="text-gray-600">Teachers are available Monday-Friday, 9 AM - 5 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">💬</span>
                  <div>
                    <p className="font-medium text-gray-900">Be Respectful</p>
                    <p className="text-gray-600">Always use kind and respectful language</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="font-medium text-gray-900">Stay Safe</p>
                    <p className="text-gray-600">Use the "I Feel Unsafe" button if you need help</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function StudentCommunications() {
  return (
    <AuthGuard requiredRole="student">
      <StudentCommunicationsContent />
    </AuthGuard>
  );
}
