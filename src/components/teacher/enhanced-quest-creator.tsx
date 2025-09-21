'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target,
  Award,
  Plus,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  Settings,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Lightbulb,
  Gamepad2,
  Heart,
  Crown,
  Gem,
  BookOpen,
  Palette,
  MessageSquare,
  Brain,
  Trophy,
  Save
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface Quest {
  id: string
  title: string
  description: string
  category: 'academic' | 'behavior' | 'social' | 'creative' | 'wellness' | 'leadership'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  xpReward: number
  gemReward: number
  requirements: string[]
  timeLimit?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  completedBy: string[]
  totalAttempts: number
  successRate: number
  averageCompletionTime: number
  tags: string[]
  prerequisites: string[]
  isTemplate: boolean
  templateCategory?: string
  autoAssign: boolean
  targetStudents: string[]
  dueDate?: string
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly'
  points: {
    creativity: number
    collaboration: number
    critical_thinking: number
    communication: number
  }
}

interface QuestBadge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria: string[]
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  isActive: boolean
  createdAt: string
  updatedAt: string
  earnedBy: string[]
  category: 'achievement' | 'milestone' | 'skill' | 'behavior' | 'special'
  points: number
  prerequisites: string[]
  isStackable: boolean
  maxStack?: number
  validUntil?: string
  autoAward: boolean
  triggerConditions: {
    questsCompleted?: number
    xpEarned?: number
    streakDays?: number
    specificQuests?: string[]
    behaviorPoints?: number
  }
}

interface QuestTemplate {
  id: string
  name: string
  description: string
  category: string
  quests: Partial<Quest>[]
  badges: Partial<QuestBadge>[]
  estimatedDuration: string
  targetAge: string
  learningObjectives: string[]
}

interface QuestAnalytics {
  totalQuests: number
  activeQuests: number
  completionRate: number
  averageEngagement: number
  topPerformingQuests: Quest[]
  strugglingStudents: string[]
  recentCompletions: {
    questId: string
    studentName: string
    completedAt: string
    timeSpent: number
  }[]
  categoryBreakdown: Record<string, number>
  difficultyDistribution: Record<string, number>
}

export default function EnhancedQuestCreator() {
  const [activeTab, setActiveTab] = useState<'overview' | 'quests' | 'badges' | 'templates' | 'analytics'>('overview')
  const [quests, setQuests] = useState<Quest[]>([])
  const [badges, setBadges] = useState<QuestBadge[]>([])
  const [templates, setTemplates] = useState<QuestTemplate[]>([])
  const [analytics, setAnalytics] = useState<QuestAnalytics | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Quest | QuestBadge | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created' | 'popularity' | 'completion'>('created')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic' as Quest['category'],
    difficulty: 'easy' as Quest['difficulty'],
    xpReward: 10,
    gemReward: 5,
    requirements: [''],
    isActive: true,
    tags: [] as string[],
    prerequisites: [] as string[],
    autoAssign: false,
    targetStudents: [] as string[],
    repeatType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    points: {
      creativity: 0,
      collaboration: 0,
      critical_thinking: 0,
      communication: 0
    }
  })

  const [badgeFormData, setBadgeFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    color: '#3B82F6',
    criteria: [''],
    rarity: 'common' as 'common' | 'rare' | 'epic' | 'legendary',
    category: 'achievement' as 'achievement' | 'participation' | 'milestone',
    points: 10,
    prerequisites: [] as string[],
    isStackable: false,
    maxStack: 1,
    validUntil: '',
    autoAward: false,
    triggerConditions: {},
    isActive: true
  })

  useEffect(() => {
    fetchQuests()
    const fetchBadges = async () => {
      try {
        const response = await fetch('/api/teacher/badges')
        if (response.ok) {
          const data = await response.json()
          setBadges(data.badges || [])
        } else {
          console.error('Failed to fetch badges')
          setBadges([])
        }
      } catch (error) {
        console.error('Error fetching badges:', error)
        setBadges([])
      }
    }
    fetchBadges()
    fetchTemplates()
    fetchAnalytics()
  }, [])

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/teacher/quests')
      if (response.ok) {
        const data = await response.json()
        setQuests(data.quests || [])
      }
    } catch (error) {
      console.error('Error fetching quests:', error)
    }
  }

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/teacher/badges')
      if (response.ok) {
        const data = await response.json()
        setBadges(data.badges || [])
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/teacher/quest-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/teacher/quest-analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <BookOpen className="h-4 w-4" />
      case 'behavior': return <Users className="h-4 w-4" />
      case 'social': return <Users className="h-4 w-4" />
      case 'creative': return <Star className="h-4 w-4" />
      case 'wellness': return <Heart className="h-4 w-4" />
      case 'leadership': return <Crown className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const toggleQuestStatus = async (questId: string, isActive: boolean) => {
    try {
      // Update local state immediately for better UX
      setQuests(prevQuests => 
        prevQuests.map(quest => 
          quest.id === questId ? { ...quest, isActive } : quest
        )
      )
      
      // TODO: Make API call to update quest status
      const response = await fetch(`/api/teacher/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      
      if (!response.ok) {
        // Revert on failure
        setQuests(prevQuests => 
          prevQuests.map(quest => 
            quest.id === questId ? { ...quest, isActive: !isActive } : quest
          )
        )
      }
    } catch (error) {
      console.error('Error toggling quest status:', error)
      // Revert on error
      setQuests(prevQuests => 
        prevQuests.map(quest => 
          quest.id === questId ? { ...quest, isActive: !isActive } : quest
        )
      )
    }
  }

  const editQuest = (quest: Quest) => {
    setEditingItem(quest)
    setFormData({
      ...quest,
      requirements: quest.requirements || [''],
      tags: quest.tags || [],
      prerequisites: quest.prerequisites || [],
      targetStudents: quest.targetStudents || [],
      repeatType: (quest.repeatType || 'none') as 'none' | 'daily' | 'weekly' | 'monthly',
      points: quest.points || {
        creativity: 0,
        collaboration: 0,
        critical_thinking: 0,
        communication: 0
      }
    })
    setShowCreateModal(true)
  }

  const duplicateQuest = (quest: Quest) => {
    const duplicatedQuest: Quest = {
      ...quest,
      id: `quest_${Date.now()}`, // Temporary ID
      title: `${quest.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedBy: [],
      totalAttempts: 0,
      successRate: 0,
      averageCompletionTime: 0,
      isActive: false // Start as inactive
    }
    
    setQuests(prevQuests => [...prevQuests, duplicatedQuest])
    
    // TODO: Make API call to create duplicated quest
    // For now, just add to local state
  }

  const deleteQuest = async (questId: string) => {
    if (!confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
      return
    }
    
    try {
      // Remove from local state immediately
      setQuests(prevQuests => prevQuests.filter(quest => quest.id !== questId))
      
      // TODO: Make API call to delete quest
      const response = await fetch(`/api/teacher/quests/${questId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        // TODO: Revert deletion on failure
        await fetchQuests() // Refetch to restore state
      }
    } catch (error) {
      console.error('Error deleting quest:', error)
      await fetchQuests() // Refetch to restore state
    }
  }

  const saveQuest = async () => {
    try {
      const questData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        xpReward: formData.xpReward,
        gemReward: formData.gemReward,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        isActive: formData.isActive,
        tags: formData.tags,
        prerequisites: formData.prerequisites,
        autoAssign: formData.autoAssign,
        targetStudents: formData.targetStudents,
        repeatType: formData.repeatType,
        points: formData.points
      }

      const url = editingItem ? `/api/teacher/quests/${editingItem.id}` : '/api/teacher/quests'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData)
      })

      if (response.ok) {
        const data = await response.json()
        const savedQuest = data.quest

        if (editingItem) {
          // Update existing quest
          setQuests(prevQuests => 
            prevQuests.map(quest => 
              quest.id === editingItem.id ? savedQuest : quest
            )
          )
        } else {
          // Add new quest
          setQuests(prevQuests => [...prevQuests, savedQuest])
        }

        setShowCreateModal(false)
        setEditingItem(null)
        resetFormData()
      } else {
        console.error('Failed to save quest')
      }
    } catch (error) {
      console.error('Error saving quest:', error)
    }
  }

  const saveBadge = async () => {
    try {
      const badgeData = {
        name: badgeFormData.name,
        description: badgeFormData.description,
        icon: badgeFormData.icon,
        color: badgeFormData.color,
        criteria: badgeFormData.criteria.filter(c => c.trim() !== ''),
        rarity: badgeFormData.rarity,
        category: badgeFormData.category,
        points: badgeFormData.points,
        prerequisites: badgeFormData.prerequisites,
        isStackable: badgeFormData.isStackable,
        maxStack: badgeFormData.maxStack,
        validUntil: badgeFormData.validUntil || null,
        autoAward: badgeFormData.autoAward,
        triggerConditions: badgeFormData.triggerConditions,
        isActive: badgeFormData.isActive
      }

      const url = editingItem ? `/api/teacher/badges/${editingItem.id}` : '/api/teacher/badges'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badgeData)
      })

      if (response.ok) {
        const data = await response.json()
        const savedBadge = data.badge

        if (editingItem) {
          // Update existing badge
          setBadges(prevBadges => 
            prevBadges.map(badge => 
              badge.id === editingItem.id ? savedBadge : badge
            )
          )
        } else {
          // Add new badge
          setBadges(prevBadges => [...prevBadges, savedBadge])
        }

        setShowCreateModal(false)
        setEditingItem(null)
        resetBadgeFormData()
      } else {
        console.error('Failed to save badge')
      }
    } catch (error) {
      console.error('Error saving badge:', error)
    }
  }

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      category: 'academic',
      difficulty: 'easy',
      xpReward: 10,
      gemReward: 5,
      requirements: [''],
      isActive: true,
      tags: [],
      prerequisites: [],
      autoAssign: false,
      targetStudents: [],
      repeatType: 'none',
      points: {
        creativity: 0,
        collaboration: 0,
        critical_thinking: 0,
        communication: 0
      }
    })
  }

  const resetBadgeFormData = () => {
    setBadgeFormData({
      name: '',
      description: '',
      icon: '🏆',
      color: '#3B82F6',
      criteria: [''],
      rarity: 'common',
      category: 'achievement',
      points: 10,
      prerequisites: [],
      isStackable: false,
      maxStack: 1,
      validUntil: '',
      autoAward: false,
      triggerConditions: {},
      isActive: true
    })
  }

  const addRequirement = () => {
    const requirements = Array.isArray(formData.requirements) ? formData.requirements : ['']
    setFormData({ ...formData, requirements: [...requirements, ''] })
  }

  const updateRequirement = (index: number, value: string) => {
    const requirements = Array.isArray(formData.requirements) ? formData.requirements : ['']
    const updated = [...requirements]
    updated[index] = value
    setFormData({ ...formData, requirements: updated })
  }

  const removeRequirement = (index: number) => {
    const requirements = Array.isArray(formData.requirements) ? formData.requirements : ['']
    if (requirements.length > 1) {
      const updated = requirements.filter((_, i) => i !== index)
      setFormData({ ...formData, requirements: updated })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Quest & Badge Creator</h2>
            <p className="text-slate-600">Create engaging quests and custom badges for your students</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Quests ({quests.length})</span>
            <span className="sm:hidden">Q ({quests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
            <Award className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Badges ({badges.length})</span>
            <span className="sm:hidden">B ({badges.length})</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
            <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Templates</span>
            <span className="sm:hidden">Temp</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {quests.filter(q => q.isActive).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{badges.length}</div>
                <p className="text-xs text-muted-foreground">
                  {badges.filter(b => b.isActive).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Average across all quests
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Student Engagement</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.averageEngagement || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Active participation rate
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quest Completions</CardTitle>
                <CardDescription>Latest student achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentCompletions?.slice(0, 5).map((completion, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{completion.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed quest in {Math.round(completion.timeSpent / 60)} minutes
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(completion.completedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No recent completions</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Quests</CardTitle>
                <CardDescription>Most popular and successful quests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topPerformingQuests?.slice(0, 5).map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{quest.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {quest.successRate}% success rate
                        </p>
                      </div>
                      <Badge className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No quest data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quests" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
              <Input
                placeholder="Search quests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <div className="flex gap-2 sm:gap-4">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={() => {
                setEditingItem(null)
                setFormData({
                  title: '',
                  description: '',
                  category: 'academic',
                  difficulty: 'easy',
                  xpReward: 10,
                  gemReward: 5,
                  requirements: [''],
                  isActive: true,
                  tags: [],
                  prerequisites: [],
                  autoAssign: false,
                  targetStudents: [],
                  repeatType: 'none',
                  points: {
                    creativity: 0,
                    collaboration: 0,
                    critical_thinking: 0,
                    communication: 0
                  }
                })
                setShowCreateModal(true)
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">New Quest</span>
              <span className="hidden sm:inline">Create Quest</span>
            </Button>
          </div>

          {quests.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Quests Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first quest to start engaging your students with gamified learning
              </p>
              <Button onClick={() => {
                setEditingItem(null)
                setFormData({
                  title: '',
                  description: '',
                  category: 'academic',
                  difficulty: 'easy',
                  xpReward: 10,
                  gemReward: 5,
                  requirements: [''],
                  isActive: true,
                  tags: [],
                  prerequisites: [],
                  autoAssign: false,
                  targetStudents: [],
                  repeatType: 'none',
                  points: {
                    creativity: 0,
                    collaboration: 0,
                    critical_thinking: 0,
                    communication: 0
                  }
                })
                setShowCreateModal(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quest
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quests
                .filter(quest => {
                  const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      quest.description.toLowerCase().includes(searchTerm.toLowerCase())
                  const matchesCategory = filterCategory === 'all' || quest.category === filterCategory
                  const matchesDifficulty = filterDifficulty === 'all' || quest.difficulty === filterDifficulty
                  return matchesSearch && matchesCategory && matchesDifficulty
                })
                .map((quest) => (
                <Card key={quest.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{quest.title}</CardTitle>
                        <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
                          <Badge 
                            variant={quest.difficulty === 'easy' ? 'secondary' : 
                                   quest.difficulty === 'medium' ? 'default' : 
                                   quest.difficulty === 'hard' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {quest.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{quest.category}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Switch
                          checked={quest.isActive}
                          onCheckedChange={(checked) => toggleQuestStatus(quest.id, checked)}
                          className="scale-75 sm:scale-100"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => editQuest(quest)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateQuest(quest)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteQuest(quest.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{quest.description}</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                          {quest.xpReward} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Gem className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          {quest.gemReward} Gems
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {quest.completedBy?.length || 0} completed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
              <Input
                placeholder="Search badges..."
                className="w-full sm:w-64"
              />
              <Select>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">New Badge</span>
              <span className="hidden sm:inline">Create Badge</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {badges.map((badge) => (
              <Card key={badge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{badge.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-2">{badge.rarity}</Badge>
                    </div>
                    <div className="text-2xl">{badge.icon}</div>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">{badge.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    <span>Points: {badge.points}</span>
                    <span>Earned: {badge.earnedBy?.length || 0}</span>
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quest Templates</h3>
            <p className="text-muted-foreground mb-6">
              Pre-built quest collections to get you started quickly
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quest Analytics</h3>
            <p className="text-muted-foreground mb-6">
              Detailed insights into quest performance and student engagement
            </p>
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Full Analytics
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quest Creation/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingItem ? 'Edit Quest' : 'Create New Quest'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingItem(null)
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quest Title *</label>
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter an engaging quest title..."
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what students need to accomplish..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Category and Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select 
                    value={formData.category || 'academic'} 
                    onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">📚 Academic</SelectItem>
                      <SelectItem value="behavior">🎯 Behavior</SelectItem>
                      <SelectItem value="social">👥 Social</SelectItem>
                      <SelectItem value="creative">🎨 Creative</SelectItem>
                      <SelectItem value="wellness">💚 Wellness</SelectItem>
                      <SelectItem value="leadership">👑 Leadership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select 
                    value={formData.difficulty || 'easy'} 
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🟢 Easy</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="hard">🟠 Hard</SelectItem>
                      <SelectItem value="expert">🔴 Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">XP Reward</label>
                  <Input
                    type="number"
                    value={formData.xpReward || 10}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="1000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Gem Reward</label>
                  <Input
                    type="number"
                    value={formData.gemReward || 5}
                    onChange={(e) => setFormData({ ...formData, gemReward: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium mb-2">Requirements</label>
                <div className="space-y-2">
                  {(formData.requirements || ['']).map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder={`Requirement ${index + 1}...`}
                        className="flex-1"
                      />
                      {(formData.requirements?.length || 0) > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRequirement}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Advanced Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Active Quest</label>
                      <p className="text-xs text-muted-foreground">Students can see and attempt this quest</p>
                    </div>
                    <Switch
                      checked={formData.isActive || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Auto-Assign</label>
                      <p className="text-xs text-muted-foreground">Automatically assign to all students</p>
                    </div>
                    <Switch
                      checked={formData.autoAssign || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoAssign: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingItem(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={saveQuest}
                disabled={!formData.title || !formData.description}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingItem ? 'Update Quest' : 'Create Quest'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
