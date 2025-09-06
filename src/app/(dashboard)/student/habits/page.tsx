'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Moon, Droplets, Calendar, TrendingUp } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'

interface HabitData {
  date: string
  sleep_hours: number
  water_glasses: number
}

export default function HabitsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [todayHabits, setTodayHabits] = useState<HabitData>({
    date: new Date().toISOString().split('T')[0],
    sleep_hours: 0,
    water_glasses: 0
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

    const today = new Date().toISOString().split('T')[0]
    
    // Fetch today's habits
    const { data: todayData } = await supabase
      .from('habit_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (todayData) {
      setTodayHabits({
        date: todayData.date,
        sleep_hours: todayData.sleep_hours || 0,
        water_glasses: todayData.water_glasses || 0
      })
    }

    // Fetch last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: weekData } = await supabase
      .from('habit_tracker')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (weekData) {
      setWeeklyData(weekData)
    }
  }

  const updateHabits = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('habit_tracker')
        .upsert({
          user_id: user.id,
          date: todayHabits.date,
          sleep_hours: todayHabits.sleep_hours,
          water_glasses: todayHabits.water_glasses,
        })

      if (!error) {
        dispatch(updateXP(5))
        dispatch(updateGems(1))
        fetchHabits()
      }
    } catch (error) {
      console.error('Error updating habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreakDays = () => {
    let streak = 0
    const sortedData = [...weeklyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (const day of sortedData) {
      if (day.sleep_hours >= 7 && day.water_glasses >= 6) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
              <p className="text-gray-600">Build healthy habits for better well-being</p>
            </div>
            <Button onClick={() => router.push('/student')} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Habits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Today's Habits
            </CardTitle>
            <CardDescription>Track your sleep and water intake for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="sleep">Hours of Sleep</Label>
                <div className="flex items-center space-x-3">
                  <Moon className="h-5 w-5 text-purple-600" />
                  <Input
                    id="sleep"
                    type="number"
                    min="0"
                    max="24"
                    value={todayHabits.sleep_hours}
                    onChange={(e) => setTodayHabits(prev => ({
                      ...prev,
                      sleep_hours: parseInt(e.target.value) || 0
                    }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">hours</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 8-10 hours for teens</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="water">Glasses of Water</Label>
                <div className="flex items-center space-x-3">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <Input
                    id="water"
                    type="number"
                    min="0"
                    max="20"
                    value={todayHabits.water_glasses}
                    onChange={(e) => setTodayHabits(prev => ({
                      ...prev,
                      water_glasses: parseInt(e.target.value) || 0
                    }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">glasses</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 6-8 glasses per day</p>
              </div>
            </div>

            <Button 
              onClick={updateHabits} 
              disabled={isLoading}
              className="w-full mt-6"
            >
              {isLoading ? 'Saving...' : 'Save Today\'s Habits (+5 XP, +1 Gem)'}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{getStreakDays()} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Moon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Sleep</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weeklyData.length > 0 
                      ? Math.round(weeklyData.reduce((sum, day) => sum + (day.sleep_hours || 0), 0) / weeklyData.length * 10) / 10
                      : 0}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Droplets className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Water</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weeklyData.length > 0 
                      ? Math.round(weeklyData.reduce((sum, day) => sum + (day.water_glasses || 0), 0) / weeklyData.length * 10) / 10
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly History */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly History</CardTitle>
            <CardDescription>Your habit tracking over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No habit data yet. Start tracking today!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyData.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{day.sleep_hours || 0}h</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{day.water_glasses || 0} glasses</span>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-green-500" 
                           style={{
                             backgroundColor: (day.sleep_hours >= 7 && day.water_glasses >= 6) 
                               ? '#10b981' : '#ef4444'
                           }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-8 bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">Healthy Habit Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
              <div>
                <h4 className="font-medium mb-2">Better Sleep:</h4>
                <ul className="space-y-1">
                  <li>• Keep a consistent bedtime</li>
                  <li>• Avoid screens 1 hour before bed</li>
                  <li>• Create a relaxing bedtime routine</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Stay Hydrated:</h4>
                <ul className="space-y-1">
                  <li>• Drink water when you wake up</li>
                  <li>• Carry a water bottle</li>
                  <li>• Set reminders throughout the day</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
