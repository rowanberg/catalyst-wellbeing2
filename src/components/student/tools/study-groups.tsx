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
  Users2, 
  ArrowLeft, 
  Plus, 
  Search, 
  MessageCircle, 
  Calendar, 
  Clock, 
  BookOpen, 
  Star, 
  Crown,
  Settings,
  Filter,
  Users,
  Video,
  Mic,
  Share2,
  Target,
  Award,
  TrendingUp,
  Eye,
  Heart,
  UserPlus,
  MapPin,
  Globe,
  Lock,
  Unlock,
  Send,
  Paperclip,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Trophy,
  Flame,
  ThumbsUp,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw
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
  const [groupResources, setGroupResources] = useState<GroupResource[]>([])

  const subjects = ['All', 'Mathematics', 'Science', 'English', 'History', 'Art', 'Music', 'Physics', 'Chemistry', 'Biology']
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

  // Fetch study groups
  const fetchStudyGroups = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/study-groups?school_id=${profile.school_id}`)
      if (response.ok) {
        const data = await response.json()
        setStudyGroups(data.groups || [])
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

  useEffect(() => {
    fetchStudyGroups()
    fetchMyGroups()
  }, [fetchStudyGroups, fetchMyGroups])

  const joinGroup = async (groupId: string) => {
    if (!profile?.id) return
    
    try {
      const response = await fetch('/api/study-groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, user_id: profile.id })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'Successfully joined the study group!')
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

  const leaveGroup = async (groupId: string) => {
    if (!profile?.id) return
    
    try {
      const response = await fetch(`/api/study-groups/join?group_id=${groupId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'Successfully left the group')
        fetchStudyGroups()
        fetchMyGroups()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error('Failed to leave group')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'advanced': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Mathematics': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'Science': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'English': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'History': return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      case 'Art': return 'bg-pink-500/20 text-pink-300 border-pink-400/30'
      case 'Music': return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const filteredGroups = studyGroups.filter(group => {
    const matchesSearch = searchQuery === '' || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesSubject = selectedSubject === 'All' || group.subject === selectedSubject
    const matchesDifficulty = selectedDifficulty === 'All' || group.difficulty === selectedDifficulty.toLowerCase()
    
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  const renderDiscoverGroups = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            placeholder="Search study groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 text-sm rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
          />
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {subjects.map((subject) => (
            <Button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all ${
                selectedSubject === subject
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
            >
              {subject}
            </Button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredGroups.map((group) => (
          <motion.div
            key={group.id}
            className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedGroup(group)
              setCurrentView('group-detail')
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-white/90 font-bold text-lg">{group.name}</h3>
                  {group.is_private && <Lock className="h-4 w-4 text-yellow-400" />}
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className={`text-xs px-2 py-1 ${getSubjectColor(group.subject)}`}>
                    {group.subject}
                  </Badge>
                  <Badge className={`text-xs px-2 py-1 ${getDifficultyColor(group.difficulty)}`}>
                    {group.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-white/60 text-xs">{group.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-white/60 text-sm mb-1">
                  <Users className="h-4 w-4" />
                  <span>{group.member_count || 0}/{group.max_members}</span>
                </div>
                {group.is_joined && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                    Joined
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-white/70 text-sm mb-4 line-clamp-2">{group.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={group.creator_info?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-rose-400 to-pink-400 text-white text-xs">
                    {group.creator_info ? `${group.creator_info.first_name[0]}${group.creator_info.last_name[0]}` : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white/80 text-xs font-medium">
                    {group.creator_info ? `${group.creator_info.first_name} ${group.creator_info.last_name}` : 'Unknown'}
                  </p>
                  <p className="text-white/60 text-xs">Grade {group.creator_info?.grade_level || 'N/A'}</p>
                </div>
              </div>
              
              {group.next_session && (
                <div className="flex items-center space-x-1 text-white/60 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>Next: {new Date(group.next_session).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {group.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} className="bg-white/10 text-white/60 text-xs px-2 py-0">
                  #{tag}
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users2 className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No study groups found</p>
          <p className="text-white/60 text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )

  const CreateGroupForm = ({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) => {
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
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.name || !formData.subject || !formData.description) {
        toast.error('Please fill in all required fields')
        return
      }

      setIsSubmitting(true)
      try {
        const response = await fetch('/api/study-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (response.ok) {
          toast.success('Study group created successfully!')
          onSuccess()
        } else {
          const error = await response.json()
          toast.error(error.message || 'Failed to create group')
        }
      } catch (error) {
        console.error('Error creating group:', error)
        toast.error('Failed to create group')
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
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
                  onClick={onCancel}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderMyGroups = () => (
    <div className="space-y-6">
      {myGroups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {myGroups.map((group) => (
            <motion.div
              key={group.id}
              className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-400/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white/90 font-bold text-lg mb-2">{group.name}</h3>
                  <Badge className={`text-xs px-2 py-1 ${getSubjectColor(group.subject)}`}>
                    {group.subject}
                  </Badge>
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
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-white/70 text-sm mb-4">{group.description}</p>

              {group.next_session && (
                <div className="flex items-center space-x-2 mb-4 p-3 bg-white/10 rounded-xl">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-white/90 text-sm font-medium">Next Session</p>
                    <p className="text-white/60 text-xs">
                      {new Date(group.next_session).toLocaleDateString()} at {new Date(group.next_session).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-white/60 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{group.member_count || 0} members</span>
                </div>
                <Button
                  onClick={() => leaveGroup(group.id)}
                  variant="outline"
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-300 text-xs px-3 py-1"
                >
                  Leave Group
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users2 className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No study groups yet</p>
          <p className="text-white/60 text-sm mb-4">Join or create a study group to get started</p>
          <Button
            onClick={() => setCurrentView('discover')}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl"
          >
            Discover Groups
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
                <div className="p-3 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-2xl border border-rose-400/30">
                  <Users2 className="h-6 w-6 text-rose-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Study Groups</h1>
                  <p className="text-white/60 text-sm">Collaborative learning spaces</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentView('create')}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
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
              { id: 'discover', label: 'Discover', icon: Globe },
              { id: 'my-groups', label: 'My Groups', icon: Users2 }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
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
            {currentView === 'discover' && renderDiscoverGroups()}
            {currentView === 'my-groups' && renderMyGroups()}
            {currentView === 'create' && (
              <CreateGroupForm 
                onCancel={() => setCurrentView('discover')}
                onSuccess={() => {
                  setCurrentView('discover')
                  fetchStudyGroups()
                  fetchMyGroups()
                }}
              />
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
