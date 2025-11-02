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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
  Heart,
  Check
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
  is_creator?: boolean
  join_request_status?: 'pending' | 'approved' | 'rejected' | null
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

interface JoinRequest {
  id: string
  group_id: string
  user_id: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  study_groups: {
    id: string
    name: string
    subject: string
    is_private: boolean
  }
  profiles: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
    grade_level?: string
  }
}

export function StudyGroups({ onBack }: { onBack?: () => void }) {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'explore' | 'my-groups' | 'schedule'>('explore')
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const profile = useAppSelector((state) => state.auth.profile)
  
  // Create group form state
  const [newGroup, setNewGroup] = useState({
    name: '',
    subject: 'Mathematics',
    description: '',
    max_members: 20,
    difficulty: 'beginner',
    is_private: false,
    tags: [] as string[],
    grade_levels: [] as string[]
  })
  const [isCreating, setIsCreating] = useState(false)

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
    setError(null)
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', response.status, errorData)
        throw new Error(errorData.error || `Failed to fetch study groups (${response.status})`)
      }

      const data = await response.json()
      setStudyGroups(data.groups || [])
    } catch (error: any) {
      console.error('Error fetching study groups:', error)
      setError(error.message || 'Failed to load study groups')
      setStudyGroups([])
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, selectedSubject, searchQuery])

  useEffect(() => {
    fetchStudyGroups()
    fetchJoinRequests()
  }, [fetchStudyGroups])

  // Fetch join requests for user's groups
  const fetchJoinRequests = useCallback(async () => {
    if (!profile?.id) return
    
    setLoadingRequests(true)
    try {
      const response = await fetch('/api/study-groups/requests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch join requests')
      }

      const data = await response.json()
      setJoinRequests(data.requests || [])
    } catch (error: any) {
      console.error('Error fetching join requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }, [profile?.id])

  // Approve or reject a join request
  const processJoinRequest = useCallback(async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingRequestId(requestId)
    try {
      const response = await fetch('/api/study-groups/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process request')
      }
      
      const result = await response.json()
      toast.success(result.message || `Request ${action}d successfully!`, {
        icon: action === 'approve' ? '✅' : '❌',
        duration: 3000
      })
      
      // Refresh both lists
      await Promise.all([fetchJoinRequests(), fetchStudyGroups()])
    } catch (error: any) {
      console.error('Error processing request:', error)
      toast.error(error.message || 'Failed to process request')
    } finally {
      setProcessingRequestId(null)
    }
  }, [fetchJoinRequests, fetchStudyGroups])

  const joinGroup = useCallback(async (groupId: string) => {
    if (!profile?.id) {
      toast.error('Please log in to join a group')
      return
    }
    
    setJoiningGroupId(groupId)
    try {
      const response = await fetch(`/api/study-groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to join group')
      }
      
      const result = await response.json()
      toast.success(result.message || 'Successfully joined the group!', {
        icon: '🎉',
        duration: 3000
      })
      // Refresh the groups list
      await fetchStudyGroups()
    } catch (error: any) {
      console.error('Error joining group:', error)
      toast.error(error.message || 'Failed to join group', {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: () => joinGroup(groupId)
        }
      })
    } finally {
      setJoiningGroupId(null)
    }
  }, [profile?.id, fetchStudyGroups])

  const createGroup = useCallback(async () => {
    if (!profile?.id || !profile?.school_id) {
      toast.error('Please log in to create a group')
      return
    }
    
    if (!newGroup.name.trim() || !newGroup.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create group')
      }
      
      const data = await response.json()
      toast.success('Study group created successfully!')
      
      // Reset form and close modal
      setNewGroup({
        name: '',
        subject: 'Mathematics',
        description: '',
        max_members: 20,
        difficulty: 'beginner',
        is_private: false,
        tags: [],
        grade_levels: []
      })
      setShowCreateModal(false)
      
      // Refresh the groups list
      fetchStudyGroups()
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error(error.message || 'Failed to create group')
    } finally {
      setIsCreating(false)
    }
  }, [profile?.id, profile?.school_id, newGroup, fetchStudyGroups])

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
      
      <div className="relative z-10 p-2 sm:p-4 lg:p-6 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-4">

        {/* Search and Filters - Mobile Optimized */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search + Create Button Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
              />
            </div>
            
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl whitespace-nowrap min-w-[44px] sm:min-w-max"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </div>
          
          {/* Subject Filters - Horizontal Scroll on Mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {subjects.map((subject) => (
              <Button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                variant={selectedSubject === subject ? "default" : "outline"}
                className={`text-xs sm:text-sm px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0 min-h-[36px] ${
                  selectedSubject === subject
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                }`}
              >
                {subject}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Join Requests Section - Only show if user has pending requests */}
        {joinRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Bell className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base sm:text-lg">
                    Pending Join Requests
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60">
                    {joinRequests.length} {joinRequests.length === 1 ? 'person wants' : 'people want'} to join your groups
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {joinRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/20 flex-shrink-0">
                        {request.profiles.avatar_url ? (
                          <AvatarImage src={request.profiles.avatar_url} alt={`${request.profiles.first_name} ${request.profiles.last_name}`} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-300 text-sm">
                          {request.profiles.first_name[0]}{request.profiles.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm sm:text-base">
                            {request.profiles.first_name} {request.profiles.last_name}
                          </p>
                          {request.profiles.grade_level && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                              {request.profiles.grade_level}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-white/60 mt-1">
                          Wants to join <span className="text-blue-300 font-medium">{request.study_groups.name}</span>
                        </p>
                        {request.message && (
                          <p className="text-xs text-white/50 mt-2 italic line-clamp-2">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-white/40 mt-1">
                          {new Date(request.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:flex-shrink-0">
                      <Button
                        onClick={() => processJoinRequest(request.id, 'approve')}
                        disabled={processingRequestId === request.id}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white flex-1 sm:flex-initial min-h-[36px]"
                      >
                        {processingRequestId === request.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 sm:mr-1" />
                            <span className="text-xs sm:text-sm">Approve</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => processJoinRequest(request.id, 'reject')}
                        disabled={processingRequestId === request.id}
                        size="sm"
                        variant="outline"
                        className="border-red-400/30 text-red-300 hover:bg-red-500/20 flex-1 sm:flex-initial min-h-[36px]"
                      >
                        {processingRequestId === request.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-300 border-t-transparent" />
                        ) : (
                          <>
                            <Activity className="h-3 w-3 sm:mr-1 rotate-45" />
                            <span className="text-xs sm:text-sm">Decline</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-8 h-8 bg-white/10 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-white/10 rounded w-20" />
                  <div className="h-8 bg-white/10 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Groups</h3>
            <p className="text-white/60 text-sm mb-4">{error}</p>
            <Button
              onClick={fetchStudyGroups}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Study Groups Grid */}
        {!loading && !error && (
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all hover:shadow-xl group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-blue-300 transition-colors">{group.name}</h3>
                        <p className="text-xs text-white/60">{group.subject}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {group.is_creator && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          <span className="hidden sm:inline">You</span>
                        </Badge>
                      )}
                      {group.is_joined && !group.is_creator ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span className="hidden sm:inline">Joined</span>
                        </Badge>
                      ) : group.join_request_status === 'pending' ? (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">Pending</span>
                        </Badge>
                      ) : group.is_private ? (
                        <div className="p-1.5 bg-yellow-500/20 rounded-lg" title="Private Group">
                          <Lock className="h-3.5 w-3.5 text-yellow-400" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-green-500/20 rounded-lg" title="Public Group">
                          <Globe className="h-3.5 w-3.5 text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-white/70 mb-3 line-clamp-2 leading-relaxed">{group.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex items-center space-x-1 bg-white/5 px-2 py-1 rounded-md">
                        <Users className="h-3 w-3 text-white/50" />
                        <span className="text-xs text-white/60">{group.member_count}/{group.max_members}</span>
                      </div>
                      
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-[10px] sm:text-xs px-2 py-0.5">
                        {group.difficulty}
                      </Badge>
                    </div>
                    
                    {group.average_rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white/60">{group.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <Avatar key={i} className="w-7 h-7 border-2 border-slate-900">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-300 text-xs">
                            U{i}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!group.is_creator && !group.is_joined && group.join_request_status !== 'pending') {
                          joinGroup(group.id)
                        }
                      }}
                      disabled={joiningGroupId === group.id || group.is_joined || group.is_creator || group.join_request_status === 'pending'}
                      size="sm"
                      className={`text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg min-h-[36px] transition-all ${
                        group.is_creator
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30 cursor-default'
                          : group.is_joined
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30 cursor-default'
                          : group.join_request_status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 cursor-default'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {joiningGroupId === group.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                          <span className="hidden sm:inline">Sending...</span>
                        </>
                      ) : group.is_creator ? (
                        <>
                          <Crown className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Owner</span>
                        </>
                      ) : group.is_joined ? (
                        <>
                          <Check className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Joined</span>
                        </>
                      ) : group.join_request_status === 'pending' ? (
                        <>
                          <Clock className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">{group.is_private ? 'Request' : 'Join'}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {filteredGroups.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users2 className="h-8 w-8 text-white/30" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No study groups found</h3>
                <p className="text-white/60 text-sm sm:text-base mb-6 max-w-md mx-auto">
                  {searchQuery || selectedSubject !== 'All'
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to create a study group in your school!'}
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
        </div>
      </div>

      {/* Create Group Modal - Redesigned */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg">
                <Users2 className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Create Study Group
                </DialogTitle>
                <DialogDescription className="text-white/60 text-sm">
                  Build a collaborative learning community
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Group Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-white font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  Group Name *
                </Label>
                <span className="text-xs text-white/40">{newGroup.name.length}/100</span>
              </div>
              <Input
                id="name"
                maxLength={100}
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="e.g., Advanced Calculus Study Team"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              {newGroup.name.trim() && newGroup.name.length < 5 && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Group name should be at least 5 characters
                </p>
              )}
            </div>

            {/* Subject & Difficulty Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-400" />
                  Subject *
                </Label>
                <Select
                  value={newGroup.subject}
                  onValueChange={(value) => setNewGroup({ ...newGroup, subject: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    {subjects.filter(s => s !== 'All').map((subject) => (
                      <SelectItem key={subject} value={subject} className="hover:bg-white/10">{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-white font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  Difficulty Level
                </Label>
                <Select
                  value={newGroup.difficulty}
                  onValueChange={(value: any) => setNewGroup({ ...newGroup, difficulty: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    <SelectItem value="beginner" className="hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        Beginner
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate" className="hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        Intermediate
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced" className="hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        Advanced
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-white font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-indigo-400" />
                  Description *
                </Label>
                <span className="text-xs text-white/40">{newGroup.description.length}/500</span>
              </div>
              <Textarea
                id="description"
                maxLength={500}
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Describe the group's goals, meeting schedule, and what members can expect...\n\nExample: We meet every Tuesday and Thursday at 4 PM to discuss calculus problems and prepare for exams together."
                rows={4}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              {newGroup.description.trim() && newGroup.description.length < 20 && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Add more details to help members understand your group
                </p>
              )}
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <Label htmlFor="max_members" className="text-white font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                Maximum Members
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="max_members"
                  type="number"
                  min="2"
                  max="50"
                  value={newGroup.max_members}
                  onChange={(e) => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) || 20 })}
                  className="bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 max-w-[120px]"
                />
                <div className="flex-1">
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={newGroup.max_members}
                    onChange={(e) => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>Small (2-10)</span>
                    <span>Medium (11-25)</span>
                    <span>Large (26-50)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="is_private"
                  checked={newGroup.is_private}
                  onCheckedChange={(checked) => setNewGroup({ ...newGroup, is_private: checked as boolean })}
                  className="border-white/30 data-[state=checked]:bg-blue-500 mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="is_private"
                    className="text-white font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4 text-yellow-400" />
                    Private Group
                  </Label>
                  <p className="text-xs text-white/60 mt-1">
                    {newGroup.is_private 
                      ? 'Members must send a request to join. You\'ll review and approve each request.'
                      : 'Anyone in your school can join instantly without approval.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-300">
                  <p className="font-medium mb-1">Tips for a successful study group:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                    <li>Set clear goals and expectations</li>
                    <li>Schedule regular meeting times</li>
                    <li>Create a welcoming environment for all members</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                // Reset form after closing
                setTimeout(() => {
                  setNewGroup({
                    name: '',
                    subject: 'Mathematics',
                    description: '',
                    max_members: 20,
                    difficulty: 'beginner',
                    is_private: false,
                    tags: [],
                    grade_levels: []
                  })
                }, 300)
              }}
              disabled={isCreating}
              className="border-white/20 text-white hover:bg-white/10 sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createGroup}
              disabled={isCreating || !newGroup.name.trim() || newGroup.name.length < 5 || !newGroup.description.trim() || newGroup.description.length < 20}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1 shadow-lg hover:shadow-xl transition-all"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating Group...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Study Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
