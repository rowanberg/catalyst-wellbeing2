'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Heart, Plus, Minus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface KindnessData {
  count: number
  last_updated: string
}

export default function KindnessCounterPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [kindnessCount, setKindnessCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchKindnessData()
  }, [user])

  const fetchKindnessData = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('kindness_counter')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setKindnessCount(data.count)
      
      // Check if last update was today
      const today = new Date().toDateString()
      const lastUpdate = new Date(data.last_updated).toDateString()
      
      if (today === lastUpdate) {
        // Calculate today's count (this is simplified - in real app you'd track daily entries)
        setTodayCount(Math.min(data.count, 5)) // Assume max 5 per day for demo
      }
    }
  }

  const updateKindnessCount = async (increment: boolean) => {
    if (!user) return

    setIsLoading(true)
    try {
      const newCount = increment ? kindnessCount + 1 : Math.max(0, kindnessCount - 1)
      const newTodayCount = increment ? todayCount + 1 : Math.max(0, todayCount - 1)

      const { error } = await supabase
        .from('kindness_counter')
        .upsert({
          user_id: user.id,
          count: newCount,
          last_updated: new Date().toISOString(),
        })

      if (!error) {
        setKindnessCount(newCount)
        setTodayCount(newTodayCount)
        
        if (increment) {
          // Award XP and gems for kindness
          dispatch(updateXP(10))
          dispatch(updateGems(2))
        }
      }
    } catch (error) {
      console.error('Error updating kindness count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const kindnessIdeas = [
    "Helped a classmate with homework",
    "Said something nice to someone",
    "Picked up litter",
    "Shared your lunch",
    "Listened to a friend who was sad",
    "Held the door open for someone",
    "Complimented someone's work",
    "Helped carry something heavy",
    "Said 'please' and 'thank you'",
    "Smiled at someone new"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kindness Counter</h1>
              <p className="text-gray-600">Track your acts of kindness and spread positivity</p>
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
        {/* Counter Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Heart className="h-6 w-6 mr-2 text-pink-500" />
                Total Kindness Acts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold text-pink-600 mb-4">{kindnessCount}</div>
              <p className="text-gray-600">Acts of kindness performed</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Today's Kindness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold text-rose-600 mb-4">{todayCount}</div>
              <p className="text-gray-600">Kind acts today</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Log Your Kindness</CardTitle>
            <CardDescription>
              Did you do something kind? Add it to your counter!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => updateKindnessCount(true)}
                disabled={isLoading}
                size="lg"
                className="bg-pink-500 hover:bg-pink-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Kindness (+10 XP, +2 Gems)
              </Button>
              <Button 
                onClick={() => updateKindnessCount(false)}
                disabled={isLoading || kindnessCount === 0}
                size="lg"
                variant="outline"
              >
                <Minus className="h-5 w-5 mr-2" />
                Remove One
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kindness Ideas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Kindness Ideas</CardTitle>
            <CardDescription>
              Need inspiration? Here are some ways to be kind today:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kindnessIdeas.map((idea, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                  <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{idea}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Milestones */}
        <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
          <CardHeader>
            <CardTitle className="text-pink-800">Kindness Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[10, 25, 50, 100].map((milestone) => (
                <div key={milestone} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    kindnessCount >= milestone 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium">{milestone}</div>
                  <div className="text-xs text-gray-600">
                    {kindnessCount >= milestone ? 'Achieved!' : 'Goal'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Encouragement */}
        <Card className="mt-8 bg-rose-50 border-rose-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-rose-800 mb-2">
                "No act of kindness, no matter how small, is ever wasted."
              </h3>
              <p className="text-rose-700">
                - Aesop
              </p>
              <p className="text-rose-600 mt-4">
                Every kind act creates a ripple effect of positivity. Keep spreading kindness!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
