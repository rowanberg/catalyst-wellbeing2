'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Moon, Droplets, Trophy, Flame, Target, Sparkles, Zap, Star, ArrowUpRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { AchievementBadge, type Achievement } from '@/components/student/habits/AchievementBadge'
import { HabitCard } from '@/components/student/habits/HabitCard'
import { WeeklyProgress } from '@/components/student/habits/WeeklyProgress'

interface HabitData {
  date: string
  sleep_hours: number
  water_glasses: number
}

const HABITS = {
  sleep: {
    value: 0,
    max: 12,
    goal: 8,
    unit: 'hours',
    icon: Moon,
    color: 'from-violet-500 to-purple-600',
    label: 'Sleep Duration',
  },
  water: {
    value: 0,
    max: 12,
    goal: 8,
    unit: 'glasses',
    icon: Droplets,
    color: 'from-blue-500 to-cyan-500',
    label: 'Daily Hydration',
  },
}

export default function HabitsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [todayHabits, setTodayHabits] = useState<HabitData>({
    date: new Date().toISOString().split('T')[0],
    sleep_hours: 0,
    water_glasses: 0,
  })
  const [weeklyData, setWeeklyData] = useState<HabitData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchHabits()
    }
  }, [user])

  const fetchHabits = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/habits')
      if (response.ok) {
        const data = await response.json()
        setTodayHabits(data.todayHabits)
        setWeeklyData(data.weeklyData)
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
    }
  }

  const streak = useMemo(() => {
    let count = 0
    const sortedData = [...weeklyData].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (const day of sortedData) {
      if (day.sleep_hours >= 7 && day.water_glasses >= 6) {
        count++
      } else {
        break
      }
    }
    return count
  }, [weeklyData])

  const weeklyProgressData = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      return d
    })

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const dayData = weeklyData.find(d => d.date === dateStr)
      const isCompleted = dayData ? (dayData.sleep_hours >= 7 && dayData.water_glasses >= 6) : false

      return {
        date: dateStr,
        completed: isCompleted,
        isToday: dateStr === todayHabits.date,
        label: days[date.getDay()]
      }
    })
  }, [weeklyData, todayHabits.date])

  const achievements = useMemo<Achievement[]>(() => {
    const sleepDays = weeklyData.filter((d) => d.sleep_hours >= 8).length
    const waterDays = weeklyData.filter((d) => d.water_glasses >= 8).length

    return [
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: '5 days of 8+ hours sleep',
        icon: '🌅',
        unlocked: sleepDays >= 5,
        progress: sleepDays,
        requirement: 5,
      },
      {
        id: 'hydration-hero',
        title: 'Hydration Hero',
        description: '7 days of 8+ glasses water',
        icon: '💧',
        unlocked: waterDays >= 7,
        progress: waterDays,
        requirement: 7,
      },
      {
        id: 'consistency-king',
        title: 'Consistency Champion',
        description: '14-day perfect streak',
        icon: '👑',
        unlocked: streak >= 14,
        progress: streak,
        requirement: 14,
      },
      {
        id: 'legend',
        title: 'Wellness Legend',
        description: '30-day perfect streak',
        icon: '🏆',
        unlocked: streak >= 30,
        progress: streak,
        requirement: 30,
      },
    ]
  }, [weeklyData, streak])

  const updateHabits = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/student/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep_hours: todayHabits.sleep_hours,
          water_glasses: todayHabits.water_glasses,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        dispatch(updateXP(result.xpGained || 5))
        dispatch(updateGems(result.gemsGained || 1))

        setTimeout(() => {
          fetchHabits()
        }, 1000)
      }
    } catch (error) {
      console.error('Error updating habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHabitUpdate = (habitId: 'sleep' | 'water', value: number) => {
    if (habitId === 'sleep') {
      setTodayHabits((prev) => ({ ...prev, sleep_hours: value }))
    } else if (habitId === 'water') {
      setTodayHabits((prev) => ({ ...prev, water_glasses: value }))
    }
  }

  const isPerfectDay = todayHabits.sleep_hours >= 8 && todayHabits.water_glasses >= 8

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Professional Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Habits</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-6 mr-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{streak} Day Streak</span>
                </div>
              </div>
              <Button
                onClick={() => router.push('/student')}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Summary Cards - Horizontal Scroll on Mobile */}
        <div className="flex overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x ">
          <Card className="border-slate-200/60 shadow-sm bg-white min-w-[240px] snap-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Current Streak</p>
                <h3 className="text-2xl font-semibold text-slate-900">{streak} <span className="text-sm font-normal text-slate-400">days</span></h3>
              </div>
              <div className="p-2.5 bg-orange-50 rounded-full text-orange-500">
                <Flame className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm bg-white min-w-[240px] snap-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Weekly Goal</p>
                <h3 className="text-2xl font-semibold text-slate-900">85%</h3>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-full text-blue-500">
                <Target className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content: Habits */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Today's Goals</h2>
              <span className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>

            <div className="space-y-4">
              <HabitCard
                {...HABITS.sleep}
                value={todayHabits.sleep_hours}
                onChange={(val) => handleHabitUpdate('sleep', val)}
              />
              <HabitCard
                {...HABITS.water}
                value={todayHabits.water_glasses}
                onChange={(val) => handleHabitUpdate('water', val)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={updateHabits}
                disabled={isLoading}
                className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm px-6"
              >
                {isLoading ? 'Saving...' : 'Save Progress'}
              </Button>
            </div>

            {/* Perfect Day Bonus - Subtle */}
            {isPerfectDay && (
              <div className="mt-4 bg-amber-50/50 border border-amber-100/60 rounded-lg p-4 flex items-center gap-3">
                <div className="p-1.5 bg-white rounded-md shadow-sm text-amber-500">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Perfect Day!</p>
                  <p className="text-xs text-slate-500">You've met all your goals today.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Progress & Achievements */}
          <div className="space-y-6 sm:space-y-8">
            <WeeklyProgress data={weeklyProgressData} streak={streak} />

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Achievements</h2>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 p-0 h-auto font-medium">
                  View All <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-2">
                <div className="divide-y divide-slate-50">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="p-3 hover:bg-slate-50 transition-colors rounded-lg">
                      <AchievementBadge achievement={achievement} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
