'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Heart, 
  MessageSquare, 
  Users, 
  Shield,
  Search,
  Send,
  Eye,
  Clock,
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  Settings
} from 'lucide-react'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { MessageComposer } from '@/components/communications/MessageComposer'
import { MessageThread } from '@/components/communications/MessageThread'

interface Child {
  id: string
  name: string
  grade: string
  avatar: string
  recentMessages: number
  lastActivity: string
  wellbeingStatus: 'thriving' | 'good' | 'needs-attention'
}

interface Teacher {
  id: string
  name: string
  subject: string
  email: string
  isOnline: boolean
  lastMessage?: string
  unreadCount: number
  officeHours: string
}

interface FamilyMessage {
  id: string
  childId: string
  content: string
  timestamp: string
  type: 'sent' | 'received'
  isRead: boolean
}

function ParentMessagingContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('family')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [children, setChildren] = useState<Child[]>([
    {
      id: '1',
      name: 'Emma Wilson',
      grade: '8th Grade',
      avatar: '/avatars/child1.jpg',
      recentMessages: 3,
      lastActivity: '2 hours ago',
      wellbeingStatus: 'thriving'
    },
    {
      id: '2',
      name: 'Jake Wilson',
      grade: '5th Grade', 
      avatar: '/avatars/child2.jpg',
      recentMessages: 1,
      lastActivity: '1 day ago',
      wellbeingStatus: 'good'
    }
  ])

  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: 'Ms. Johnson',
      subject: 'Mathematics',
      email: 'johnson@school.edu',
      isOnline: true,
      lastMessage: 'Emma is doing great in class!',
      unreadCount: 0,
      officeHours: 'Mon-Fri 3:00-4:00 PM'
    },
    {
      id: '2',
      name: 'Mr. Davis',
      subject: 'Science',
      email: 'davis@school.edu',
      isOnline: false,
      lastMessage: 'Please review Jake\'s project requirements',
      unreadCount: 1,
      officeHours: 'Tue-Thu 2:30-3:30 PM'
    }
  ])

  const [familyMessages, setFamilyMessages] = useState<FamilyMessage[]>([
    {
      id: '1',
      childId: '1',
      content: 'Mom, I had a great day at school today! We learned about fractions.',
      timestamp: '2024-01-15T14:30:00Z',
      type: 'received',
      isRead: true
    },
    {
      id: '2',
      childId: '1',
      content: 'That\'s wonderful, Emma! Tell me more about what you learned.',
      timestamp: '2024-01-15T14:32:00Z',
      type: 'sent',
      isRead: true
    }
  ])

  // Convert family messages to Message format for MessageThread
  const convertFamilyMessagesToMessages = (messages: FamilyMessage[]) => {
    return messages.map(msg => ({
      id: msg.id,
      channel_id: `family-${msg.childId}`,
      sender_id: msg.type === 'sent' ? profile?.id || 'parent' : msg.childId,
      sender_name: msg.type === 'sent' ? `${profile?.first_name || 'Parent'}` : children.find(c => c.id === msg.childId)?.name || 'Child',
      sender_role: msg.type === 'sent' ? 'parent' : 'student',
      content: msg.content,
      message_type: 'text' as const,
      created_at: msg.timestamp,
      is_flagged: false,
      isFromCurrentUser: msg.type === 'sent'
    }))
  }

  const getWellbeingColor = (status: string) => {
    switch (status) {
      case 'thriving': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'needs-attention': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <RealtimeProvider>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Family Hub</h1>
                  <p className="text-gray-600">Stay connected with your children's school journey</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Privacy Settings
                </Button>
                <Button className="bg-pink-500 hover:bg-pink-600">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">My Children</p>
                      <p className="text-2xl font-bold text-pink-600">{children.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">New Messages</p>
                      <p className="text-2xl font-bold text-blue-600">5</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Teachers Connected</p>
                      <p className="text-2xl font-bold text-green-600">{teachers.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Transparency</p>
                      <p className="text-2xl font-bold text-purple-600">100%</p>
                    </div>
                    <Shield className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="family" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Family Chat</span>
                  <Badge className="ml-1 bg-pink-500">{children.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="teachers" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Teachers</span>
                  <Badge className="ml-1 bg-blue-500">{teachers.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="transparency" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Message History</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="family" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Children List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Children</CardTitle>
                        <p className="text-sm text-gray-600">Safe family communication</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            onClick={() => setSelectedContact(child.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedContact === child.id 
                                ? 'bg-pink-50 border-pink-200' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {child.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">{child.name}</h4>
                                  {child.recentMessages > 0 && (
                                    <Badge className="bg-pink-500 text-white text-xs">
                                      {child.recentMessages}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{child.grade}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <Badge className={getWellbeingColor(child.wellbeingStatus)}>
                                    {child.wellbeingStatus.replace('-', ' ')}
                                  </Badge>
                                  <p className="text-xs text-gray-400">{child.lastActivity}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 text-blue-700">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">Safe Communication</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            All family messages are private and secure. School staff cannot access these conversations.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chat Area */}
                  <div className="lg:col-span-2">
                    {selectedContact ? (
                      <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                                {children.find(c => c.id === selectedContact)?.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {children.find(c => c.id === selectedContact)?.name}
                                </h3>
                                <p className="text-sm text-gray-500">Family Chat</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Private & Secure
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0">
                          <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4">
                              <MessageThread
                                channelId={`family-${selectedContact}`}
                                messages={convertFamilyMessagesToMessages(familyMessages.filter(m => m.childId === selectedContact))}
                              />
                            </div>
                            
                            <div className="border-t p-4">
                              <MessageComposer
                                channelId={`family-${selectedContact}`}
                                placeholder="Send a message to your child..."
                                showContentAnalysis={false}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-[600px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                            <Heart className="h-8 w-8 text-pink-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Select a Child</h3>
                            <p className="text-gray-500">Choose one of your children to start a family conversation</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="teachers" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Teachers List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Children's Teachers</CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search teachers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {teachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            onClick={() => setSelectedContact(teacher.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedContact === teacher.id 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                                    {teacher.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  {teacher.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{teacher.name}</p>
                                  <p className="text-sm text-gray-500">{teacher.subject}</p>
                                  <p className="text-xs text-gray-400">{teacher.officeHours}</p>
                                </div>
                              </div>
                              {teacher.unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white">
                                  {teacher.unreadCount}
                                </Badge>
                              )}
                            </div>
                            {teacher.lastMessage && (
                              <p className="text-xs text-gray-400 mt-2 truncate">{teacher.lastMessage}</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Teacher Chat Area */}
                  <div className="lg:col-span-2">
                    {selectedContact && teachers.find(t => t.id === selectedContact) ? (
                      <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                                {teachers.find(t => t.id === selectedContact)?.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {teachers.find(t => t.id === selectedContact)?.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {teachers.find(t => t.id === selectedContact)?.subject}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={
                                teachers.find(t => t.id === selectedContact)?.isOnline 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }>
                                <Clock className="h-3 w-3 mr-1" />
                                {teachers.find(t => t.id === selectedContact)?.isOnline ? 'Available' : 'Offline'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {teachers.find(t => t.id === selectedContact)?.officeHours}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0">
                          <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4">
                              <MessageThread
                                channelId={`teacher-${selectedContact}`}
                                messages={[]}
                              />
                            </div>
                            
                            <div className="border-t p-4">
                              <MessageComposer
                                channelId={`teacher-${selectedContact}`}
                                placeholder="Message the teacher..."
                                showContentAnalysis={false}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-[600px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                            <BookOpen className="h-8 w-8 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Select a Teacher</h3>
                            <p className="text-gray-500">Choose a teacher to start a conversation</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transparency" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Children's School Messages</CardTitle>
                      <p className="text-sm text-gray-600">
                        View your children's communication with teachers for transparency and safety
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {children.map((child) => (
                        <div key={child.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {child.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{child.name}</h4>
                                <p className="text-sm text-gray-500">{child.grade}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Messages
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Recent Activity:</span>
                              <span className="text-gray-900">{child.lastActivity}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Messages This Week:</span>
                              <span className="text-gray-900">{child.recentMessages}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Status:</span>
                              <Badge className={getWellbeingColor(child.wellbeingStatus)}>
                                {child.wellbeingStatus.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy & Safety Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 text-green-700 mb-2">
                          <Shield className="h-5 w-5" />
                          <span className="font-medium">Full Transparency Active</span>
                        </div>
                        <p className="text-sm text-green-600">
                          You have access to all your children's school communications for safety and transparency.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Message Notifications</p>
                            <p className="text-sm text-gray-500">Get notified of new messages</p>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Emergency Alerts</p>
                            <p className="text-sm text-gray-500">Immediate alerts for urgent situations</p>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Weekly Summary</p>
                            <p className="text-sm text-gray-500">Weekly communication summary</p>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                      </div>
                      
                      <Button className="w-full mt-4">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Privacy Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </RealtimeProvider>
  )
}

export default function ParentMessagingPage() {
  return (
    <AuthGuard requiredRole="parent">
      <ParentMessagingContent />
    </AuthGuard>
  )
}
