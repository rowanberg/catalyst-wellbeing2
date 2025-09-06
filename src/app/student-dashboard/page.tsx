'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { 
  BookOpen, 
  Target, 
  Heart, 
  Award, 
  Users, 
  Calendar,
  TrendingUp,
  Star,
  Gem,
  Trophy,
  Activity,
  MessageCircle,
  Zap,
  Flame,
  Shield,
  Crown,
  Sparkles,
  Gift,
  Timer,
  CheckCircle2
} from 'lucide-react'

export default function StudentDashboard() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const profileWithDefaults = profile || { xp: 280, level: 3, gems: 45, streak: 7 }
  const [streakCount, setStreakCount] = useState(7)
  const [dailyProgress, setDailyProgress] = useState(65)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (user.role !== 'student') {
      router.push('/login')
      return
    }

    if (!profile) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, router, dispatch])

  // Gamification effects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile?.level && profile.level > 1) {
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 3000)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [profile?.level])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-3xl shadow-2xl text-center animate-bounce">
            <Crown className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">LEVEL UP!</h2>
            <p className="text-white/90">You reached Level {profile.level}!</p>
            <Sparkles className="w-8 h-8 text-white mx-auto mt-4 animate-pulse" />
          </div>
        </div>
      )}

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Student Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome back, {profile.first_name}! 🌟</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Streak Counter */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-xl px-4 py-2 shadow-sm">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-bold text-orange-700">{streakCount} Day Streak!</span>
              </div>
              {/* Gems with Animation */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 rounded-xl px-4 py-2 shadow-sm hover:scale-105 transition-transform">
                <Gem className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="text-sm font-bold text-emerald-700">{profileWithDefaults.gems} Gems</span>
              </div>
              {/* Level with Crown */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-xl px-4 py-2 shadow-sm">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-bold text-yellow-700">Level {profileWithDefaults.level}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gamified Progress Bar */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Daily Progress</h2>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">{dailyProgress}% Complete</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 ease-out relative"
                  style={{width: `${dailyProgress}%`}}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
              <div className="absolute right-0 top-0 transform translate-x-2 -translate-y-1">
                <Zap className="w-6 h-6 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">XP Points</p>
                <p className="text-3xl font-bold text-blue-900">{profile.xp}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-600 font-medium">+25 today</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl border border-yellow-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Current Level</p>
                <p className="text-3xl font-bold text-yellow-900">{profile.level}</p>
                <div className="flex items-center mt-1">
                  <Crown className="w-3 h-3 text-yellow-500 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Champion</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                <Trophy className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Gems Earned</p>
                <p className="text-3xl font-bold text-emerald-900">{profile.gems}</p>
                <div className="flex items-center mt-1">
                  <Sparkles className="w-3 h-3 text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-600 font-medium">Shining!</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Gem className="w-6 h-6 text-white animate-spin" style={{animationDuration: '3s'}} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Achievements</p>
                <p className="text-3xl font-bold text-purple-900">12</p>
                <div className="flex items-center mt-1">
                  <Award className="w-3 h-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600 font-medium">Unlocked</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gamified Well-being Activities */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Heart className="w-6 h-6 text-red-500 mr-3 animate-pulse" />
                Today's Quests
                <div className="ml-auto flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">+50 XP Available</span>
                </div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative overflow-hidden bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl border border-pink-200 p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="absolute top-2 right-2">
                    <div className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">+25 XP</div>
                  </div>
                  <div className="flex items-center mb-3">
                    <Heart className="w-6 h-6 text-pink-600 mr-2" />
                    <h3 className="font-bold text-slate-900">Gratitude Quest</h3>
                  </div>
                  <p className="text-sm text-slate-700 mb-4">Write about something you're grateful for today and earn gems!</p>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:from-pink-600 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Start Quest</span>
                    </div>
                  </button>
                </div>
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200 p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="absolute top-2 right-2">
                    <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">+25 XP</div>
                  </div>
                  <div className="flex items-center mb-3">
                    <Shield className="w-6 h-6 text-emerald-600 mr-2" />
                    <h3 className="font-bold text-slate-900">Courage Challenge</h3>
                  </div>
                  <p className="text-sm text-slate-700 mb-4">Share something brave you did today and unlock achievements!</p>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Trophy className="w-4 h-4" />
                      <span>Accept Challenge</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Gamified Goals & Progress */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                  <Target className="w-6 h-6 text-blue-500 mr-3" />
                  Personal Quests
                </h2>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-blue-700">2/4 Complete</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="relative p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-900 flex items-center">
                      <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                      Read 20 minutes daily
                    </h3>
                    <span className="text-sm font-bold text-blue-700">75%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 relative" style={{width: '75%'}}>
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="absolute -right-1 -top-1">
                      <Star className="w-4 h-4 text-yellow-500 animate-spin" style={{animationDuration: '2s'}} />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600 font-medium">5 more minutes to complete!</div>
                </div>
                <div className="relative p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-900 flex items-center">
                      <Heart className="w-4 h-4 text-emerald-600 mr-2 animate-pulse" />
                      Practice mindfulness
                    </h3>
                    <span className="text-sm font-bold text-emerald-700">60%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-emerald-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-1000 relative" style={{width: '60%'}}>
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 font-medium">+10 gems on completion!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Gamified Quick Actions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2 animate-pulse" />
                Power-Ups
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200 transition-all duration-200 hover:scale-105 hover:shadow-lg group">
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-slate-900">Daily Habits</span>
                    <p className="text-xs text-slate-600">+15 XP per habit</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-blue-500 group-hover:animate-spin" />
                </button>
                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-xl border border-emerald-200 transition-all duration-200 hover:scale-105 hover:shadow-lg group">
                  <div className="p-2 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-slate-900">Ask for Help</span>
                    <p className="text-xs text-slate-600">Connect with support</p>
                  </div>
                  <Heart className="w-4 h-4 text-emerald-500 group-hover:animate-pulse" />
                </button>
                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border border-purple-200 transition-all duration-200 hover:scale-105 hover:shadow-lg group">
                  <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-slate-900">Peer Network</span>
                    <p className="text-xs text-slate-600">+5 gems per connection</p>
                  </div>
                  <Star className="w-4 h-4 text-purple-500 group-hover:animate-bounce" />
                </button>
              </div>
            </div>

            {/* Achievement Showcase */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2 animate-pulse" />
                Achievement Gallery
              </h2>
              <div className="space-y-4">
                <div className="relative overflow-hidden bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">First Week Warrior</p>
                      <p className="text-xs text-slate-600">Completed your first week</p>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-4 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-2 right-2">
                    <Crown className="w-4 h-4 text-blue-500 animate-bounce" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Gratitude Master</p>
                      <p className="text-xs text-slate-600">5 gratitude entries</p>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-2 right-2">
                    <Flame className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Courage Champion</p>
                      <p className="text-xs text-slate-600">3 brave moments shared</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 text-purple-500 mr-2" />
                Class Leaderboard
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">You!</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-700">{profileWithDefaults.xp} XP</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">2</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Alex M.</span>
                  </div>
                  <span className="text-sm text-slate-600">245 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">3</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Emma K.</span>
                  </div>
                  <span className="text-sm text-slate-600">230 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
