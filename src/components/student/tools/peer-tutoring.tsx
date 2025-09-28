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
  GraduationCap, 
  ArrowLeft, 
  Search, 
  Star, 
  Clock, 
  BookOpen, 
  MessageCircle, 
  Video,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Filter,
  Heart,
  CheckCircle2,
  DollarSign,
  Gift,
  Target,
  Brain,
  Zap,
  Crown,
  Settings
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
    times: string[]
  }[]
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

export function PeerTutoring({ onBack }: { onBack: () => void }) {
  const { profile } = useAppSelector((state) => state.auth)
  const [currentView, setCurrentView] = useState<'find-tutors' | 'my-sessions' | 'become-tutor'>('find-tutors')
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [sessions, setSessions] = useState<TutoringSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const subjects = ['All', 'Mathematics', 'Science', 'English', 'History', 'Art', 'Music', 'Computer Science']

  // Fetch tutors from API
  const fetchTutors = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSubject !== 'All') {
        params.append('subject', selectedSubject)
      }
      
      const response = await fetch(`/api/peer-tutoring/tutors?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTutors(data.tutors || [])
      } else {
        toast.error('Failed to load tutors')
      }
    } catch (error) {
      console.error('Error fetching tutors:', error)
      toast.error('Failed to load tutors')
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, selectedSubject])

  // Fetch user's tutoring sessions
  const fetchSessions = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const response = await fetch('/api/peer-tutoring/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchTutors()
    fetchSessions()
  }, [fetchTutors, fetchSessions])

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Mathematics': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'Science': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'English': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'History': return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      case 'Art': return 'bg-pink-500/20 text-pink-300 border-pink-400/30'
      case 'Music': return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
      case 'Computer Science': return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = searchQuery === '' || 
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tutor.specialties.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesSubject = selectedSubject === 'All' || tutor.subjects.includes(selectedSubject)
    
    return matchesSearch && matchesSubject
  })

  const bookSession = async (tutor: Tutor) => {
    if (!profile?.id) {
      toast.error('Please log in to book a session')
      return
    }
    
    // For now, create a simple booking - in a real app, this would open a booking modal
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(16, 0, 0, 0)
    
    const endTime = new Date(tomorrow)
    endTime.setHours(17, 0, 0, 0)
    
    try {
      const response = await fetch('/api/peer-tutoring/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutor_id: tutor.id,
          subject: tutor.subjects[0] || 'General',
          title: `${tutor.subjects[0] || 'General'} Tutoring Session`,
          scheduled_start: tomorrow.toISOString(),
          scheduled_end: endTime.toISOString(),
          description: 'Tutoring session booked through peer tutoring platform'
        })
      })
      
      if (response.ok) {
        toast.success('Session booked successfully!')
        fetchSessions()
        setCurrentView('my-sessions')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to book session')
      }
    } catch (error) {
      console.error('Error booking session:', error)
      toast.error('Failed to book session')
    }
  }

  const renderFindTutors = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            placeholder="Search tutors by name, subject, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 text-sm rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {subjects.map((subject) => (
            <Button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all ${
                selectedSubject === subject
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
            >
              {subject}
            </Button>
          ))}
        </div>
      </div>

      {/* Tutors Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-white/40 animate-pulse" />
          </div>
          <p className="text-white/60">Loading tutors...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTutors.map((tutor) => (
          <motion.div
            key={tutor.id}
            className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-blue-400 text-white text-lg font-bold">
                    {tutor.avatar}
                  </AvatarFallback>
                </Avatar>
                {tutor.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-white/90 font-bold text-lg">{tutor.name}</h3>
                  {tutor.isVolunteer && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      Volunteer
                    </Badge>
                  )}
                </div>
                <p className="text-white/60 text-sm mb-2">{tutor.grade}</p>
                
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white/80 font-medium">{tutor.rating}</span>
                    <span className="text-white/60 text-sm">({tutor.reviewCount})</span>
                  </div>
                  <div className="flex items-center space-x-1 text-white/60 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{tutor.sessionsCompleted} sessions</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {tutor.isVolunteer ? (
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-sm">
                    <Gift className="h-3 w-3 mr-1" />
                    Free
                  </Badge>
                ) : (
                  <div className="flex items-center space-x-1 text-white/80 font-bold">
                    <DollarSign className="h-4 w-4" />
                    <span>{tutor.hourlyRate}/hr</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-white/70 text-sm mb-4 line-clamp-2">{tutor.bio}</p>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {tutor.subjects.map((subject) => (
                    <Badge key={subject} className={`text-xs px-2 py-1 ${getSubjectColor(subject)}`}>
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {tutor.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} className="bg-white/10 text-white/60 text-xs px-2 py-1">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-white/60">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Responds {tutor.responseTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Next: {new Date(tutor.nextAvailable).toLocaleDateString()}</span>
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
                  onClick={() => bookSession(tutor)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Book Session
                </Button>
              </div>
            </div>
          </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredTutors.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No tutors found</p>
          <p className="text-white/60 text-sm">Try adjusting your search or subject filter</p>
        </div>
      )}
    </div>
  )

  const renderMySessions = () => (
    <div className="space-y-6">
      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              className={`p-6 rounded-2xl border backdrop-blur-sm ${
                session.status === 'upcoming' 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-400/20'
                  : session.status === 'completed'
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/20'
                  : 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-400/20'
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-white/90 font-bold text-lg">{session.topic}</h3>
                    <Badge className={`text-xs px-2 py-1 ${
                      session.status === 'upcoming' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' :
                      session.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                      'bg-red-500/20 text-red-300 border-red-400/30'
                    }`}>
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-white/70 text-sm mb-1">with {session.tutorName}</p>
                  <Badge className={`text-xs px-2 py-1 ${getSubjectColor(session.subject)}`}>
                    {session.subject}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <p className="text-white/80 font-medium">
                    {new Date(session.scheduledTime).toLocaleDateString()}
                  </p>
                  <p className="text-white/60 text-sm">
                    {new Date(session.scheduledTime).toLocaleTimeString([], { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-white/60 text-xs mt-1">{session.duration} minutes</p>
                </div>
              </div>

              {session.status === 'completed' && session.rating && (
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-white/60 text-sm">Your rating:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < session.rating! ? 'text-yellow-400 fill-current' : 'text-gray-400'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {session.notes && (
                <div className="p-3 bg-white/10 rounded-xl mb-4">
                  <p className="text-white/70 text-sm">{session.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {session.status === 'upcoming' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                {session.status === 'upcoming' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-300 text-xs px-3 py-1"
                  >
                    Cancel Session
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No tutoring sessions yet</p>
          <p className="text-white/60 text-sm mb-4">Book your first session to get started</p>
          <Button
            onClick={() => setCurrentView('find-tutors')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 rounded-xl"
          >
            Find Tutors
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
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-400/30">
                  <GraduationCap className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Peer Tutoring</h1>
                  <p className="text-white/60 text-sm">Connect with student tutors</p>
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
              { id: 'find-tutors', label: 'Find Tutors', icon: Search },
              { id: 'my-sessions', label: 'My Sessions', icon: Calendar },
              { id: 'become-tutor', label: 'Become a Tutor', icon: Crown }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
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
            {currentView === 'find-tutors' && renderFindTutors()}
            {currentView === 'my-sessions' && renderMySessions()}
            {currentView === 'become-tutor' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-yellow-300" />
                </div>
                <p className="text-white/80 text-lg font-bold mb-2">Become a Tutor</p>
                <p className="text-white/60 text-sm mb-4">Share your knowledge and help other students</p>
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-xl">
                  Apply Now
                </Button>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
