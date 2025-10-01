'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Trophy, 
  ArrowLeft, 
  Star, 
  Award, 
  Crown, 
  Medal, 
  Target,
  Zap,
  Heart,
  Brain,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Gift,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  Settings,
  Share2,
  Download,
  Filter,
  Search,
  ChevronDown,
  Flame,
  Gem,
  Shield,
  Palette
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Achievement {
  id: string
  title: string
  description: string
  category: 'academic' | 'social' | 'wellness' | 'creativity' | 'leadership' | 'special'
  type: 'badge' | 'trophy' | 'medal' | 'certificate'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: string
  color: string
  isUnlocked: boolean
  unlockedDate?: string
  progress: number
  maxProgress: number
  requirements: string[]
  rewards: {
    xp: number
    gems: number
    title?: string
  }
  isNew: boolean
}

interface Milestone {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  category: string
  icon: string
  color: string
  rewards: {
    xp: number
    gems: number
    achievement?: string
  }
  isCompleted: boolean
}

export function AchievementCenter({ onBack }: { onBack: () => void }) {
  const { profile } = useAppSelector((state) => state.auth)
  const [currentView, setCurrentView] = useState<'achievements' | 'milestones' | 'leaderboard'>('achievements')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalXP: 0,
    totalGems: 0,
    rank: 0,
    streak: 0,
    currentXP: 0,
    currentGems: 0,
    currentLevel: 1
  })

  const categories = [
    { id: 'All', label: 'All', icon: Star, color: 'gray' },
    { id: 'academic', label: 'Academic', icon: BookOpen, color: 'blue' },
    { id: 'social', label: 'Social', icon: Users, color: 'green' },
    { id: 'wellness', label: 'Wellness', icon: Heart, color: 'pink' },
    { id: 'creativity', label: 'Creative', icon: Sparkles, color: 'purple' },
    { id: 'leadership', label: 'Leadership', icon: Crown, color: 'yellow' },
    { id: 'special', label: 'Special', icon: Gift, color: 'red' }
  ]

  // Fetch achievements from API
  const fetchAchievements = useCallback(async () => {
    if (!profile?.school_id) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory)
      }
      
      const response = await fetch(`/api/achievements?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements || [])
        setStats(data.stats || stats)
      } else {
        toast.error('Failed to load achievements')
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
      toast.error('Failed to load achievements')
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, selectedCategory])

  // Fetch milestones from API
  const fetchMilestones = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const response = await fetch('/api/achievements/milestones')
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchAchievements()
    fetchMilestones()
  }, [fetchAchievements, fetchMilestones])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category)
    switch (cat?.color) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'green': return 'bg-green-100 text-green-700 border-green-300'
      case 'pink': return 'bg-pink-100 text-pink-700 border-pink-300'
      case 'purple': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'red': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'badge': return <Award className="h-5 w-5" />
      case 'trophy': return <Trophy className="h-5 w-5" />
      case 'medal': return <Medal className="h-5 w-5" />
      case 'certificate': return <Star className="h-5 w-5" />
      default: return <Award className="h-5 w-5" />
    }
  }

  // Memoize filtered achievements for performance
  const filteredAchievements = useMemo(() => {
    return achievements.filter(achievement => {
      const matchesCategory = selectedCategory === 'All' || achievement.category === selectedCategory
      const matchesSearch = searchQuery === '' || 
        achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [achievements, selectedCategory, searchQuery])

  const renderAchievements = () => (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <motion.div
          className="p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/90 backdrop-blur-xl border border-amber-200 shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm flex-shrink-0">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-900 font-bold text-xs sm:text-sm lg:text-lg truncate">{stats.unlockedAchievements}/{stats.totalAchievements}</p>
              <p className="text-gray-600 text-[10px] sm:text-xs">Achievements</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-200 shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-900 font-bold text-xs sm:text-sm lg:text-lg truncate">{stats.totalXP.toLocaleString()}</p>
              <p className="text-gray-600 text-[10px] sm:text-xs">Total XP</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/90 backdrop-blur-xl border border-emerald-200 shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-sm flex-shrink-0">
              <Gem className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-900 font-bold text-xs sm:text-sm lg:text-lg truncate">{stats.totalGems}</p>
              <p className="text-gray-600 text-[10px] sm:text-xs">Gems</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/90 backdrop-blur-xl border border-purple-200 shadow-lg lg:col-span-1 col-span-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-sm flex-shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-900 font-bold text-xs sm:text-sm lg:text-lg truncate">#{stats.rank || 'N/A'}</p>
              <p className="text-gray-600 text-[10px] sm:text-xs">School Rank</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200/50 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          <Input
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border-gray-200 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                size="sm"
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs lg:text-sm font-medium transition-all flex items-center space-x-1 sm:space-x-1.5 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.slice(0, 3)}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-lg border border-gray-200/50"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-700 font-medium text-sm sm:text-base">Loading achievements...</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Getting your progress ready</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5) }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-xl ${
              achievement.isUnlocked 
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' 
                : 'bg-white/90 backdrop-blur-xl border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl text-base sm:text-xl lg:text-2xl shadow-sm flex-shrink-0 ${
                  achievement.isUnlocked 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                    : 'bg-gray-200'
                }`}>
                  <span className="block">
                    {achievement.isUnlocked ? achievement.icon : '🔒'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-xs sm:text-sm lg:text-base truncate ${
                    achievement.isUnlocked ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {achievement.title}
                  </h3>
                  <div className="flex items-center space-x-1 sm:space-x-1.5 mt-1 flex-wrap gap-1">
                    <Badge className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-medium ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </Badge>
                    <Badge className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-medium ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                <div className="text-gray-600">
                  {getTypeIcon(achievement.type)}
                </div>
                {achievement.isNew && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] sm:text-xs font-medium px-1.5 py-0.5">
                    New!
                  </Badge>
                )}
              </div>
            </div>

            <p className={`text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed line-clamp-2 ${
              achievement.isUnlocked ? 'text-gray-700' : 'text-gray-500'
            }`}>
              {achievement.description}
            </p>

            {!achievement.isUnlocked && (
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-gray-600 text-[10px] sm:text-xs font-medium">Progress</span>
                  <span className="text-gray-700 text-[10px] sm:text-xs font-bold">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-2 sm:h-2.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                  />
                </div>
                <div className="flex justify-center mt-1">
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    {Math.round((achievement.progress / achievement.maxProgress) * 100)}% complete
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs sm:text-sm font-medium">Rewards:</span>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="flex items-center space-x-0.5 sm:space-x-1 bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                    <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                    <span className="text-blue-700 font-medium text-[10px] sm:text-xs">{achievement.rewards.xp}</span>
                  </div>
                  <div className="flex items-center space-x-0.5 sm:space-x-1 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                    <Gem className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                    <span className="text-green-700 font-medium text-[10px] sm:text-xs">{achievement.rewards.gems}</span>
                  </div>
                </div>
              </div>
              
              {achievement.rewards.title && (
                <div className="bg-yellow-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg">
                  <span className="text-yellow-800 text-[10px] sm:text-xs font-medium">
                    🏆 Title: <span className="font-bold">{achievement.rewards.title}</span>
                  </span>
                </div>
              )}

              {achievement.isUnlocked && achievement.unlockedDate && (
                <div className="flex items-center space-x-1.5 sm:space-x-2 bg-green-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-green-700 text-[10px] sm:text-xs font-medium">
                    Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredAchievements.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center shadow-xl border border-gray-200/50"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
          >
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </motion.div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            No Achievements Found
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base max-w-md mx-auto">
            {searchQuery ? 'Try adjusting your search terms' : 'Try selecting a different category or complete more activities'}
          </p>
        </motion.div>
      )}
    </div>
  )

  const renderMilestones = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
              milestone.isCompleted 
                ? 'border-green-300 bg-green-50/50' 
                : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl text-2xl backdrop-blur-sm ${
                  milestone.isCompleted ? 'bg-green-500/20 border border-green-400/30' : 'bg-gray-100/80'
                }`}>
                  {milestone.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-bold text-base sm:text-lg truncate">{milestone.title}</h3>
                  <p className="text-gray-600 text-sm">{milestone.description}</p>
                </div>
              </div>
              
              {milestone.isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </motion.div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Progress</span>
                <span className="text-gray-900 font-bold text-sm">
                  {milestone.currentValue.toLocaleString()}/{milestone.targetValue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((milestone.currentValue / milestone.targetValue) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-3 rounded-full ${
                    milestone.isCompleted 
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                />
              </div>
              <div className="flex justify-center mt-1">
                <span className="text-xs text-gray-500 font-medium">
                  {Math.round((milestone.currentValue / milestone.targetValue) * 100)}% complete
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Rewards:</span>
              <div className="flex items-center space-x-3">
                {milestone.rewards.xp > 0 && (
                  <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-lg">
                    <Zap className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700 font-medium text-xs">{milestone.rewards.xp}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-lg">
                  <Gem className="h-3 w-3 text-green-600" />
                  <span className="text-green-700 font-medium text-xs">{milestone.rewards.gems}</span>
                </div>
                {milestone.rewards.achievement && (
                  <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-lg">
                    <Award className="h-3 w-3 text-yellow-600" />
                    <span className="text-yellow-700 font-medium text-xs truncate max-w-20">{milestone.rewards.achievement}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {milestones.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 text-center shadow-xl border border-white/20"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Target className="h-10 w-10 text-white" />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            No Milestones Yet
          </h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
            Complete more activities to unlock milestone challenges!
          </p>
        </motion.div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-indigo-500/3 to-purple-500/3"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.08) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="relative z-10 p-2 sm:p-3 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
          
          {/* Header */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-200/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">Achievement Center</h1>
                  <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Unlock badges & earn rewards</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 sm:space-x-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg border border-gray-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex space-x-1 sm:space-x-1.5 lg:space-x-2">
              {[
                { id: 'achievements', label: 'Achievements', shortLabel: 'Badges', icon: Trophy },
                { id: 'milestones', label: 'Milestones', shortLabel: 'Goals', icon: Target },
                { id: 'leaderboard', label: 'Leaderboard', shortLabel: 'Ranks', icon: Crown }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id as any)}
                    className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-2 lg:px-4 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-xs lg:text-sm transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 ${
                      currentView === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </Button>
                )
              })}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'achievements' && renderAchievements()}
            {currentView === 'milestones' && renderMilestones()}
            {currentView === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 text-center shadow-xl border border-gray-200/50"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Crown className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  School Leaderboard
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto mb-6">
                  Compare your achievements with classmates and see who's leading the way!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-700 text-sm font-medium">
                    🚀 Coming Soon: Compete with friends and climb the rankings!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
