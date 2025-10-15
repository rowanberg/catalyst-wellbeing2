'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Calendar, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Heart,
  Share2,
  Bell,
  Filter,
  Plus,
  Eye,
  MessageCircle,
  Trophy,
  Music,
  Palette,
  BookOpen,
  Gamepad2,
  Award,
  Camera,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  Activity,
  Globe
} from 'lucide-react'

interface SchoolEvent {
  id: string
  title: string
  description: string
  category: 'academic' | 'sports' | 'arts' | 'social' | 'volunteer' | 'club'
  date: string
  time: string
  endTime?: string
  location: string
  organizer: {
    name: string
    role: string
    avatar: string
  }
  maxParticipants?: number
  currentParticipants: number
  isRegistered: boolean
  registrationDeadline?: string
  requirements?: string[]
  tags: string[]
  image?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  isPopular: boolean
  rating?: number
  reviewCount?: number
}

export function SchoolEventsHub({ onBack }: { onBack: () => void }) {
  const { profile } = useAppSelector((state) => state.auth)
  const [currentView, setCurrentView] = useState<'discover' | 'my-events' | 'calendar'>('discover')
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [myEvents, setMyEvents] = useState<SchoolEvent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // User event stats
  const [userStats, setUserStats] = useState({
    eventsAttended: 18,
    upcomingEvents: 5,
    favoriteEvents: 12,
    participationRate: 85
  })

  const categories = [
    { id: 'All', label: 'All Events', icon: Calendar, color: 'gray' },
    { id: 'academic', label: 'Academic', icon: BookOpen, color: 'blue' },
    { id: 'sports', label: 'Sports', icon: Trophy, color: 'green' },
    { id: 'arts', label: 'Arts', icon: Palette, color: 'purple' },
    { id: 'social', label: 'Social', icon: Users, color: 'pink' },
    { id: 'volunteer', label: 'Volunteer', icon: Heart, color: 'red' },
    { id: 'club', label: 'Clubs', icon: Star, color: 'yellow' }
  ]

  // Fetch school events from API
  const fetchEvents = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') {
        params.append('event_type', selectedCategory)
      }
      
      const response = await fetch(`/api/school-events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        toast.error('Failed to load events')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, selectedCategory])

  // Fetch user's registered events
  const fetchMyEvents = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const response = await fetch('/api/school-events/my-events')
      if (response.ok) {
        const data = await response.json()
        setMyEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching my events:', error)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchEvents()
    fetchMyEvents()
  }, [fetchEvents, fetchMyEvents])

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category)
    switch (cat?.color) {
      case 'blue': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'green': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'purple': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'pink': return 'bg-pink-500/20 text-pink-300 border-pink-400/30'
      case 'red': return 'bg-red-500/20 text-red-300 border-red-400/30'
      case 'yellow': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category)
    const Icon = cat?.icon || Calendar
    return <Icon className="h-4 w-4" />
  }

  const registerForEvent = async (eventId: string) => {
    if (!profile?.id) {
      toast.error('Please log in to register for events')
      return
    }
    
    try {
      const response = await fetch('/api/school-events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'Successfully registered for event!')
        fetchEvents()
        fetchMyEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to register for event')
      }
    } catch (error) {
      console.error('Error registering for event:', error)
      toast.error('Failed to register for event')
    }
  }

  const unregisterFromEvent = async (eventId: string) => {
    if (!profile?.id) return
    
    try {
      const response = await fetch(`/api/school-events/register?event_id=${eventId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'Successfully unregistered from event')
        fetchEvents()
        fetchMyEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to unregister from event')
      }
    } catch (error) {
      console.error('Error unregistering from event:', error)
      toast.error('Failed to unregister from event')
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [events, searchQuery, selectedCategory])

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-indigo-900/50 to-slate-900/50 relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
      
      <div className="relative z-10 p-3 sm:p-4 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Mobile Header */}
          <motion.div 
            className="flex items-center justify-between mb-4 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-400/30">
                <Calendar className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">School Events</h1>
                <p className="text-white/60 text-xs">{userStats.upcomingEvents} upcoming</p>
              </div>
            </div>
            
            <Button
              onClick={() => console.log('Create event')}
              size="sm"
              className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </motion.div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Stats & Categories */}
            <div className="lg:col-span-1 space-y-4">
              {/* User Stats */}
              <motion.div
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 backdrop-blur-sm"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/90 font-semibold flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    <span>Your Activity</span>
                  </h3>
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    Active
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Events Attended</span>
                    <span className="text-white/90 font-bold text-lg">{userStats.eventsAttended}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Upcoming</span>
                    <span className="text-white/90 font-bold text-lg">{userStats.upcomingEvents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Favorites</span>
                    <span className="text-white/90 font-bold text-lg">{userStats.favoriteEvents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Participation</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-green-400 font-bold text-lg">{userStats.participationRate}%</span>
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    </div>
                  </div>
                  <Progress value={userStats.participationRate} className="h-1" />
                </div>
              </motion.div>

              {/* Category Filter */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white/90 text-sm font-bold flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-indigo-400" />
                    <span>Categories</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.slice(0, 5).map((category) => {
                    const Icon = category.icon
                    return (
                      <Button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        className={`w-full justify-start text-xs ${
                          selectedCategory === category.id 
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' 
                            : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'
                        }`}
                        size="sm"
                      >
                        <Icon className="h-3 w-3 mr-2" />
                        {category.label}
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                <h3 className="text-white/90 font-semibold text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-400/30 text-indigo-300 text-xs">
                    <Plus className="h-3 w-3 mr-2" />
                    Create Event
                  </Button>
                  <Button className="w-full justify-start bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 text-xs">
                    <Calendar className="h-3 w-3 mr-2" />
                    My Calendar
                  </Button>
                  <Button className="w-full justify-start bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 text-xs">
                    <Heart className="h-3 w-3 mr-2" />
                    Favorites
                  </Button>
                </div>
              </Card>
            </div>

            {/* Middle - Events Grid */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)} className="w-full">
                      <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="discover" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Discover
                        </TabsTrigger>
                        <TabsTrigger value="my-events" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          My Events
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Calendar
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search events..."
                      className="w-full bg-white/5 border-white/20 text-white placeholder:text-white/40 pl-10"
                    />
                  </div>

                  {/* Events Grid */}
                  <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                    {filteredEvents.slice(0, 6).map((event, index) => (
                      <motion.div
                        key={event.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getCategoryColor(event.category)}>
                                {getCategoryIcon(event.category)}
                                <span className="ml-1">{event.category}</span>
                              </Badge>
                              {event.isPopular && (
                                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-white/90 font-medium text-sm mb-1">{event.title}</h4>
                            <p className="text-white/70 text-xs line-clamp-2 mb-2">{event.description}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-white/60">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3 text-white/50" />
                              <span className="text-xs text-white/60">
                                {event.currentParticipants}/{event.maxParticipants || '∞'}
                              </span>
                            </div>
                            {event.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-white/60">{event.rating}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              event.isRegistered ? unregisterFromEvent(event.id) : registerForEvent(event.id)
                            }}
                            size="sm"
                            className={event.isRegistered 
                              ? "bg-green-500/20 text-green-300 border-green-400/30 text-xs"
                              : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs"
                            }
                          >
                            {event.isRegistered ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Registered
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Register
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Featured & Upcoming */}
            <div className="lg:col-span-1 space-y-4">
              {/* Featured Event */}
              <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-indigo-400/20 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white/90 text-sm font-bold flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>Featured</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs mb-2">
                      Arts Festival
                    </Badge>
                    <h4 className="text-white/90 font-medium text-sm mb-1">Annual Art Exhibition</h4>
                    <p className="text-white/60 text-xs mb-2">Showcase your creativity</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">This Friday</span>
                      <span className="text-indigo-400 font-medium">6:00 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming This Week */}
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-400/20 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white/90 text-sm font-bold flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span>This Week</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/80 text-xs font-medium">Event {i}</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                          Tomorrow
                        </Badge>
                      </div>
                      <p className="text-white/60 text-xs">3:00 PM - Main Hall</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Popular Categories */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-white/90 font-semibold text-sm">Trending</h3>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-indigo-400 font-bold text-sm">#{i}</span>
                        <span className="text-white/80 text-xs">Category {i}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-white/40" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile/Tablet View */}
          <div className="lg:hidden space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-10"
              />
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {filteredEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <h4 className="text-white font-medium text-sm mb-2">{event.title}</h4>
                  <p className="text-white/60 text-xs mb-2">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(event.category)}>
                      {event.category}
                    </Badge>
                    <Button
                      onClick={() => event.isRegistered ? unregisterFromEvent(event.id) : registerForEvent(event.id)}
                      size="sm"
                      className="text-xs"
                    >
                      {event.isRegistered ? 'Registered' : 'Register'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
