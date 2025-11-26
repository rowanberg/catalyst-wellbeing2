'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  ChevronRight, ChevronLeft, Calendar, Clock,
  Heart, BookOpen, X, ChevronDown, MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MoodEntry {
  id: string
  mood: string
  mood_emoji: string
  mood_score: number
  recorded_date: string
  recorded_time: string
  created_at: string
  notes?: string | null
}

interface MoodHistoryTrackerProps {
  className?: string
  userId?: string
  limit?: number
}

export function MoodHistoryTracker({ className, limit = 10 }: MoodHistoryTrackerProps) {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [daysFilter, setDaysFilter] = useState(30)
  const [hasMore, setHasMore] = useState(true)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  const fetchMoodHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/student/mood-history?page=${page}&pageSize=${limit}&days=${daysFilter}`)

      if (!response.ok) {
        throw new Error('Failed to fetch mood history')
      }

      const data = await response.json()

      setMoodHistory(prev => {
        if (page === 1) {
          return data.moodHistory
        }

        // Filter out duplicates when loading more pages
        const existingIds = new Set(prev.map(entry => entry.id))
        const newEntries = data.moodHistory.filter((entry: MoodEntry) => !existingIds.has(entry.id))
        return [...prev, ...newEntries]
      })

      setHasMore(data.moodHistory.length === limit)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      console.error('Error fetching mood history:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, daysFilter])

  useEffect(() => {
    fetchMoodHistory()
  }, [fetchMoodHistory])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  const handleFilterChange = (days: number) => {
    if (days !== daysFilter) {
      setDaysFilter(days)
      setPage(1) // Reset to first page when changing filter
    }
  }

  const getMoodColor = (mood: string) => {
    const colors: Record<string, { bg: string, text: string, border: string }> = {
      happy: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      excited: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      calm: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      sad: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
      angry: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      anxious: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
    }

    return colors[mood] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  }

  return (
    <Card className={`border-gray-200 shadow-sm overflow-hidden ${className || ''}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Heart className="h-5 w-5 text-rose-500" />
            Mood History
          </CardTitle>

          <div className="flex space-x-1">
            {[7, 30, 90].map(days => (
              <Button
                key={days}
                variant={daysFilter === days ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(days)}
                className="text-xs h-7 px-2"
              >
                {days} days
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-3">
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={fetchMoodHistory}
              className="ml-2 p-0 h-auto text-red-700"
            >
              Try again
            </Button>
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          {loading && page === 1 ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : moodHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 bg-slate-100 rounded-full mb-3">
                <BookOpen className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No mood data yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Start logging your daily moods to see your history here
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {moodHistory.map((entry, index) => {
                const { bg, text, border } = getMoodColor(entry.mood)
                const isExpanded = expandedEntry === entry.id

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className={`flex items-center gap-3 p-3 cursor-pointer ${bg} hover:bg-opacity-70 transition-all`}
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl border shadow-sm">
                        {entry.mood_emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium capitalize ${text}`}>
                          {entry.mood}
                          {entry.mood_score && (
                            <span className="ml-1 text-sm font-normal">
                              ({entry.mood_score}/10)
                            </span>
                          )}
                        </h4>

                        <div className="flex gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(entry.recorded_date), 'MMM d, yyyy')}
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.recorded_time ?
                              format(parseISO(`2021-01-01T${entry.recorded_time}`), 'h:mm a') :
                              format(parseISO(entry.created_at), 'h:mm a')
                            }
                          </div>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
                          <MessageSquare className="h-3 w-3" />
                        </div>
                      )}

                      <div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && entry.notes && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 py-3 bg-white border-t"
                        >
                          <p className="text-sm text-slate-600">{entry.notes}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {hasMore && !loading && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
