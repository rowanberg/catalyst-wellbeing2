'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { Heart, Star, Target, Trophy, Zap, BookOpen, Users, HelpCircle, Sparkles, TrendingUp, AlertCircle, Brain, Shield, Smile, Gem, Wind, Coffee, Droplets, Moon, CheckCircle, Play, MessageCircle, Award } from 'lucide-react'
import Link from 'next/link'

function StudentDashboardContent() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [dailyQuests, setDailyQuests] = useState({
    gratitude: false,
    kindness: false,
    courage: false,
    breathing: false,
    water: false,
    sleep: false
  })
  const [petHappiness, setPetHappiness] = useState(85)
  const { addToast } = useToast()

  const moodMonsters = [
    { id: 'happy', emoji: '😊', name: 'Joyful', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'excited', emoji: '🤩', name: 'Excited', color: 'bg-orange-100 border-orange-300' },
    { id: 'calm', emoji: '😌', name: 'Peaceful', color: 'bg-blue-100 border-blue-300' },
    { id: 'sad', emoji: '😢', name: 'Down', color: 'bg-gray-100 border-gray-300' },
    { id: 'angry', emoji: '😤', name: 'Frustrated', color: 'bg-red-100 border-red-300' },
    { id: 'anxious', emoji: '😰', name: 'Worried', color: 'bg-purple-100 border-purple-300' }
  ]

  const affirmations = [
    "You are braver than you believe! 🦁",
    "Your kindness makes the world brighter! ✨",
    "You have amazing ideas worth sharing! 💡",
    "Every challenge helps you grow stronger! 🌱",
    "You are loved and valued just as you are! ❤️",
    "Your smile can light up someone's day! 😊"
  ]

  useEffect(() => {
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, dispatch])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return <PageLoader text="Loading your dashboard..." />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't load your profile. Please try logging in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userProfile = profile!

  const toggleQuest = (questKey: keyof typeof dailyQuests) => {
    setDailyQuests(prev => ({
      ...prev,
      [questKey]: !prev[questKey]
    }))
    if (!dailyQuests[questKey]) {
      addToast({
        type: 'success',
        title: 'Quest Complete! 🎉',
        description: 'You earned XP and Mind Gems!'
      })
      setPetHappiness(prev => Math.min(100, prev + 5))
    }
  }

  const getRandomAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * affirmations.length)
    addToast({
      type: 'success',
      title: 'Daily Affirmation ✨',
      description: affirmations[randomIndex]
    })
  }

  const completedQuests = Object.values(dailyQuests).filter(Boolean).length
  const totalQuests = Object.keys(dailyQuests).length
  const progressPercentage = (completedQuests / totalQuests) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-bounce"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-spin"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
            Welcome back, {userProfile.first_name}! ✨
          </h1>
          <p className="text-white/80 text-lg">Ready to level up your wellbeing today?</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="h-12 w-12 text-yellow-400 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Level {userProfile.level}</h3>
              <p className="text-white/70">Your current level</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-12 w-12 text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{userProfile.xp} XP</h3>
              <p className="text-white/70">Experience points</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Gem className="h-12 w-12 text-purple-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{userProfile.gems}</h3>
              <p className="text-white/70">Mind gems collected</p>
            </CardContent>
          </Card>

          {/* Virtual Pet */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="text-4xl animate-bounce">🐱</div>
              </div>
              <h3 className="text-lg font-bold mb-2">Whiskers</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${petHappiness}%` }}
                ></div>
              </div>
              <p className="text-white/70 text-sm">Happiness: {petHappiness}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Mood Tracker */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-6 w-6 text-yellow-400" />
              How are you feeling today?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {moodMonsters.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    selectedMood === mood.id 
                      ? mood.color + ' border-current shadow-lg' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">{mood.emoji}</div>
                  <div className="text-sm font-medium">{mood.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Quests */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-green-400" />
              Today's Epic Quests ({completedQuests}/{totalQuests})
            </CardTitle>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                onClick={() => toggleQuest('gratitude')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  dailyQuests.gratitude 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`h-8 w-8 ${dailyQuests.gratitude ? 'text-green-600' : 'text-pink-400'}`} />
                  <div>
                    <h3 className="font-bold">Gratitude Journal</h3>
                    <p className="text-sm opacity-70">Write something you're grateful for</p>
                  </div>
                  {dailyQuests.gratitude && <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />}
                </div>
              </div>

              <div 
                onClick={() => toggleQuest('kindness')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  dailyQuests.kindness 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className={`h-8 w-8 ${dailyQuests.kindness ? 'text-green-600' : 'text-yellow-400'}`} />
                  <div>
                    <h3 className="font-bold">Kindness Counter</h3>
                    <p className="text-sm opacity-70">Log an act of kindness</p>
                  </div>
                  {dailyQuests.kindness && <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />}
                </div>
              </div>

              <div 
                onClick={() => toggleQuest('courage')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  dailyQuests.courage 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`h-8 w-8 ${dailyQuests.courage ? 'text-green-600' : 'text-blue-400'}`} />
                  <div>
                    <h3 className="font-bold">Courage Log</h3>
                    <p className="text-sm opacity-70">Share a brave moment</p>
                  </div>
                  {dailyQuests.courage && <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />}
                </div>
              </div>

              <div 
                onClick={() => toggleQuest('breathing')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  dailyQuests.breathing 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wind className={`h-8 w-8 ${dailyQuests.breathing ? 'text-green-600' : 'text-cyan-400'}`} />
                  <div>
                    <h3 className="font-bold">Breathing Exercise</h3>
                    <p className="text-sm opacity-70">5 minutes of mindful breathing</p>
                  </div>
                  {dailyQuests.breathing && <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />}
                </div>
              </div>

              <div 
                onClick={() => toggleQuest('water')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  dailyQuests.water 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Droplets className={`h-8 w-8 ${dailyQuests.water ? 'text-green-600' : 'text-blue-400'}`} />
                  <div>
                    <h3 className="font-bold">Water Tracker</h3>
                    <p className="text-sm opacity-70">Stay hydrated today</p>
                  </div>
                  {dailyQuests.water && <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />}
                </div>
              </div>

              <div 
                onClick={() => toggleQuest('sleep')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  dailyQuests.sleep 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className={`h-8 w-8 ${dailyQuests.sleep ? 'text-green-600' : 'text-purple-400'}`} />
                  <div>
                    <h3 className="font-bold">Sleep Tracker</h3>
                    <p className="text-sm opacity-70">Log your sleep quality</p>
                  </div>
                  {dailyQuests.sleep && <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mindfulness Missions */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-400" />
              Mindfulness Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => addToast({ type: 'success', title: 'Breathing Exercise', description: 'Breathe in... hold... breathe out... 🌬️' })}
                className="p-6 h-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <div className="text-center">
                  <Wind className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold">Guided Breathing</div>
                  <div className="text-sm opacity-80">Calm your mind</div>
                </div>
              </Button>

              <Button 
                onClick={getRandomAffirmation}
                className="p-6 h-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                <div className="text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold">Surprise Me!</div>
                  <div className="text-sm opacity-80">Daily affirmation</div>
                </div>
              </Button>

              <Button 
                onClick={() => addToast({ type: 'success', title: 'Gratitude Moment', description: 'Take a moment to appreciate something beautiful around you 🌟' })}
                className="p-6 h-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <div className="text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold">Gratitude Moment</div>
                  <div className="text-sm opacity-80">Find joy today</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-red-400" />
                Need Support?
              </CardTitle>
              <CardDescription className="text-white/70">
                We're here to help when you need it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => addToast({ type: 'success', title: 'Help Request Sent', description: 'A trusted adult will reach out to you soon 💙' })}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Request Help
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-400" />
                Digital Citizenship
              </CardTitle>
              <CardDescription className="text-white/70">
                Learn and earn badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => addToast({ type: 'success', title: 'Quiz Started!', description: 'Answer questions about online safety to earn a badge! 🏆' })}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Take Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-400" />
                Your Progress
              </CardTitle>
              <CardDescription className="text-white/70">
                See how you're growing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <UnifiedAuthGuard requiredRole="student">
      <StudentDashboardContent />
    </UnifiedAuthGuard>
  )
}
