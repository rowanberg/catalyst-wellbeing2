'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Users2, ArrowLeft, Plus, Search, MessageCircle, Calendar, Clock, BookOpen, 
  Star, Crown, Settings, Filter, Users, Video, Mic, Share2, Target, Award, 
  TrendingUp, Eye, Heart, UserPlus, MapPin, Globe, Lock, Unlock, Send, 
  Paperclip, MoreVertical, Edit, Trash2, Copy, ExternalLink, Download, 
  Upload, CheckCircle, XCircle, AlertCircle, Info, Zap, Trophy, Flame, 
  ThumbsUp, MessageSquare, FileText, Image as ImageIcon, Play, Pause, 
  Volume2, VolumeX, Maximize, Minimize, RefreshCw
} from 'lucide-react'

// Updated interfaces to match database schema
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
  
  // Computed fields from joins
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
  location_type: 'online' | 'physical' | 'hybrid'
  location_details: any
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  created_by: string
  attendee_count?: number
  is_attending?: boolean
}

interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  message_type: 'text' | 'image' | 'file' | 'link' | 'announcement'
  content: string
  created_at: string
  sender_info: {
    first_name: string
    last_name: string
    avatar_url?: string
    role: string
  }
}

interface GroupActivity {
  id: string
  type: 'message' | 'session' | 'resource' | 'member_joined' | 'member_left'
  content: string
  timestamp: string
  user_name: string
  user_avatar?: string
}

export function StudyGroups({ onBack }: { onBack: () => void }) {
  const { profile } = useAppSelector((state) => state.auth)
  const [currentView, setCurrentView] = useState<'discover' | 'my-groups' | 'create' | 'group-detail' | 'chat'>('discover')
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [groupSessions, setGroupSessions] = useState<GroupSession[]>([])
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    difficulty: 'beginner' as const,
    max_members: 15,
    is_private: false,
    tags: [] as string[],
    grade_levels: [] as string[]
  })

  // Mock data for demonstration
  const subjects = ['All', 'Mathematics', 'Science', 'English', 'History', 'Art', 'Music', 'Physics', 'Chemistry', 'Biology']
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

  // Fetch study groups from API
  const fetchStudyGroups = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/study-groups?school_id=${profile.school_id}`)
      if (response.ok) {
        const data = await response.json()
        setStudyGroups(data.groups || [])
      } else {
        toast.error('Failed to load study groups')
      }
    } catch (error) {
      console.error('Error fetching study groups:', error)
      toast.error('Failed to load study groups')
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id])

  // Fetch user's groups
  const fetchMyGroups = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const response = await fetch(`/api/study-groups/my-groups?user_id=${profile.id}`)
      if (response.ok) {
        const data = await response.json()
        setMyGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching my groups:', error)
    }
  }, [profile?.id])

  // Join a study group
  const joinGroup = async (groupId: string) => {
    if (!profile?.id) return
    try {
      const response = await fetch('/api/study-groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, user_id: profile.id })
      })
      if (response.ok) {
        toast.success('Successfully joined the study group!')
        fetchStudyGroups()
        fetchMyGroups()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      toast.error('Failed to join group')
    }
  }

  // Create new study group
  const createGroup = async (groupData: Partial<StudyGroup>) => {
    if (!profile?.id || !profile?.school_id) return
    
    try {
      const response = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...groupData,
          school_id: profile.school_id,
          created_by: profile.id
        })
      })
      
      if (response.ok) {
        toast.success('Study group created successfully!')
        setCurrentView('discover')
        fetchStudyGroups()
        fetchMyGroups()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group')
    }
  }

  useEffect(() => {
    fetchStudyGroups()
    fetchMyGroups()
  }, [fetchStudyGroups, fetchMyGroups])

  // Filter groups based on search and filters
  const filteredGroups = studyGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === 'All' || group.subject === selectedSubject
    const matchesDifficulty = selectedDifficulty === 'All' || 
                             group.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
    
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  const renderGroupCard = (group: StudyGroup) => (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300 cursor-pointer"
            onClick={() => {
              setSelectedGroup(group)
              setCurrentView('group-detail')
            }}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={group.group_avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {group.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {group.is_private && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">{group.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                    {group.subject}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${
                    group.difficulty === 'beginner' ? 'border-green-400/30 text-green-300' :
                    group.difficulty === 'intermediate' ? 'border-yellow-400/30 text-yellow-300' :
                    'border-red-400/30 text-red-300'
                  }`}>
                    {group.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {group.average_rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-white/80 text-sm">{group.average_rating.toFixed(1)}</span>
                </div>
              )}
              <Crown className="h-4 w-4 text-yellow-400" />
            </div>
          </div>

          <p className="text-white/70 text-sm mb-4 line-clamp-2">{group.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{group.member_count || 0}/{group.max_members}</span>
              </div>
              {group.total_sessions > 0 && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{group.total_sessions} sessions</span>
                </div>
              )}
              {group.meeting_schedule && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{group.meeting_schedule.day}s</span>
                </div>
              )}
            </div>

            <Button
              size="sm"
              className={`${
                group.is_joined 
                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
              } border-0`}
              onClick={(e) => {
                e.stopPropagation()
                if (!group.is_joined) {
                  joinGroup(group.id)
                }
              }}
            >
              {group.is_joined ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Joined
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Join
                </>
              )}
            </Button>
          </div>

          {group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {group.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-white/5 border-white/20 text-white/60">
                  {tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/60">
                  +{group.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderCreateGroupForm = () => {

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.name || !formData.subject || !formData.description) {
        toast.error('Please fill in all required fields')
        return
      }
      createGroup(formData)
    }

    return (
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-white text-xl">Create Study Group</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Group Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Subject *</label>
              <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.filter(s => s !== 'All').map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this group is about..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/80 text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium mb-2 block">Max Members</label>
                <Input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.max_members}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_members: parseInt(e.target.value) || 15 }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_private"
                checked={formData.is_private}
                onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                className="rounded border-white/20"
              />
              <label htmlFor="is_private" className="text-white/80 text-sm">Make this group private</label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentView('discover')}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                Create Group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Study Groups</h1>
              <p className="text-white/60 text-sm">Collaborate and learn together</p>
            </div>
          </div>
          <Crown className="h-8 w-8 text-yellow-400" />
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="mb-6">
          <TabsList className="bg-white/10 border border-white/20 rounded-2xl p-1">
            <TabsTrigger value="discover" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
              <Globe className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-groups" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
              <Users className="h-4 w-4 mr-2" />
              My Groups ({myGroups.length})
            </TabsTrigger>
            <TabsTrigger value="create" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search study groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Groups Grid */}
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-white/50 animate-spin mx-auto mb-4" />
                <p className="text-white/60">Loading study groups...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredGroups.map(renderGroupCard)}
                </AnimatePresence>
              </div>
            )}

            {!loading && filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <Users2 className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-white/80 text-lg font-semibold mb-2">No study groups found</h3>
                <p className="text-white/60 mb-4">Try adjusting your search or filters</p>
                <Button
                  onClick={() => setCurrentView('create')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-groups" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {myGroups.map(renderGroupCard)}
              </AnimatePresence>
            </div>

            {myGroups.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-white/80 text-lg font-semibold mb-2">You haven't joined any groups yet</h3>
                <p className="text-white/60 mb-4">Explore and join study groups to start collaborating</p>
                <Button
                  onClick={() => setCurrentView('discover')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Discover Groups
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            {renderCreateGroupForm()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
