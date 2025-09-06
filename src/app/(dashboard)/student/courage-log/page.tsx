'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Shield, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'

const courageEntrySchema = z.object({
  content: z.string().min(10, 'Please write at least 10 characters about your brave moment'),
})

type CourageEntryForm = z.infer<typeof courageEntrySchema>

interface CourageEntry {
  id: string
  content: string
  created_at: string
}

export default function CourageLogPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [entries, setEntries] = useState<CourageEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourageEntryForm>({
    resolver: zodResolver(courageEntrySchema),
  })

  useEffect(() => {
    fetchEntries()
  }, [user])

  const fetchEntries = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('courage_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEntries(data)
    }
  }

  const onSubmit = async (data: CourageEntryForm) => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('courage_log')
        .insert({
          user_id: user.id,
          content: data.content,
        })

      if (!error) {
        // Award XP and gems
        dispatch(updateXP(15))
        dispatch(updateGems(3))
        
        // Reset form and refresh entries
        reset()
        setShowForm(false)
        fetchEntries()
      }
    } catch (error) {
      console.error('Error saving courage entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Courage Log</h1>
              <p className="text-gray-600">Record your brave moments and build confidence</p>
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
            <Button onClick={() => setShowForm(true)} size="lg" className="w-full md:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Add Courage Entry
            </Button>
          </div>
        )}

        {/* Entry Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Share Your Brave Moment
              </CardTitle>
              <CardDescription>
                What did you do today that took courage? It could be big or small!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Your Courage Story</Label>
                  <textarea
                    id="content"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Today I was brave when I..."
                    {...register('content')}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading}>
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

        {/* Entries List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Courage Journey</h2>
          
          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No entries yet</h3>
                <p className="text-gray-500 mb-4">
                  Start building your courage by recording your first brave moment!
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Shield className="h-4 w-4 text-green-600" />
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

        {/* Encouragement Section */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Remember: Courage isn't about being fearless
              </h3>
              <p className="text-green-700">
                It's about doing what's right even when you feel scared. Every small act of bravery counts!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
