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
  Users2, 
  Plus, 
  Search, 
  MessageCircle, 
  Calendar, 
  Clock, 
  BookOpen, 
  Star, 
  Crown,
  Users,
  Video,
  UserPlus,
  Globe,
  Lock,
  TrendingUp,
  Activity,
  Award,
  Filter,
  Sparkles,
  ChevronRight,
  MapPin,
  Zap,
  Target,
  Trophy,
  Bell,
  Settings,
  Info,
  Heart
} from 'lucide-react'

interface StudyGroup {
  id: string
  school_id: string
  name: string
  subject: string
  description: string
  max_members: number
  is_private: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  meeting_schedule?: {
    day: string
    time: string
    frequency: 'weekly' | 'biweekly' | 'monthly'
  }
  next_session?: string
  group_avatar_url?: string
  group_code: string
  status: 'active' | 'inactive' | 'archived'
  tags: string[]
  grade_levels: string[]
  total_sessions: number
  average_rating: number
  total_ratings: number
  created_by: string
  created_at: string
  updated_at: string
  
  // Computed fields
  member_count?: number
  is_joined?: boolean
  user_role?: 'member' | 'moderator' | 'creator'
  creator_info?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
    grade_level?: string
  }
  recent_activity?: GroupActivity[]
  upcoming_session?: GroupSession
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'member' | 'moderator' | 'creator'
  joined_at: string
  last_active: string
  contribution_score: number
  is_active: boolean
  user_info: {
    first_name: string
    last_name: string
    avatar_url?: string
    grade_level?: string
  }
}

interface GroupSession {
  id: string
  group_id: string
  title: string
  description?: string
  session_type: 'study' | 'discussion' | 'presentation' | 'quiz' | 'project'
  scheduled_start: string
  scheduled_end: string
  actual_start?: string
  actual_end?: string
  location_type: 'online' | 'physical' | 'hybrid'
  location_details: any
  max_attendees?: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  materials: any[]
  agenda: any[]
  created_by: string
  created_at: string
  attendee_count?: number
  is_attending?: boolean
}

interface GroupMessage {
  id: string
  group_id: string
  session_id?: string
  sender_id: string
  message_type: 'text' | 'image' | 'file' | 'link' | 'poll' | 'announcement'
  content: string
  attachments: any[]
  reply_to?: string
  is_pinned: boolean
  is_edited: boolean
  edited_at?: string
  created_at: string
  reactions: Record<string, string[]>
  mentions: string[]
  sender_info: {
    first_name: string
    last_name: string
    avatar_url?: string
    role: string
  }
}

interface GroupResource {
  id: string
  group_id: string
  uploaded_by: string
  title: string
  description?: string
  resource_type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'quiz' | 'flashcard'
  file_url?: string
  file_size?: number
  file_format?: string
  tags: string[]
  is_public: boolean
  download_count: number
  created_at: string
  updated_at: string
  uploader_info: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

interface GroupActivity {
  id: string
  type: 'message' | 'session' | 'resource' | 'member_joined' | 'member_left' | 'session_completed'
  content: string
  timestamp: string
  user_name: string
  user_avatar?: string
  metadata?: any
}

export function StudyGroups({ onBack }: { onBack?: () => void }) {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'explore' | 'my-groups' | 'schedule'>('explore')
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const profile = useAppSelector((state) => state.auth.user)

  const subjects = ['All', 'Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology', 'Computer Science']
  
  // Stats
  const [userStats, setUserStats] = useState({
    joinedGroups: 5,
    sessionsAttended: 23,
    contributionScore: 85,
    streak: 7
  })

  // Fetch study groups from API
  const fetchStudyGroups = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        school_id: profile.school_id
      })
      
      if (selectedSubject && selectedSubject !== 'All') {
        params.append('subject', selectedSubject)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/study-groups?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch study groups')
      }

      const data = await response.json()
      setStudyGroups(data.groups || [])
    } catch (error: any) {
      console.error('Error fetching study groups:', error)
      toast.error('Failed to load study groups')
      setStudyGroups([])
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, selectedSubject, searchQuery])

  useEffect(() => {
    fetchStudyGroups()
  }, [fetchStudyGroups])

  const joinGroup = useCallback(async (groupId: string) => {
    if (!profile?.id) {
      toast.error('Please log in to join a group')
      return
    }
    
    try {
      const response = await fetch(`/api/study-groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join group')
      }
      
      toast.success('Successfully joined the group!')
      // Refresh the groups list
      fetchStudyGroups()
    } catch (error: any) {
      console.error('Error joining group:', error)
      toast.error(error.message || 'Failed to join group')
    }
  }, [profile?.id, fetchStudyGroups])

  // Filter groups based on search and subject
  const filteredGroups = useMemo(() => {
    return studyGroups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            group.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = selectedSubject === 'All' || group.subject === selectedSubject
      return matchesSearch && matchesSubject
    })
  }, [studyGroups, searchQuery, selectedSubject])

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50 relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5" />
      
      <div className="relative z-10 p-3 sm:p-4 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">

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
              placeholder="Search study groups..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
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
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                }`}
              >
                {subject}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Study Groups Grid */}
        <motion.div
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => joinGroup(group.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{group.name}</h3>
                      <p className="text-xs text-white/60">{group.subject}</p>
                    </div>
                  </div>
                  
                  {group.is_private ? (
                    <Lock className="h-4 w-4 text-yellow-400" />
                  ) : (
                    <Globe className="h-4 w-4 text-green-400" />
                  )}
                </div>
                
                <p className="text-xs text-white/70 mb-3 line-clamp-2">{group.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-white/50" />
                      <span className="text-xs text-white/60">{group.member_count}/{group.max_members}</span>
                    </div>
                    
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                      {group.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-white/50" />
                    <span className="text-xs text-white/60">Next: Today</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {[1, 2, 3].map((i) => (
                      <Avatar key={i} className="w-6 h-6 border-2 border-white/20">
                        <AvatarFallback className="bg-blue-500/20 text-blue-300 text-xs">
                          U{i}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      joinGroup(group.id)
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Join
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <Users2 className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No study groups found</h3>
              <p className="text-white/60 mb-4">Try adjusting your search or create a new group</p>
              <Button
                onClick={() => console.log('Create group')}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  )
}
