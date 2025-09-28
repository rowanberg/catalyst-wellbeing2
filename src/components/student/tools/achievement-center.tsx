'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download
} from 'lucide-react'

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
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalXP: 0,
    totalGems: 0,
    rank: 0,
    streak: 0
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
      case 'common': return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      case 'rare': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'epic': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'legendary': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category)
    switch (cat?.color) {
      case 'blue': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'green': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'pink': return 'bg-pink-500/20 text-pink-300 border-pink-400/30'
      case 'purple': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'yellow': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'red': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
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

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'All' || achievement.category === selectedCategory
  )

  const renderAchievements = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="h-5 w-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{stats.unlockedAchievements}/{stats.totalAchievements}</p>
              <p className="text-white/60 text-xs">Achievements</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{stats.totalXP.toLocaleString()}</p>
              <p className="text-white/60 text-xs">Total XP</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Gift className="h-5 w-5 text-green-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{stats.totalGems}</p>
              <p className="text-white/60 text-xs">Gems</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">#{stats.rank}</p>
              <p className="text-white/60 text-xs">School Rank</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{category.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white/40 animate-pulse" />
          </div>
          <p className="text-white/60">Loading achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            className={`p-6 rounded-2xl border backdrop-blur-sm transition-all ${
              achievement.isUnlocked 
                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/20' 
                : 'bg-white/10 border-white/20 hover:bg-white/15'
            }`}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl text-2xl ${
                  achievement.isUnlocked ? 'bg-yellow-500/20' : 'bg-white/10'
                }`}>
                  {achievement.isUnlocked ? achievement.icon : '🔒'}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-sm ${
                    achievement.isUnlocked ? 'text-white/90' : 'text-white/60'
                  }`}>
                    {achievement.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`text-xs px-2 py-1 ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </Badge>
                    <Badge className={`text-xs px-2 py-1 ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                {getTypeIcon(achievement.type)}
                {achievement.isNew && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs">
                    New!
                  </Badge>
                )}
              </div>
            </div>

            <p className={`text-sm mb-4 ${
              achievement.isUnlocked ? 'text-white/70' : 'text-white/50'
            }`}>
              {achievement.description}
            </p>

            {!achievement.isUnlocked && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-xs">Progress</span>
                  <span className="text-white/60 text-xs">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <Progress 
                  value={(achievement.progress / achievement.maxProgress) * 100} 
                  className="h-2"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Rewards:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-blue-400" />
                    <span className="text-white/70">{achievement.rewards.xp}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Gift className="h-3 w-3 text-green-400" />
                    <span className="text-white/70">{achievement.rewards.gems}</span>
                  </div>
                </div>
              </div>
              
              {achievement.rewards.title && (
                <div className="text-xs text-white/60">
                  Title: <span className="text-yellow-300">{achievement.rewards.title}</span>
                </div>
              )}

              {achievement.isUnlocked && achievement.unlockedDate && (
                <div className="flex items-center space-x-1 text-xs text-white/60">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  <span>Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white/40" />
          </div>
          <p className="text-white/80 text-lg font-medium mb-2">No achievements found</p>
          <p className="text-white/60 text-sm">Try selecting a different category</p>
        </div>
      )}
    </div>
  )

  const renderMilestones = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {milestones.map((milestone) => (
          <motion.div
            key={milestone.id}
            className={`p-6 rounded-2xl border backdrop-blur-sm ${
              milestone.isCompleted 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/20' 
                : 'bg-white/10 border-white/20'
            }`}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl text-2xl ${
                  milestone.isCompleted ? 'bg-green-500/20' : 'bg-white/10'
                }`}>
                  {milestone.icon}
                </div>
                <div>
                  <h3 className="text-white/90 font-bold text-lg">{milestone.title}</h3>
                  <p className="text-white/60 text-sm">{milestone.description}</p>
                </div>
              </div>
              
              {milestone.isCompleted && (
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Progress</span>
                <span className="text-white/80 font-medium">
                  {milestone.currentValue.toLocaleString()}/{milestone.targetValue.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={(milestone.currentValue / milestone.targetValue) * 100} 
                className="h-3"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Rewards:</span>
              <div className="flex items-center space-x-3">
                {milestone.rewards.xp > 0 && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <span className="text-white/70">{milestone.rewards.xp}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Gift className="h-4 w-4 text-green-400" />
                  <span className="text-white/70">{milestone.rewards.gems}</span>
                </div>
                {milestone.rewards.achievement && (
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4 text-yellow-400" />
                    <span className="text-white/70 text-xs">{milestone.rewards.achievement}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
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
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-400/30">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Achievement Center</h1>
                  <p className="text-white/60 text-sm">Unlock badges & rewards</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <Share2 className="h-5 w-5" />
              </Button>
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
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'milestones', label: 'Milestones', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
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
            {currentView === 'achievements' && renderAchievements()}
            {currentView === 'milestones' && renderMilestones()}
            {currentView === 'leaderboard' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-yellow-300" />
                </div>
                <p className="text-white/80 text-lg font-bold mb-2">School Leaderboard</p>
                <p className="text-white/60 text-sm">Compare your achievements with classmates</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
