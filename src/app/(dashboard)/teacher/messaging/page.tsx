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
  Users, 
  MessageSquare, 
  UserPlus, 
  Clock,
  Search,
  Send,
  BookOpen,
  Heart,
  AlertTriangle,
  Bell,
  Calendar,
  Filter
} from 'lucide-react'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { MessageComposer } from '@/components/communications/MessageComposer'
import { MessageThread } from '@/components/communications/MessageThread'

interface Student {
  id: string
  name: string
  grade: string
  avatar: string
  isOnline: boolean
  lastMessage?: string
  unreadCount: number
}

interface Parent {
  id: string
  name: string
  children: string[]
  email: string
  lastContact?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  recipients: 'students' | 'parents' | 'both'
  scheduled?: string
  sent?: boolean
}

function TeacherMessagingContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('students')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Emma Wilson',
      grade: '8th Grade',
      avatar: '/avatars/student1.jpg',
      isOnline: true,
      lastMessage: 'Thank you for the help with math!',
      unreadCount: 0
    },
    {
      id: '2',
      name: 'John Smith',
      grade: '8th Grade',
      avatar: '/avatars/student2.jpg',
      isOnline: false,
      lastMessage: 'I need help with the science project',
      unreadCount: 2
    }
  ])

  const [parents, setParents] = useState<Parent[]>([
    {
      id: '1',
      name: 'Sarah Wilson',
      children: ['Emma Wilson'],
      email: 'sarah.wilson@email.com',
      lastContact: '2 days ago'
    },
    {
      id: '2',
      name: 'Michael Smith',
      children: ['John Smith'],
      email: 'michael.smith@email.com',
      lastContact: '1 week ago'
    }
  ])

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Upcoming Science Fair',
      content: 'Don\'t forget about the science fair next Friday. Please bring your projects by Thursday.',
      recipients: 'students',
      sent: true
    },
    {
      id: '2',
      title: 'Parent-Teacher Conference',
      content: 'Parent-teacher conferences are scheduled for next week. Please check your email for appointment times.',
      recipients: 'parents',
      scheduled: '2024-01-20T09:00:00Z'
    }
  ])

  return (
    <RealtimeProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Class Connect</h1>
                  <p className="text-gray-600">Communicate with students and parents</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Office Hours
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Send className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Students</p>
                      <p className="text-2xl font-bold text-blue-600">24</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Unread Messages</p>
                      <p className="text-2xl font-bold text-orange-600">7</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Parent Contacts</p>
                      <p className="text-2xl font-bold text-green-600">18</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Office Hours</p>
                      <p className="text-2xl font-bold text-purple-600">Open</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="students" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Students</span>
                  <Badge className="ml-1 bg-blue-500">24</Badge>
                </TabsTrigger>
                <TabsTrigger value="parents" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Parents</span>
                  <Badge className="ml-1 bg-green-500">18</Badge>
                </TabsTrigger>
                <TabsTrigger value="announcements" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Announcements</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Students List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Students</CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => setSelectedContact(student.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedContact === student.id 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  {student.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-500">{student.grade}</p>
                                  {student.lastMessage && (
                                    <p className="text-xs text-gray-400 truncate">{student.lastMessage}</p>
                                  )}
                                </div>
                              </div>
                              {student.unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white">
                                  {student.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
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
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                                {students.find(s => s.id === selectedContact)?.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {students.find(s => s.id === selectedContact)?.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {students.find(s => s.id === selectedContact)?.grade}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Office Hours Active
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0">
                          <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4">
                              <MessageThread
                                channelId={selectedContact}
                                messages={[]}
                              />
                            </div>
                            
                            <div className="border-t p-4">
                              <MessageComposer
                                channelId={selectedContact}
                                placeholder="Type your message to the student..."
                                showContentAnalysis={true}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-[600px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                            <MessageSquare className="h-8 w-8 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Select a Student</h3>
                            <p className="text-gray-500">Choose a student from the list to start a conversation</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Parent Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {parents.map((parent) => (
                        <div key={parent.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{parent.name}</h4>
                              <p className="text-sm text-gray-500">Parent of: {parent.children.join(', ')}</p>
                              <p className="text-xs text-gray-400">{parent.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{parent.lastContact}</p>
                              <Button size="sm" className="mt-2">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Parent Update</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Select Parents</label>
                        <div className="mt-2 space-y-2">
                          {parents.map((parent) => (
                            <label key={parent.id} className="flex items-center space-x-2">
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">{parent.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <textarea 
                          className="mt-1 w-full p-3 border rounded-lg resize-none" 
                          rows={4}
                          placeholder="Type your message to parents..."
                        />
                      </div>
                      <Button className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Send Update
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Announcements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                            <Badge className={
                              announcement.sent 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {announcement.sent ? 'Sent' : 'Scheduled'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>To: {announcement.recipients}</span>
                            {announcement.scheduled && (
                              <span>Scheduled: {new Date(announcement.scheduled).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Announcement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <Input placeholder="Announcement title..." className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Recipients</label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="radio" name="recipients" value="students" />
                            <span className="text-sm">Students only</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="radio" name="recipients" value="parents" />
                            <span className="text-sm">Parents only</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="radio" name="recipients" value="both" />
                            <span className="text-sm">Both students and parents</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <textarea 
                          className="mt-1 w-full p-3 border rounded-lg resize-none" 
                          rows={4}
                          placeholder="Type your announcement..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                        <Button className="flex-1">
                          <Send className="h-4 w-4 mr-2" />
                          Send Now
                        </Button>
                      </div>
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

export default function TeacherMessagingPage() {
  return (
    <AuthGuard requiredRole="teacher">
      <TeacherMessagingContent />
    </AuthGuard>
  )
}
