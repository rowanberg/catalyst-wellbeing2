'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  MessageCircle, 
  Shield, 
  Users, 
  Heart, 
  BookOpen,
  AlertTriangle,
  Search,
  Plus,
  Clock,
  Star,
  HelpCircle,
  Lightbulb
} from 'lucide-react'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { MessageComposer } from '@/components/communications/MessageComposer'
import { MessageThread } from '@/components/communications/MessageThread'

interface Teacher {
  id: string
  name: string
  subject: string
  avatar: string
  isOnline: boolean
  lastSeen?: string
}

function StudentMessagingContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyMessage, setEmergencyMessage] = useState('')

  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: 'Ms. Johnson',
      subject: 'Mathematics',
      avatar: '/avatars/teacher1.jpg',
      isOnline: true
    },
    {
      id: '2',
      name: 'Mr. Smith',
      subject: 'Science',
      avatar: '/avatars/teacher2.jpg',
      isOnline: false,
      lastSeen: '2 hours ago'
    }
  ])

  const conversationStarters = [
    { id: '1', text: 'I need help with today\'s homework', icon: BookOpen },
    { id: '2', text: 'Can you explain this topic again?', icon: HelpCircle },
    { id: '3', text: 'I\'m feeling stressed about the test', icon: Heart },
    { id: '4', text: 'I have an idea for our project', icon: Lightbulb }
  ]

  return (
    <RealtimeProvider>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Teacher Connect</h1>
                  <p className="text-gray-600">Safe communication with your teachers</p>
                </div>
              </div>
              
              <Button className="bg-red-500 hover:bg-red-600 text-white shadow-lg">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Help
              </Button>
            </div>

            {/* Safety Notice */}
            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Safe Communication Zone</h3>
                    <p className="text-sm text-green-700">
                      All messages are monitored for your safety. Only message during school hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Teachers List */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      <span>Your Teachers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search teachers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          onClick={() => setSelectedTeacher(teacher.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            selectedTeacher === teacher.id 
                              ? 'bg-purple-50 border-purple-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                                  {teacher.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                {teacher.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{teacher.name}</p>
                                <p className="text-sm text-gray-500">{teacher.subject}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {teacher.isOnline ? (
                                <Badge className="bg-green-100 text-green-800">Online</Badge>
                              ) : (
                                <p className="text-xs text-gray-500">{teacher.lastSeen}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Conversation Starters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span>Quick Starters</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {conversationStarters.map((starter) => {
                      const Icon = starter.icon
                      return (
                        <Button
                          key={starter.id}
                          variant="outline"
                          className="w-full justify-start text-left h-auto p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{starter.text}</span>
                          </div>
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2">
                {selectedTeacher ? (
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                            {teachers.find(t => t.id === selectedTeacher)?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {teachers.find(t => t.id === selectedTeacher)?.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {teachers.find(t => t.id === selectedTeacher)?.subject}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Office Hours
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0">
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4">
                          <MessageThread
                            channelId={selectedTeacher}
                            messages={[]}
                          />
                        </div>
                        
                        <div className="border-t p-4">
                          <MessageComposer
                            channelId={selectedTeacher}
                            placeholder="Type your message to your teacher..."
                            showContentAnalysis={true}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-[600px] flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <MessageCircle className="h-8 w-8 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Select a Teacher</h3>
                        <p className="text-gray-500">Choose a teacher from the list to start a conversation</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </RealtimeProvider>
  )
}

export default function StudentMessagingPage() {
  return (
    <AuthGuard requiredRole="student">
      <StudentMessagingContent />
    </AuthGuard>
  )
}
