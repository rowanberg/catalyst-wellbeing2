'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Smile, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'

const gratitudeEntrySchema = z.object({
  content: z.string().min(5, 'Please write at least 5 characters about what you\'re grateful for'),
})

type GratitudeEntryForm = z.infer<typeof gratitudeEntrySchema>

interface GratitudeEntry {
  id: string
  content: string
  created_at: string
}

export default function GratitudeJournalPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GratitudeEntryForm>({
    resolver: zodResolver(gratitudeEntrySchema),
  })

  useEffect(() => {
    fetchEntries()
  }, [user])

  const fetchEntries = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setEntries(data)
    }
  }

  const onSubmit = async (data: GratitudeEntryForm) => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('gratitude_entries')
        .insert({
          user_id: user.id,
          content: data.content,
        })

      if (!error) {
        dispatch(updateXP(15))
        dispatch(updateGems(3))
        
        reset()
        setShowForm(false)
        fetchEntries()
      }
    } catch (error) {
      console.error('Error saving gratitude entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const gratitudePrompts = [
    "Something that made me smile today...",
    "A person I'm thankful for...",
    "A place that brings me peace...",
    "Something I learned recently...",
    "A memory that makes me happy...",
    "Something about my body I appreciate...",
    "A skill or talent I have...",
    "Something in nature I find beautiful...",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gratitude Journal</h1>
              <p className="text-gray-600">Focus on the positive and cultivate thankfulness</p>
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
        {/* Add Entry Button */}
        {!showForm && (
          <div className="mb-8">
            <Button onClick={() => setShowForm(true)} size="lg" className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600">
              <Plus className="h-5 w-5 mr-2" />
              Add Gratitude Entry
            </Button>
          </div>
        )}

        {/* Entry Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smile className="h-5 w-5 mr-2 text-yellow-600" />
                What are you grateful for today?
              </CardTitle>
              <CardDescription>
                Take a moment to reflect on the positive things in your life
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">I'm grateful for...</Label>
                  <textarea
                    id="content"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Today I'm grateful for..."
                    {...register('content')}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-600">
                    {isLoading ? 'Saving...' : 'Save Entry (+15 XP, +3 Gems)'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Gratitude Prompts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Need Inspiration?</CardTitle>
            <CardDescription>Try one of these gratitude prompts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gratitudePrompts.map((prompt, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                  onClick={() => {
                    setShowForm(true)
                    // You could pre-fill the form with the prompt here
                  }}
                >
                  <span className="text-sm text-gray-700">{prompt}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Gratitude Journey</h2>
          
          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No entries yet</h3>
                <p className="text-gray-500 mb-4">
                  Start your gratitude practice by writing your first entry!
                </p>
                <Button onClick={() => setShowForm(true)} className="bg-yellow-500 hover:bg-yellow-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Write Your First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Smile className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 leading-relaxed">{entry.content}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                Benefits of Gratitude Practice
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-yellow-700">
                <div>
                  <div className="font-medium mb-1">Better Sleep</div>
                  <div>Gratitude helps calm your mind before bed</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Improved Mood</div>
                  <div>Focusing on positives boosts happiness</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Stronger Relationships</div>
                  <div>Appreciating others deepens connections</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
