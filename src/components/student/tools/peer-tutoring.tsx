'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/lib/redux/hooks'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GraduationCap, 
  Search, 
  Star, 
  Clock, 
  BookOpen, 
  MessageCircle, 
  Video,
  Calendar,
  Award,
  Users,
  Heart,
  CheckCircle2,
  Target,
  Brain,
  TrendingUp,
  Sparkles,
  Filter,
  ChevronRight,
  Globe,
  Zap,
  Trophy,
  Settings,
  Bell,
  Info,
  DollarSign,
  Languages,
  Timer,
  Activity
} from 'lucide-react'

interface Tutor {
  id: string
  name: string
  avatar: string
  grade: string
  subjects: string[]
  specialties: string[]
  rating: number
  reviewCount: number
  sessionsCompleted: number
  hourlyRate?: number
  isVolunteer: boolean
  availability: {
    day: string
    timeSlots: string[]
  }
  bio: string
  achievements: string[]
  responseTime: string
  languages: string[]
  isOnline: boolean
  nextAvailable: string
}

interface TutoringSession {
  id: string
  tutorId: string
  tutorName: string
  subject: string
  topic: string
  scheduledTime: string
  duration: number
  status: 'upcoming' | 'completed' | 'cancelled'
  rating?: number
  notes?: string
}

export function PeerTutoring({ onBack }: { onBack?: () => void }) {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'find-tutor' | 'my-sessions' | 'become-tutor'>('find-tutor')
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const profile = useAppSelector((state) => state.auth.profile)

  const subjects = ['All', 'Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology', 'Computer Science']
  
  // User tutoring stats
  const [userStats, setUserStats] = useState({
    sessionsCompleted: 12,
    averageRating: 4.7,
    totalHours: 24,
    savedMoney: 480
  })

  // Fetch tutors from API
  const fetchTutors = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (selectedSubject && selectedSubject !== 'All') {
        params.append('subject', selectedSubject)
      }
      
      const response = await fetch(`/api/peer-tutoring/tutors?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tutors')
      }
      
      const data = await response.json()
      setTutors(data.tutors || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
      toast.error('Failed to load tutors')
      setTutors([])
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, selectedSubject])
  
  useEffect(() => {
    fetchTutors()
  }, [fetchTutors])

  // Filter tutors based on search (subject filtering is done server-side)
  const filteredTutors = tutors.filter(tutor => {
    if (!searchQuery) return true
    return tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           tutor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
           tutor.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const bookSession = useCallback(async (tutorId: string) => {
    if (!profile?.id) {
      toast.error('Please log in to book a session')
      return
    }
    
    try {
      const response = await fetch('/api/peer-tutoring/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutor_id: tutorId,
          subject: selectedSubject !== 'All' ? selectedSubject : 'General',
          title: `Tutoring Session`,
          scheduled_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          scheduled_end: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
          description: 'Peer tutoring session booked through the platform'
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to book session')
      }
      
      toast.success('Session booked successfully!')
    } catch (error: any) {
      console.error('Error booking session:', error)
      toast.error(error.message || 'Failed to book session')
    }
  }, [profile?.id, selectedSubject])

  const renderDesktopLayout = () => (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left Sidebar - Stats & Filters */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Stats */}
          <motion.div
            className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 backdrop-blur-sm"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/90 font-semibold flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>Your Progress</span>
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">Sessions</span>
                <span className="text-white/90 font-bold text-lg">{userStats.sessionsCompleted}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Middle Column - Search and Tutors */}
        <div className="lg:col-span-3 space-y-4">

        {/* Search and Filters */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutors or subjects..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
            />
          </div>
          
          <div className="flex gap-2">
            {subjects.map((subject) => (
              <Button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                variant={selectedSubject === subject ? "default" : "outline"}
                className={`text-xs ${
                  selectedSubject === subject
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                }`}
              >
                {subject}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Tutors Grid */}
        <motion.div
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 animate-pulse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded"></div>
                    <div className="h-3 bg-white/10 rounded w-5/6"></div>
                  </div>
                </motion.div>
              ))
            ) : filteredTutors.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No tutors found</h3>
                <p className="text-white/60 mb-4">Try adjusting your search or become a tutor yourself</p>
                <Button
                  onClick={() => console.log('Become tutor')}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Become a Tutor
                </Button>
              </div>
            ) : (
              filteredTutors.map((tutor, index) => (
              <motion.div
                key={tutor.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start space-x-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-purple-500/20 text-purple-300">
                      {tutor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-white text-sm">{tutor.name}</h3>
                      {tutor.isVolunteer && (
                        <Heart className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                        Grade {tutor.grade}
                      </Badge>
                      
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-white/60">{tutor.rating}</span>
                        <span className="text-xs text-white/40">({tutor.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-white/70 mb-3 line-clamp-2">{tutor.bio}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex flex-wrap gap-1">
                    {tutor.subjects.map((subject) => (
                      <Badge key={subject} className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {tutor.specialties.slice(0, 2).map((specialty) => (
                      <Badge key={specialty} className="bg-white/10 text-white/60 text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-white/60">{tutor.sessionsCompleted} sessions</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-white/50" />
                      <span className="text-xs text-white/60">{tutor.responseTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">
                    {tutor.isVolunteer ? (
                      <span className="text-green-400 font-medium">Free</span>
                    ) : (
                      <span>${tutor.hourlyRate}/hour</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => console.log('Message tutor')}
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 p-2"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      onClick={() => bookSession(tutor.id)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-cyan-900/50 to-slate-900/50 relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-indigo-500/5" />
      
      <div className="relative z-10 p-3 sm:p-4 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutors..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </motion.div>

          {/* Tutors List */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                </div>
              ))
            ) : (
              filteredTutors.map((tutor) => (
                <div key={tutor.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-white font-medium">{tutor.name}</h3>
                  <p className="text-white/60 text-sm">{tutor.subjects.join(', ')}</p>
                </div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}