'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  Heart,
  Phone,
  Mail,
  Video,
  FileText,
  Award,
  Clock,
  CheckCircle,
  UserPlus,
  Activity,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface EngagementMetric {
  id: string
  name: string
  value: number
  previousValue: number
  trend: 'up' | 'down' | 'stable'
  unit: string
}

interface ParentEvent {
  id: string
  title: string
  type: 'workshop' | 'meeting' | 'social' | 'volunteer'
  date: string
  time: string
  attendees: number
  capacity: number
  status: 'upcoming' | 'completed' | 'cancelled'
  description: string
}

interface CommunicationChannel {
  id: string
  name: string
  type: 'email' | 'sms' | 'app' | 'call' | 'newsletter'
  activeUsers: number
  totalUsers: number
  engagementRate: number
  lastUsed: string
}

export default function ParentEngagementPage() {
  const [metrics, setMetrics] = useState<EngagementMetric[]>([])
  const [events, setEvents] = useState<ParentEvent[]>([])
  const [channels, setChannels] = useState<CommunicationChannel[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const mockMetrics: EngagementMetric[] = [
      {
        id: '1',
        name: 'Active Parent Portal Users',
        value: 145,
        previousValue: 128,
        trend: 'up',
        unit: 'users'
      },
      {
        id: '2',
        name: 'Event Attendance Rate',
        value: 72,
        previousValue: 68,
        trend: 'up',
        unit: '%'
      },
      {
        id: '3',
        name: 'Communication Response Rate',
        value: 85,
        previousValue: 82,
        trend: 'up',
        unit: '%'
      },
      {
        id: '4',
        name: 'Volunteer Hours This Month',
        value: 156,
        previousValue: 142,
        trend: 'up',
        unit: 'hours'
      }
    ]

    const mockEvents: ParentEvent[] = [
      {
        id: '1',
        title: 'Digital Citizenship Workshop',
        type: 'workshop',
        date: '2024-01-25',
        time: '7:00 PM',
        attendees: 32,
        capacity: 40,
        status: 'upcoming',
        description: 'Learn how to help your child navigate the digital world safely'
      },
      {
        id: '2',
        title: 'Parent-Teacher Conferences',
        type: 'meeting',
        date: '2024-02-05',
        time: '3:00 PM',
        attendees: 0,
        capacity: 150,
        status: 'upcoming',
        description: 'Individual meetings to discuss student progress'
      },
      {
        id: '3',
        title: 'Family Fun Night',
        type: 'social',
        date: '2024-01-20',
        time: '6:00 PM',
        attendees: 85,
        capacity: 100,
        status: 'completed',
        description: 'Games, activities, and community building for the whole family'
      },
      {
        id: '4',
        title: 'Reading Volunteer Training',
        type: 'volunteer',
        date: '2024-01-18',
        time: '9:00 AM',
        attendees: 15,
        capacity: 20,
        status: 'completed',
        description: 'Training session for parents who want to volunteer in reading programs'
      }
    ]

    const mockChannels: CommunicationChannel[] = [
      {
        id: '1',
        name: 'Parent Portal App',
        type: 'app',
        activeUsers: 145,
        totalUsers: 180,
        engagementRate: 81,
        lastUsed: '2 hours ago'
      },
      {
        id: '2',
        name: 'Weekly Newsletter',
        type: 'newsletter',
        activeUsers: 165,
        totalUsers: 180,
        engagementRate: 92,
        lastUsed: '3 days ago'
      },
      {
        id: '3',
        name: 'SMS Notifications',
        type: 'sms',
        activeUsers: 156,
        totalUsers: 180,
        engagementRate: 87,
        lastUsed: '1 day ago'
      },
      {
        id: '4',
        name: 'Email Updates',
        type: 'email',
        activeUsers: 142,
        totalUsers: 180,
        engagementRate: 79,
        lastUsed: '5 hours ago'
      }
    ]
    
    setTimeout(() => {
      setMetrics(mockMetrics)
      setEvents(mockEvents)
      setChannels(mockChannels)
      setLoading(false)
    }, 1000)
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      default: return <TrendingUp className="w-4 h-4 text-gray-600" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-blue-100 text-blue-800'
      case 'meeting': return 'bg-purple-100 text-purple-800'
      case 'social': return 'bg-green-100 text-green-800'
      case 'volunteer': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <MessageCircle className="w-4 h-4" />
      case 'app': return <Activity className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      case 'newsletter': return <FileText className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Parent Engagement
                </h1>
                <p className="text-gray-600 mt-1">Foster strong parent-school partnerships</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Event
              </Button>
              <Link href="/admin">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-600 text-sm">{metric.name}</h3>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span className="text-sm font-medium text-gray-600">
                        {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
                    <span className="text-sm text-gray-600">{metric.unit}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Engagement Trends</span>
                  </CardTitle>
                  <CardDescription>Parent participation over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Portal Usage</span>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">+13%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Event Attendance</span>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">+6%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Volunteer Hours</span>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">+10%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Top Engagement Areas</span>
                  </CardTitle>
                  <CardDescription>Most active parent involvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reading Programs</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">School Events</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Classroom Support</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                        <span className="text-sm font-medium">68%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription>
                            {new Date(event.date).toLocaleDateString()} at {event.time}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm mb-4">{event.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Attendance:</span>
                          <span className="font-medium">{event.attendees}/{event.capacity}</span>
                        </div>
                        
                        {event.status !== 'cancelled' && (
                          <Progress 
                            value={(event.attendees / event.capacity) * 100} 
                            className="h-2"
                          />
                        )}
                        
                        <div className="text-center text-xs text-gray-600">
                          {event.status === 'upcoming' ? 
                            `${event.capacity - event.attendees} spots available` :
                            `${Math.round((event.attendees / event.capacity) * 100)}% attendance rate`
                          }
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        {event.status === 'upcoming' && (
                          <>
                            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                              <UserPlus className="w-4 h-4 mr-2" />
                              Promote
                            </Button>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </>
                        )}
                        {event.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {channels.map((channel, index) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-violet-100 rounded-lg">
                            {getChannelIcon(channel.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            <CardDescription className="capitalize">
                              {channel.type} • Last used {channel.lastUsed}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-violet-600">{channel.engagementRate}%</div>
                          <div className="text-sm text-gray-600">Engagement</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active Users:</span>
                          <span className="font-medium">{channel.activeUsers}/{channel.totalUsers}</span>
                        </div>
                        
                        <Progress 
                          value={(channel.activeUsers / channel.totalUsers) * 100} 
                          className="h-2"
                        />
                        
                        <div className="text-center text-xs text-gray-600">
                          {Math.round((channel.activeUsers / channel.totalUsers) * 100)}% adoption rate
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
