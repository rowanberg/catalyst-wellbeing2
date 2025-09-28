'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Filter,
  TrendingUp,
  Award,
  Zap,
  Target,
  Activity,
  Smile,
  Frown,
  Meh,
  Star,
  Plus,
  BarChart3,
  Lightbulb,
  Shield,
  ArrowLeft
} from 'lucide-react'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { MessageComposer } from '@/components/communications/MessageComposer'
import { MessageThread } from '@/components/communications/MessageThread'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Student {
  id: string
  name: string
  grade: string
  avatar: string
  isOnline: boolean
  lastSeen?: string
  mood: string
  wellbeingStatus: 'thriving' | 'needs_support' | 'at_risk'
  unreadCount: number
  level: number
  xp: number
  streak: number
  lastMessage?: string
  lastActive?: string
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

interface WellbeingAnalytics {
  totalStudents: number
  thriving: number
  needsSupport: number
  atRisk: number
  averageMoodScore: number
  trendingUp: boolean
}

interface InterventionSuggestion {
  id: string
  title: string
  description: string
  type: 'breathing' | 'movement' | 'mindfulness' | 'social'
  duration: string
  difficulty: 'easy' | 'medium' | 'hard'
}

function TeacherMessagingContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('students')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [wellbeingFilter, setWellbeingFilter] = useState<'all' | 'thriving' | 'needs_support' | 'at_risk'>('all')
  const [showShoutOutModal, setShowShoutOutModal] = useState(false)
  const [selectedStudentForShoutOut, setSelectedStudentForShoutOut] = useState<string | null>(null)
  const [shoutOutForm, setShoutOutForm] = useState({
    category: 'academic',
    message: '',
    isPublic: true
  })
  const [shoutOutLoading, setShoutOutLoading] = useState(false)
  const [shoutOutError, setShoutOutError] = useState('')
  
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Emma Wilson',
      grade: '8th Grade',
      avatar: '/avatars/student1.jpg',
      isOnline: true,
      lastMessage: 'Thank you for the help with math!',
      unreadCount: 0,
      xp: 1250,
      level: 5,
      mood: 'happy',
      wellbeingStatus: 'thriving',
      lastActive: '2 hours ago',
      streak: 7
    },
    {
      id: '2',
      name: 'John Smith',
      grade: '8th Grade',
      avatar: '/avatars/student2.jpg',
      isOnline: false,
      lastMessage: 'I need help with the science project',
      unreadCount: 2,
      xp: 890,
      level: 3,
      mood: 'anxious',
      wellbeingStatus: 'needs_support',
      lastActive: '1 day ago',
      streak: 3
    },
    {
      id: '3',
      name: 'Sarah Chen',
      grade: '8th Grade',
      avatar: '/avatars/student3.jpg',
      isOnline: true,
      lastMessage: 'Can we talk about the group project?',
      unreadCount: 1,
      xp: 2100,
      level: 8,
      mood: 'excited',
      wellbeingStatus: 'thriving',
      lastActive: '30 minutes ago',
      streak: 12
    },
    {
      id: '4',
      name: 'Marcus Johnson',
      grade: '8th Grade',
      avatar: '/avatars/student4.jpg',
      isOnline: false,
      lastMessage: 'I missed class today',
      unreadCount: 0,
      xp: 450,
      level: 2,
      mood: 'sad',
      wellbeingStatus: 'at_risk',
      lastActive: '3 days ago',
      streak: 15
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

  const [wellbeingAnalytics, setWellbeingAnalytics] = useState<WellbeingAnalytics>({
    totalStudents: 24,
    thriving: 16,
    needsSupport: 6,
    atRisk: 2,
    averageMoodScore: 7.2,
    trendingUp: true
  })

  const [interventionSuggestions, setInterventionSuggestions] = useState<InterventionSuggestion[]>([
    {
      id: '1',
      title: '3-Minute Breathing Break',
      description: 'Guide the class through a calming breathing exercise',
      type: 'breathing',
      duration: '3 minutes',
      difficulty: 'easy'
    },
    {
      id: '2',
      title: 'Gratitude Circle',
      description: 'Have students share one thing they\'re grateful for',
      type: 'social',
      duration: '10 minutes',
      difficulty: 'easy'
    },
    {
      id: '3',
      title: 'Mindful Movement',
      description: 'Simple stretches and movement to re-energize',
      type: 'movement',
      duration: '5 minutes',
      difficulty: 'medium'
    }
  ])

  const [interventionActivities, setInterventionActivities] = useState<any[]>([])
  const [interventionCategories, setInterventionCategories] = useState<any[]>([])
  const [interventionLoading, setInterventionLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMood, setSelectedMood] = useState('all')
  const [moodFilters, setMoodFilters] = useState<any[]>([])
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)

  // Load real data from API
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const response = await fetch('/api/teacher/messaging')
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
          setWellbeingAnalytics(data.wellbeingAnalytics || wellbeingAnalytics)
          setInterventionSuggestions(data.interventionSuggestions || interventionSuggestions)
        }
      } catch (error: any) {
        console.error('Failed to fetch teacher data:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchInterventionToolkit = async () => {
      try {
        setInterventionLoading(true)
        const response = await fetch(`/api/teacher/intervention-toolkit?category=${selectedCategory}&mood=${selectedMood}`)
        if (response.ok) {
          const data = await response.json()
          setInterventionActivities(data.activities || [])
          setInterventionCategories(data.categories || [])
          setMoodFilters(data.moodFilters || [])
        }
      } catch (error: any) {
        console.error('Failed to fetch intervention toolkit:', error)
      } finally {
        setInterventionLoading(false)
      }
    }

    fetchTeacherData()
    fetchInterventionToolkit()
  }, [selectedCategory, selectedMood])

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊'
      case 'excited': return '🤩'
      case 'calm': return '😌'
      case 'sad': return '😢'
      case 'anxious': return '😰'
      case 'neutral': return '😐'
      default: return '😐'
    }
  }

  const getWellbeingColor = (status: string) => {
    switch (status) {
      case 'thriving': return 'text-green-600 bg-green-100'
      case 'needs_support': return 'text-yellow-600 bg-yellow-100'
      case 'at_risk': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = wellbeingFilter === 'all' || student.wellbeingStatus === wellbeingFilter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <AuthGuard requiredRole="teacher">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="teacher">
      <RealtimeProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {/* Mobile-Optimized Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="flex flex-col space-y-4 py-4 sm:py-6">
                {/* Top row - Title and Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
                        Teacher Communications
                      </h1>
                      <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1 truncate">Connect with students and parents</p>
                    </div>
                  </div>
                </div>
                
                {/* Bottom row - Action buttons */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Button variant="outline" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-3">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Notifications</span>
                    <span className="sm:hidden">Alerts</span>
                  </Button>
                  <Button className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-3">
                    <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New Message</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Main Content */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Enhanced Analytics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Class Well-being</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-lg sm:text-2xl font-bold text-green-600">{wellbeingAnalytics.averageMoodScore}/10</p>
                          {wellbeingAnalytics.trendingUp ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                          )}
                        </div>
                      </div>
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Need Support</p>
                        <p className="text-lg sm:text-2xl font-bold text-yellow-600">{wellbeingAnalytics.needsSupport + wellbeingAnalytics.atRisk}</p>
                        <p className="text-xs text-gray-500">{wellbeingAnalytics.atRisk} at risk</p>
                      </div>
                      <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Unread Messages</p>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">{students.reduce((acc, s) => acc + s.unreadCount, 0)}</p>
                      </div>
                      <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Office Hours</p>
                        <p className="text-lg sm:text-2xl font-bold text-purple-600">Open</p>
                        <p className="text-xs text-gray-500">Until 4:00 PM</p>
                      </div>
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Intervention Toolkit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-indigo-900">
                    <Lightbulb className="h-5 w-5" />
                    <span>Intervention Toolkit</span>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Category Filters */}
                    <ClientWrapper>
                      {interventionCategories.map((category) => (
                        <Button
                          key={category.id}
                          size="sm"
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          onClick={() => setSelectedCategory(category.id)}
                          className="text-xs"
                        >
                          {category.name} ({category.count})
                        </Button>
                      ))}
                    </ClientWrapper>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* Mood Filters */}
                    <ClientWrapper>
                      {moodFilters.slice(0, 6).map((mood) => (
                        <Button
                          key={mood.id}
                          size="sm"
                          variant={selectedMood === mood.id ? "default" : "outline"}
                          onClick={() => setSelectedMood(mood.id)}
                          className="text-xs"
                        >
                          {mood.emoji} {mood.name}
                        </Button>
                      ))}
                    </ClientWrapper>
                  </div>
                </CardHeader>
                <CardContent>
                  {interventionLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {interventionActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="bg-white p-4 rounded-lg border border-indigo-100 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{activity.icon}</span>
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {activity.duration} • {activity.participants}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{activity.description}</p>
                          
                          {expandedActivity === activity.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="space-y-2">
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700">Materials:</h5>
                                  <p className="text-xs text-gray-600">{activity.materials}</p>
                                </div>
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700">Instructions:</h5>
                                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                                    {activity.instructions.map((instruction: string, idx: number) => (
                                      <li key={idx}>{instruction}</li>
                                    ))}
                                  </ol>
                                </div>
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700">Benefits:</h5>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {activity.benefits.map((benefit: string, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {benefit}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="flex-1 text-xs"
                              onClick={() => {
                                // Log activity usage
                                fetch('/api/teacher/intervention-toolkit', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    activityId: activity.id,
                                    studentCount: students.length,
                                    duration: activity.duration
                                  })
                                })
                              }}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Use Activity
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedActivity(
                                expandedActivity === activity.id ? null : activity.id
                              )}
                              className="text-xs"
                            >
                              {expandedActivity === activity.id ? 'Less' : 'More'}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="students" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Students</span>
                  <span className="sm:hidden">Students</span>
                  <Badge className="ml-0 sm:ml-1 bg-blue-500 text-xs">24</Badge>
                </TabsTrigger>
                <TabsTrigger value="parents" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Parents</span>
                  <span className="sm:hidden">Parents</span>
                  <Badge className="ml-0 sm:ml-1 bg-green-500 text-xs">18</Badge>
                </TabsTrigger>
                <TabsTrigger value="announcements" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 text-xs sm:text-sm">
                  <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Announcements</span>
                  <span className="sm:hidden">News</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  
                  {/* Enhanced Students List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader className="pb-3 sm:pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                          <CardTitle className="text-lg sm:text-xl">Your Students</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => setShowShoutOutModal(true)}
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto"
                          >
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="sm:hidden">Shout-Out</span>
                            <span className="hidden sm:inline">Shout-Out</span>
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <Input
                              placeholder="Search students..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8 sm:pl-10 text-sm sm:text-base h-8 sm:h-10"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <div className="flex space-x-1 overflow-x-auto pb-1">
                              {(['all', 'thriving', 'needs_support', 'at_risk'] as const).map((filter) => (
                                <Button
                                  key={filter}
                                  size="sm"
                                  variant={wellbeingFilter === filter ? "default" : "outline"}
                                  onClick={() => setWellbeingFilter(filter)}
                                  className="text-xs px-2 py-1 flex-shrink-0 min-w-0"
                                >
                                  {filter === 'all' ? 'All' : 
                                   filter === 'thriving' ? '😊' :
                                   filter === 'needs_support' ? '😐' : '😰'}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                          {filteredStudents.map((student) => (
                            <div
                              key={student.id}
                              className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                                selectedContact === student.id ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' : ''
                              }`}
                              onClick={() => setSelectedContact(student.id)}
                            >
                              <div className="flex items-start space-x-4">
                                <div className="relative flex-shrink-0">
                                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={student.avatar} alt={student.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                      {student.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border">
                                    <span className="text-sm">{student.mood}</span>
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-semibold text-gray-900 text-base truncate">{student.name}</h3>
                                      <p className="text-sm text-gray-600 mt-0.5">{student.grade}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-3">
                                      <Badge 
                                        className={`text-xs font-medium px-2 py-1 ${
                                          student.wellbeingStatus === 'thriving' ? 'bg-green-100 text-green-700 border-green-200' :
                                          student.wellbeingStatus === 'needs_support' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                          'bg-red-100 text-red-700 border-red-200'
                                        }`}
                                      >
                                        {student.wellbeingStatus === 'thriving' ? 'Thriving' :
                                         student.wellbeingStatus === 'needs_support' ? 'Needs Support' :
                                         'At Risk'}
                                      </Badge>
                                      {student.unreadCount > 0 && (
                                        <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                          {student.unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Zap className="h-3 w-3 text-yellow-500" />
                                        <span>Level {student.level}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Award className="h-3 w-3 text-blue-500" />
                                        <span>{student.xp} XP</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Target className="h-3 w-3 text-green-500" />
                                        <span>{student.streak} day streak</span>
                                      </div>
                                    </div>
                                    {student.isOnline && (
                                      <div className="flex items-center space-x-1 text-xs text-green-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>Online</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chat Area */}
                  <div className="lg:col-span-2">
                    {selectedContact ? (
                      <Card className="h-[500px] sm:h-[600px] flex flex-col">
                        <CardHeader className="border-b p-3 sm:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedContact(null)}
                                className="lg:hidden p-1 h-8 w-8"
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                              <div className="relative flex-shrink-0">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-base">
                                  {students.find(s => s.id === selectedContact)?.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                {students.find(s => s.id === selectedContact)?.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <h3 className="font-semibold text-sm sm:text-base truncate">
                                    {students.find(s => s.id === selectedContact)?.name}
                                  </h3>
                                  <span className="text-base sm:text-lg flex-shrink-0">{getMoodIcon(students.find(s => s.id === selectedContact)?.mood || 'neutral')}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm text-gray-500">
                                    {students.find(s => s.id === selectedContact)?.grade}
                                  </p>
                                  <Badge className={`text-xs ${getWellbeingColor(students.find(s => s.id === selectedContact)?.wellbeingStatus || 'thriving')}`}>
                                    {students.find(s => s.id === selectedContact)?.wellbeingStatus?.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-3 mt-1">
                                  <div className="flex items-center space-x-1">
                                    <Zap className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-gray-600">Level {students.find(s => s.id === selectedContact)?.level}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Target className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-gray-600">{students.find(s => s.id === selectedContact)?.streak} day streak</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedStudentForShoutOut(selectedContact)
                                  setShowShoutOutModal(true)
                                }}
                                className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100"
                              >
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                Shout-Out
                              </Button>
                              <Badge className="bg-green-100 text-green-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Office Hours Active
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0">
                          <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                              <MessageThread
                                channelId={selectedContact}
                                messages={[]}
                              />
                            </div>
                            
                            <div className="border-t p-3 sm:p-4">
                              <MessageComposer
                                channelId={selectedContact}
                                placeholder="Type your message..."
                                showContentAnalysis={true}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-[500px] sm:h-[600px] flex items-center justify-center">
                        <div className="text-center space-y-3 sm:space-y-4 px-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select a Student</h3>
                            <p className="text-sm sm:text-base text-gray-500">Choose a student from the list to start a conversation</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl">Parent Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-100">
                        {parents.map((parent) => (
                          <div key={parent.id} className="p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
                            <div className="flex items-start space-x-4">
                              <div className="relative flex-shrink-0">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-semibold">
                                    {parent.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-900 text-base truncate">{parent.name}</h3>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                      Parent of <span className="font-medium">{parent.children.join(', ')}</span>
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Message
                                  </Button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <Users className="h-3 w-3 text-blue-500" />
                                      <span>{parent.children.length} {parent.children.length === 1 ? 'child' : 'children'}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                      <span>{parent.lastContact || 'No recent contact'}</span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    Active
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Send className="h-5 w-5 mr-2 text-blue-600" />
                        Quick Parent Update
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Send updates to multiple parents at once</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Select Recipients</label>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {parents.map((parent) => (
                              <label key={parent.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                />
                                <div className="flex items-center space-x-2 flex-1">
                                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {parent.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium text-gray-900">{parent.name}</span>
                                    <p className="text-xs text-gray-500 truncate">Parent of {parent.children.join(', ')}</p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Update Message</label>
                        <textarea 
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                          rows={4}
                          placeholder="Share positive updates, achievements, or important information about their children..."
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          <Send className="h-4 w-4 mr-2" />
                          Send Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl">Recent Announcements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-3 sm:p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base flex-1 min-w-0">{announcement.title}</h4>
                            <Badge className={`flex-shrink-0 text-xs ${
                              announcement.sent 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {announcement.sent ? 'Sent' : 'Scheduled'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{announcement.content}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-gray-500">
                            <span className="truncate">To: {announcement.recipients}</span>
                            {announcement.scheduled && (
                              <span className="flex-shrink-0">Scheduled: {new Date(announcement.scheduled).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl">Create Announcement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Title</label>
                        <Input placeholder="Announcement title..." className="mt-1 text-sm sm:text-base h-8 sm:h-10" />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Recipients</label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="radio" name="recipients" value="students" className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">Students only</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="radio" name="recipients" value="parents" className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">Parents only</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="radio" name="recipients" value="both" className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">Both students and parents</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Message</label>
                        <textarea 
                          className="mt-1 w-full p-2 sm:p-3 border rounded-lg resize-none text-sm sm:text-base" 
                          rows={3}
                          placeholder="Type your announcement..."
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button variant="outline" className="flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Schedule
                        </Button>
                        <Button className="flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2">
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Send Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Shout-Out Modal */}
          <AnimatePresence>
            {showShoutOutModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowShoutOutModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Give a Positive Shout-Out!</h3>
                    <p className="text-gray-600">
                      {selectedStudentForShoutOut 
                        ? `Recognize ${students.find(s => s.id === selectedStudentForShoutOut)?.name} for their achievements`
                        : 'Select a student and recognize their positive behavior or achievement'
                      }
                    </p>
                  </div>

                  {selectedStudentForShoutOut && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {students.find(s => s.id === selectedStudentForShoutOut)?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {students.find(s => s.id === selectedStudentForShoutOut)?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {students.find(s => s.id === selectedStudentForShoutOut)?.grade}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {shoutOutError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{shoutOutError}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recognition Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'academic', label: 'Academic Excellence', icon: '📚' },
                          { id: 'kindness', label: 'Acts of Kindness', icon: '💝' },
                          { id: 'participation', label: 'Great Participation', icon: '🙋' },
                          { id: 'improvement', label: 'Amazing Progress', icon: '📈' }
                        ].map((category) => (
                          <Button
                            key={category.id}
                            variant={shoutOutForm.category === category.id ? "default" : "outline"}
                            className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-yellow-50 hover:border-yellow-200"
                            onClick={() => setShoutOutForm(prev => ({ ...prev, category: category.id }))}
                          >
                            <span className="text-lg">{category.icon}</span>
                            <span className="text-xs text-center">{category.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Message
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        rows={3}
                        placeholder="Write a personal message to celebrate this student's achievement..."
                        value={shoutOutForm.message}
                        onChange={(e) => setShoutOutForm(prev => ({ ...prev, message: e.target.value }))}
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {shoutOutForm.message.length}/500 characters
                        </span>
                        {shoutOutForm.message.length < 10 && (
                          <span className="text-xs text-red-500">
                            Message too short (minimum 10 characters)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="public" 
                        className="rounded" 
                        checked={shoutOutForm.isPublic}
                        onChange={(e) => setShoutOutForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                      />
                      <label htmlFor="public" className="text-sm text-gray-600">
                        Make this shout-out visible to other students (encourages positive peer recognition)
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowShoutOutModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500"
                      disabled={shoutOutLoading || shoutOutForm.message.length < 10}
                      onClick={async () => {
                        if (!selectedStudentForShoutOut || shoutOutForm.message.length < 10) return
                        
                        setShoutOutLoading(true)
                        setShoutOutError('')
                        
                        try {
                          const response = await fetch('/api/teacher/send-shout-out', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              studentId: selectedStudentForShoutOut,
                              category: shoutOutForm.category,
                              message: shoutOutForm.message.trim(),
                              isPublic: shoutOutForm.isPublic
                            })
                          })
                          
                          if (response.ok) {
                            setShowShoutOutModal(false)
                            setSelectedStudentForShoutOut(null)
                            setShoutOutForm({ category: 'academic', message: '', isPublic: true })
                            // Refresh data to show updated stats
                            const refreshResponse = await fetch('/api/teacher/messaging')
                            if (refreshResponse.ok) {
                              const data = await refreshResponse.json()
                              setStudents(data.students || [])
                              setWellbeingAnalytics(data.wellbeingAnalytics || wellbeingAnalytics)
                            }
                          } else {
                            const errorData = await response.json()
                            setShoutOutError(errorData.error || 'Failed to send shout-out')
                          }
                        } catch (error: any) {
                          setShoutOutError('Network error. Please try again.')
                        } finally {
                          setShoutOutLoading(false)
                        }
                      }}
                    >
                      {shoutOutLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Sending...</span>
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Send Shout-Out
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </RealtimeProvider>
    </AuthGuard>
  )
}

export default function TeacherMessagingPage() {
  return (
    <AuthGuard requiredRole="teacher">
      <TeacherMessagingContent />
    </AuthGuard>
  )
}
