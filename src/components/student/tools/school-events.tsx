'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Info
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const renderDiscoverEvents = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 text-sm rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-white/40 animate-pulse" />
          </div>
          <p className="text-white/60">Loading events...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
          <motion.div
            key={event.id}
            className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-white/90 font-bold text-lg">{event.title}</h3>
                  {event.isPopular && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className={`text-xs px-2 py-1 ${getCategoryColor(event.category)}`}>
                    {getCategoryIcon(event.category)}
                    <span className="ml-1 capitalize">{event.category}</span>
                  </Badge>
                  {event.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-white/60 text-xs">{event.rating} ({event.reviewCount})</span>
                    </div>
                  )}
                </div>
              </div>
              {event.isRegistered && (
                <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Registered
                </Badge>
              )}
            </div>

            <p className="text-white/70 text-sm mb-4 line-clamp-3">{event.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-4 text-sm text-white/70">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}{event.endTime && ` - ${event.endTime}`}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-white/70">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>

              {event.maxParticipants && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-white/70">
                    <Users className="h-4 w-4" />
                    <span>{event.currentParticipants}/{event.maxParticipants} participants</span>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(event.currentParticipants / event.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs">
                    {event.organizer.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white/80 text-xs font-medium">{event.organizer.name}</p>
                  <p className="text-white/60 text-xs">{event.organizer.role}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => event.isRegistered ? unregisterFromEvent(event.id) : registerForEvent(event.id)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    event.isRegistered
                      ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                  }`}
                >
                  {event.isRegistered ? 'Unregister' : 'Register'}
                </Button>
              </div>
            </div>

            {event.registrationDeadline && !event.isRegistered && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <p className="text-yellow-300 text-xs">
                    Registration deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No events found</p>
          <p className="text-white/60 text-sm">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  )

  const renderMyEvents = () => (
    <div className="space-y-6">
      {myEvents.length > 0 ? (
        <div className="space-y-4">
          {myEvents.map((event) => (
            <motion.div
              key={event.id}
              className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20 backdrop-blur-sm"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white/90 font-bold text-lg mb-2">{event.title}</h3>
                  <Badge className={`text-xs px-2 py-1 ${getCategoryColor(event.category)}`}>
                    {getCategoryIcon(event.category)}
                    <span className="ml-1 capitalize">{event.category}</span>
                  </Badge>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Registered
                </Badge>
              </div>

              <p className="text-white/70 text-sm mb-4">{event.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}{event.endTime && ` - ${event.endTime}`}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs">
                      {event.organizer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white/80 text-xs font-medium">{event.organizer.name}</p>
                    <p className="text-white/60 text-xs">{event.organizer.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => unregisterFromEvent(event.id)}
                    variant="outline"
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-300 text-xs px-3 py-1"
                  >
                    Unregister
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No registered events</p>
          <p className="text-white/60 text-sm mb-4">Discover and register for exciting school events</p>
          <Button
            onClick={() => setCurrentView('discover')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-xl"
          >
            Discover Events
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-400/30">
                  <Calendar className="h-6 w-6 text-orange-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">School Events Hub</h1>
                  <p className="text-white/60 text-sm">Discover & join activities</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            className="flex space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { id: 'discover', label: 'Discover', icon: Search },
              { id: 'my-events', label: 'My Events', icon: CheckCircle2 },
              { id: 'calendar', label: 'Calendar', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              )
            })}
          </motion.div>

          {/* Content */}
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'discover' && renderDiscoverEvents()}
            {currentView === 'my-events' && renderMyEvents()}
            {currentView === 'calendar' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-orange-300" />
                </div>
                <p className="text-white/80 text-lg font-bold mb-2">Calendar View</p>
                <p className="text-white/60 text-sm">Interactive calendar coming soon</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
