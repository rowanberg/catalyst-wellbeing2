'use client'

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Clock, Target, Star, ChevronRight, TrendingUp, 
  BookOpen, BarChart3, Trophy, Sparkles, CheckCircle2, Circle,
  AlertCircle, ArrowRight, Bell, Zap, Award, Sun, Moon, Cloud
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStudentRank } from '@/hooks/useStudentRank'
import { detectDevicePerformance, getAnimationConfig } from '@/lib/utils/devicePerformance'

interface TodayTabProps {
  data: any
  loading: boolean
  error: string | null
  onRefresh: () => void
  profile: any
}

export function TodayTab({ data, loading, error, onRefresh, profile }: TodayTabProps) {
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [timeContext, setTimeContext] = useState('')
  const [questsExpanded, setQuestsExpanded] = useState(true)
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(true)
  
  // Detect device performance and adjust animations
  const devicePerf = useMemo(() => detectDevicePerformance(), [])
  const animConfig = useMemo(() => getAnimationConfig(devicePerf.mode), [devicePerf.mode])
  
  // Fetch student rank data
  const { rankData, loading: rankLoading } = useStudentRank(profile?.id)

  // Fetch upcoming assessments
  useEffect(() => {
    const fetchUpcomingAssessments = async () => {
      if (!profile?.id) return
      
      try {
        setAssessmentsLoading(true)
        const response = await fetch('/api/student/upcoming-assessments')
        if (response.ok) {
          const data = await response.json()
          console.log('📅 Upcoming assessments received:', {
            count: data.count,
            assessments: data.assessments
          })
          setUpcomingAssessments(data.assessments || [])
        } else {
          console.error('❌ Failed to fetch assessments:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching upcoming assessments:', error)
      } finally {
        setAssessmentsLoading(false)
      }
    }

    fetchUpcomingAssessments()
  }, [profile?.id])

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Dynamic greeting based on time of day - memoized with varied messages
  const { greeting: memoizedGreeting, timeContext: memoizedTimeContext, timeOfDay } = useMemo(() => {
    const hour = new Date().getHours()
    const name = profile?.first_name || 'Student'
    const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
    
    const midnightGreetings = [
      { greeting: `Midnight Scholar, ${name}! 🌌`, context: 'Burning the midnight oil? You\'re dedicated!' },
      { greeting: `Night Warrior, ${name}! ✨`, context: 'Late night hustle = morning success!' },
      { greeting: `Hello Night Owl, ${name}! 🦉`, context: 'The stars are cheering you on!' },
      { greeting: `Hey ${name}! 🌠`, context: 'Making magic happen at midnight!' }
    ]
    
    const morningGreetings = [
      { greeting: `Rise & Shine, ${name}! ☀️`, context: 'Time to make today amazing!' },
      { greeting: `Good Morning, ${name}! 🌅`, context: 'Let\'s start with some awesome learning!' },
      { greeting: `Wakey Wakey, ${name}! 🌞`, context: 'Today is full of new adventures!' },
      { greeting: `Hello Sunshine, ${name}! ✨`, context: 'Ready to shine bright today?' }
    ]
    
    const afternoonGreetings = [
      { greeting: `Hey ${name}! 🌤️`, context: 'Keep that energy flowing!' },
      { greeting: `Great Afternoon, ${name}! ⚡`, context: 'You\'re doing amazing!' },
      { greeting: `Still Rocking, ${name}! 🎯`, context: 'Keep crushing those goals!' },
      { greeting: `Hello ${name}! 🚀`, context: 'Halfway there, keep going!' }
    ]
    
    const eveningGreetings = [
      { greeting: `Good Evening, ${name}! 🌙`, context: 'Let\'s finish strong together!' },
      { greeting: `Hey Night Owl, ${name}! ⭐`, context: 'Almost there, you got this!' },
      { greeting: `Evening Star, ${name}! 🌟`, context: 'End the day on a high note!' },
      { greeting: `Hello ${name}! 🌠`, context: 'You\'re amazing, keep it up!' }
    ]
    
    let greetingSet, timeOfDay
    // Midnight: 11 PM - 5 AM
    if (hour >= 23 || hour < 5) {
      greetingSet = midnightGreetings
      timeOfDay = 'midnight'
    } else if (hour < 12) {
      greetingSet = morningGreetings
      timeOfDay = 'morning'
    } else if (hour < 17) {
      greetingSet = afternoonGreetings
      timeOfDay = 'afternoon'
    } else {
      greetingSet = eveningGreetings
      timeOfDay = 'evening'
    }
    
    const selected = greetingSet[dayIndex % greetingSet.length]
    
    return {
      greeting: selected.greeting,
      timeContext: selected.context,
      timeOfDay
    }
  }, [profile])

  // Prepare data (before conditional returns)
  const todayData = data || {
    quests: { completed: 0, total: 6, items: [] },
    upcomingExams: [],
    weeklyProgress: { xp: 0, rank: 0, streak: 0 },
    schoolUpdates: { polls: [], announcements: [] }
  }

  // Calculate quest progress - memoized
  const questProgress = useMemo(() => 
    todayData.quests.total > 0 
      ? (todayData.quests.completed / todayData.quests.total) * 100 
      : 0,
    [todayData.quests.completed, todayData.quests.total]
  )

  // Memoized handlers
  const handleQuestClick = useCallback((type: string) => {
    router.push(`/student/${type}`)
  }, [router])

  const handleExamPrepClick = useCallback((id: string) => {
    router.push(`/student/exam-prep/${id}`)
  }, [router])

  // Update greeting state
  useEffect(() => {
    setGreeting(memoizedGreeting)
    setTimeContext(memoizedTimeContext)
  }, [memoizedGreeting, memoizedTimeContext])

  // NOW SAFE TO HAVE CONDITIONAL RETURNS
  if (loading && !data) {
    return <TodayTabSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <Button 
              onClick={onRefresh}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Dynamic Time-Reactive Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
        style={{ 
          background: timeOfDay === 'midnight'
            ? 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #2d1b4e 60%, #1a0a2e 100%)'
            : timeOfDay === 'morning' 
            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B6B 100%)'
            : timeOfDay === 'afternoon'
            ? 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        }}
      >
        {/* Animated Background Elements */}
        {timeOfDay === 'midnight' && (
          <>
            {/* Deep space background - static on low-end */}
            {animConfig.enableAnimations ? (
              <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-violet-900/30"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-violet-900/30" />
            )}
            
            {/* Crescent moon - simplified on medium, static on low */}
            <div className="absolute top-4 right-4">
              {devicePerf.mode === 'high' && (
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 w-20 h-20 rounded-full bg-purple-300/40 blur-3xl"
                />
              )}
              {devicePerf.mode === 'medium' && (
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-purple-300/30 blur-2xl" />
              )}
              {animConfig.enableAnimations ? (
                <motion.div
                  animate={{ rotate: devicePerf.mode === 'high' ? [0, 5, 0] : undefined }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Moon className="w-14 h-14 text-indigo-100/70" />
                </motion.div>
              ) : (
                <Moon className="w-14 h-14 text-indigo-100/70" />
              )}
            </div>
            
            {/* Magical fireflies/wisps - high only */}
            {devicePerf.mode === 'high' && animConfig.enableParticles && [...Array(8)].map((_, i) => (
              <motion.div
                key={`wisp-${i}`}
                animate={{
                  x: [0, 30, -20, 0],
                  y: [0, -40, 20, 0],
                  opacity: [0.3, 0.8, 0.5, 0.3],
                  scale: [0.8, 1.2, 0.9, 0.8]
                }}
                transition={{
                  duration: 8 + i,
                  repeat: Infinity,
                  delay: i * 1.2,
                  ease: "easeInOut"
                }}
                className="absolute"
                style={{
                  top: `${10 + i * 12}%`,
                  left: `${5 + i * 11}%`
                }}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-200 to-amber-300 blur-sm shadow-lg shadow-yellow-400/50" />
              </motion.div>
            ))}
            
            {/* Mystical stars - scaled by performance */}
            {[...Array(devicePerf.mode === 'high' ? 25 : devicePerf.mode === 'medium' ? 12 : 6)].map((_, i) => {
              const colors = ['text-purple-200', 'text-blue-200', 'text-pink-200', 'text-yellow-200', 'text-cyan-200']
              const color = colors[i % colors.length]
              const size = devicePerf.mode === 'high' ? (Math.random() > 0.6 ? 'w-4 h-4' : 'w-3 h-3') : 'w-3 h-3'
              return animConfig.enableAnimations ? (
                <motion.div
                  key={`midnight-star-${i}`}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: devicePerf.mode === 'high' ? [0.7, 1.5, 0.7] : [0.8, 1.2, 0.8],
                    rotate: devicePerf.mode === 'high' ? [0, 360] : undefined
                  }}
                  transition={{
                    duration: devicePerf.mode === 'high' ? 2.5 + Math.random() * 2 : 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "easeInOut"
                  }}
                  className="absolute"
                  style={{
                    top: `${5 + Math.random() * 85}%`,
                    left: `${5 + Math.random() * 90}%`
                  }}
                >
                  <Sparkles className={`${size} ${color}`} />
                </motion.div>
              ) : (
                <div
                  key={`midnight-star-${i}`}
                  className="absolute"
                  style={{
                    top: `${5 + i * 15}%`,
                    left: `${5 + i * 15}%`
                  }}
                >
                  <Sparkles className={`w-3 h-3 ${color}`} />
                </div>
              )
            })}
            
            {/* Shooting stars - high performance only */}
            {devicePerf.mode === 'high' && animConfig.enableParticles && [...Array(4)].map((_, i) => (
              <motion.div
                key={`midnight-shooting-${i}`}
                initial={{ opacity: 0, x: 120, y: -60 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [-80, -180],
                  y: [0, 80]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 5 + 1,
                  ease: "linear"
                }}
                className="absolute"
                style={{
                  top: `${10 + i * 18}%`,
                  right: `${85 + i * 3}%`
                }}
              >
                <div className="relative">
                  <div className="w-1 h-16 bg-gradient-to-b from-white via-purple-300 to-transparent transform rotate-45" />
                  <div className="absolute top-0 w-2 h-2 rounded-full bg-white shadow-xl shadow-purple-300/70" />
                </div>
              </motion.div>
            ))}
            
            {/* Mystical constellation - high performance only */}
            {devicePerf.mode === 'high' && (
              <svg className="absolute top-1/3 right-1/4 w-40 h-40 opacity-40" viewBox="0 0 120 120">
                {/* Mystical pattern */}
                <motion.circle
                  cx="30" cy="30" r="2"
                  fill="#a78bfa"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.circle
                  cx="60" cy="25" r="2"
                  fill="#c084fc"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
                />
                <motion.circle
                  cx="90" cy="35" r="2"
                  fill="#d8b4fe"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
                />
                <motion.circle
                  cx="60" cy="60" r="2.5"
                  fill="#e9d5ff"
                  animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, delay: 0.9, repeat: Infinity }}
                />
                <motion.line
                  x1="30" y1="30" x2="60" y2="25"
                  stroke="#a78bfa" strokeWidth="0.5" opacity="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                />
                <motion.line
                  x1="60" y1="25" x2="90" y2="35"
                  stroke="#c084fc" strokeWidth="0.5" opacity="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <motion.line
                  x1="60" y1="60" x2="30" y2="30"
                  stroke="#d8b4fe" strokeWidth="0.5" opacity="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 2 }}
                />
              </svg>
            )}
            
            {/* Northern lights effect - simplified for medium, static for low */}
            {animConfig.enableAnimations ? (
              <>
                <motion.div
                  animate={{
                    opacity: [0.15, 0.35, 0.15],
                    x: devicePerf.mode === 'high' ? [-30, 30, -30] : undefined
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-purple-500/20 via-violet-500/15 to-transparent"
                />
                {devicePerf.mode === 'high' && (
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2], x: [30, -30, 30] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                    className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-indigo-500/20 via-blue-500/15 to-transparent"
                  />
                )}
              </>
            ) : (
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-purple-500/15 via-violet-500/10 to-transparent" />
            )}
            
            {/* Magical particles - high only */}
            {devicePerf.mode === 'high' && animConfig.enableParticles && [...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-up-${i}`}
                animate={{ y: [100, -50], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, delay: i * 1.5, ease: "easeOut" }}
                className="absolute bottom-0"
                style={{ left: `${15 + i * 15}%` }}
              >
                <Sparkles className="w-2 h-2 text-purple-300/60" />
              </motion.div>
            ))}
            
            {/* Milky way effect - simplified */}
            {animConfig.enableAnimations ? (
              <motion.div
                animate={{ opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/15 via-transparent to-blue-900/15" />
            )}
            
            {/* Deep mystical overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-purple-900/20" />
          </>
        )}
        
        {timeOfDay === 'morning' && (
          <>
            {/* Sun with rays */}
            <div className="absolute top-4 right-4">
              {/* Sun glow layers */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-yellow-300/40 blur-2xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute inset-2 w-20 h-20 rounded-full bg-yellow-200/50 blur-xl"
              />
              
              {/* Rotating sun */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <Sun className="w-16 h-16 text-yellow-100/60" />
              </motion.div>
              
              {/* Sun rays */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`ray-${i}`}
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: "easeInOut"
                  }}
                  className="absolute w-1 h-8 bg-gradient-to-b from-yellow-200/40 to-transparent"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-40px)`,
                    transformOrigin: 'center center'
                  }}
                />
              ))}
            </div>
            
            {/* Morning mist effect */}
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/20 to-transparent"
            />
            
            {/* Sparkles and particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                animate={{
                  y: [-30, 30, -30],
                  x: [0, 15, 0],
                  opacity: [0.2, 0.7, 0.2],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.6
                }}
                className="absolute"
                style={{
                  top: `${15 + i * 12}%`,
                  right: `${8 + i * 10}%`
                }}
              >
                <Sparkles className="w-3 h-3 text-yellow-200/60" />
              </motion.div>
            ))}
          </>
        )}
        
        {timeOfDay === 'afternoon' && (
          <>
            {/* Bright afternoon sun */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-3 right-3"
            >
              <div className="relative">
                {/* Sun glow */}
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-yellow-400/30 blur-2xl" />
                <Sun className="w-14 h-14 text-white/50" />
              </div>
            </motion.div>
            
            {/* Gentle light rays */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`afternoon-ray-${i}`}
                animate={{
                  opacity: [0.1, 0.25, 0.1],
                  scaleY: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
                className="absolute top-0 w-16 h-full bg-gradient-to-b from-white/10 to-transparent"
                style={{
                  right: `${10 + i * 15}%`,
                  transform: `skewX(-${5 + i * 2}deg)`
                }}
              />
            ))}
            
            {/* Multiple cloud layers */}
            <motion.div
              animate={{ x: [-120, 120] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute top-6 -right-10 opacity-25"
            >
              <Cloud className="w-28 h-28 text-white" />
            </motion.div>
            <motion.div
              animate={{ x: [-80, 140] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear", delay: 3 }}
              className="absolute top-12 right-16 opacity-20"
            >
              <Cloud className="w-20 h-20 text-white" />
            </motion.div>
            <motion.div
              animate={{ x: [-60, 100] }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear", delay: 8 }}
              className="absolute top-20 right-5 opacity-15"
            >
              <Cloud className="w-16 h-16 text-white" />
            </motion.div>
            
            {/* Sky sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`afternoon-sparkle-${i}`}
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.8, 1.3, 0.8],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.8
                }}
                className="absolute"
                style={{
                  top: `${20 + i * 13}%`,
                  right: `${15 + i * 12}%`
                }}
              >
                <Sparkles className="w-2.5 h-2.5 text-white/40" />
              </motion.div>
            ))}
            
            {/* Atmospheric glow */}
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
            />
          </>
        )}
        
        {timeOfDay === 'evening' && (
          <>
            {/* Detailed Moon with glow */}
            <div className="absolute top-3 right-3">
              {/* Moon glow layers */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-blue-200/30 blur-2xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute inset-2 w-20 h-20 rounded-full bg-blue-100/40 blur-xl"
              />
              
              {/* Moon */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Moon className="w-16 h-16 text-blue-50/60" />
              </motion.div>
            </div>
            
            {/* Shooting stars */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`shooting-${i}`}
                initial={{ opacity: 0, x: 100, y: -50 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [-100, -200],
                  y: [0, 100],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 8 + 2,
                  ease: "linear"
                }}
                className="absolute"
                style={{
                  top: `${15 + i * 20}%`,
                  right: `${80 + i * 5}%`
                }}
              >
                <div className="relative">
                  <div className="w-1 h-12 bg-gradient-to-b from-white via-blue-200 to-transparent transform rotate-45" />
                  <div className="absolute top-0 w-2 h-2 rounded-full bg-white shadow-lg shadow-blue-200/50" />
                </div>
              </motion.div>
            ))}
            
            {/* Constellation pattern */}
            <svg className="absolute top-1/4 left-1/4 w-32 h-32 opacity-30" viewBox="0 0 100 100">
              {/* Connect stars to form constellation */}
              <motion.line
                x1="20" y1="20" x2="40" y2="30"
                stroke="white" strokeWidth="0.5" opacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              <motion.line
                x1="40" y1="30" x2="60" y2="25"
                stroke="white" strokeWidth="0.5" opacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
              />
              <motion.line
                x1="60" y1="25" x2="70" y2="45"
                stroke="white" strokeWidth="0.5" opacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 3 }}
              />
              
              {/* Constellation stars */}
              {[[20, 20], [40, 30], [60, 25], [70, 45]].map(([cx, cy], i) => (
                <motion.circle
                  key={i}
                  cx={cx} cy={cy} r="1.5"
                  fill="white"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </svg>
            
            {/* Twinkling stars - varied sizes */}
            {[...Array(20)].map((_, i) => {
              const size = Math.random() > 0.7 ? 'w-4 h-4' : Math.random() > 0.4 ? 'w-3 h-3' : 'w-2 h-2'
              return (
                <motion.div
                  key={`star-${i}`}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.6, 1.4, 0.6],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "easeInOut"
                  }}
                  className="absolute"
                  style={{
                    top: `${5 + Math.random() * 80}%`,
                    right: `${5 + Math.random() * 90}%`
                  }}
                >
                  <Sparkles className={`${size} text-yellow-100/70`} />
                </motion.div>
              )
            })}
            
            {/* Aurora borealis effect */}
            <motion.div
              animate={{
                opacity: [0.1, 0.3, 0.1],
                x: [-20, 20, -20]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-purple-500/10 via-blue-500/10 to-transparent"
            />
            <motion.div
              animate={{
                opacity: [0.1, 0.25, 0.1],
                x: [20, -20, 20]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-0 right-0 w-full h-1/3 bg-gradient-to-b from-teal-500/10 via-cyan-500/10 to-transparent"
            />
            
            {/* Milky way effect */}
            <motion.div
              animate={{ opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20"
            />
            
            {/* Deep night overlay */}
            <div className="absolute inset-0 bg-black/25" />
          </>
        )}
        
        {/* Content - relative to appear above animated elements */}
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{greeting}</h1>
          <p className="text-white/90 text-sm sm:text-base mb-4">{timeContext}</p>
        </div>
        
        {/* Contextual prompt */}
        {upcomingAssessments.length > 0 && upcomingAssessments[0].daysUntil <= 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/25 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/30 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {upcomingAssessments[0].subject} {upcomingAssessments[0].type} in {upcomingAssessments[0].daysUntil} {upcomingAssessments[0].daysUntil === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-white/90">Time to prepare!</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/30 hover:bg-white/40 text-white border-0"
              onClick={() => router.push('/student/examinations')}
            >
              Prepare
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Access Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card 
          className="border-0 shadow-xl rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-blue-600 cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden"
          onClick={() => router.push('/student/calendar')}
        >
          {/* Professional accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500" />
          
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform border border-blue-300/30">
                    <Calendar className="w-6 h-6 text-blue-100" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Calendar & Attendance</h3>
                    <p className="text-blue-100/80 text-sm font-medium">Track your schedule</p>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5 text-blue-100 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                  {data?.stats?.level && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200">
                      Lv {data.stats.level}
                    </span>
                  )}
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                  {todayData.weeklyProgress?.xp || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">Weekly XP</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>
                  {rankData ? `#${rankData.class_rank}` : '#0'}
                </span>
              </div>
              <p className="text-xs text-slate-600">Class Rank</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
                  {todayData.weeklyProgress?.streak || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">Day Streak</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>
                  {todayData.quests.completed}/{todayData.quests.total}
                </span>
              </div>
              <p className="text-xs text-slate-600">Quests Done</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Quests - Enhanced Mobile Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg rounded-2xl bg-white">
          <CardHeader 
            className="cursor-pointer"
            style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))' }}
            onClick={() => setQuestsExpanded(!questsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl shadow-sm" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }}>
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Daily Adventures</CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Complete to earn XP and gems
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: questsExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </motion.div>
            </div>
          </CardHeader>
          
          <AnimatePresence>
            {questsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-6">
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span className="font-medium">Daily Progress</span>
                      <span className="font-bold text-slate-800">
                        {Math.round(questProgress)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={questProgress} className="h-3" />
                      {questProgress === 100 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-1 -top-1"
                        >
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Quest Items - Mobile Optimized Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {todayData.quests.items?.map((quest: any, index: number) => (
                      <motion.button
                        key={quest.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={quest.completed ? {} : { scale: 0.98 }}
                        onClick={quest.completed ? undefined : () => handleQuestClick(quest.type)}
                        disabled={quest.completed}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left shadow-sm",
                          quest.completed 
                            ? "cursor-not-allowed opacity-75"
                            : "bg-white border-slate-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
                        )}
                        style={quest.completed ? {
                          background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-tertiary) 30%, transparent), color-mix(in srgb, var(--theme-accent) 30%, transparent))',
                          borderColor: 'var(--theme-secondary)'
                        } : {
                          borderColor: undefined
                        }}
                        onMouseEnter={(e) => !quest.completed && (e.currentTarget.style.borderColor = 'var(--theme-accent)')}
                        onMouseLeave={(e) => !quest.completed && (e.currentTarget.style.borderColor = 'rgb(226, 232, 240)')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <motion.div
                              animate={quest.completed ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className="p-2 rounded-xl mt-0.5"
                              style={{ backgroundColor: quest.completed ? 'var(--theme-highlight)' : 'rgb(241, 245, 249)' }}
                            >
                              {quest.completed ? (
                                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-400" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm" style={{ color: quest.completed ? 'var(--theme-primary)' : 'rgb(30, 41, 59)' }}>
                                {quest.title}
                              </p>
                              <p className="text-xs mt-1" style={{ color: quest.completed ? 'var(--theme-secondary)' : 'rgb(100, 116, 139)' }}>
                                {quest.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div style={quest.completed ? {
                                backgroundColor: 'var(--theme-highlight)',
                                color: 'var(--theme-primary)'
                              } : {
                                backgroundColor: 'rgb(241, 245, 249)',
                                color: 'rgb(71, 85, 105)'
                              }} className="text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center">
                              {quest.xp} XP
                            </div>
                            {quest.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs font-bold mt-1 px-2 py-1 rounded-md"
                                style={{ color: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)' }}
                              >
                                COMPLETED
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Completion Celebration */}
                  {questProgress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 rounded-2xl text-center shadow-sm"
                      style={{ background: 'linear-gradient(to right, var(--theme-highlight), var(--theme-tertiary), var(--theme-accent))' }}
                    >
                      <p className="text-lg font-bold mb-1" style={{ color: 'var(--theme-primary)' }}>
                        🎉 All Quests Complete!
                      </p>
                      <p className="text-sm" style={{ color: 'var(--theme-secondary)' }}>
                        Amazing work today, champion!
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Responsive Grid for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg h-full rounded-2xl bg-white">
            <CardHeader className="rounded-t-2xl" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 30%, transparent), color-mix(in srgb, var(--theme-tertiary) 30%, transparent))' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl shadow-sm" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-accent))' }}>
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/calendar')}
                  style={{ color: 'var(--theme-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {assessmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-xl" />
                        <div>
                          <div className="h-4 w-24 bg-slate-200 rounded mb-1" />
                          <div className="h-3 w-32 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingAssessments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssessments.slice(0, 5).map((assessment: any) => (
                    <motion.div
                      key={assessment.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 30%, transparent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--theme-tertiary)' }}
                      onClick={() => router.push('/student/examinations')}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-tertiary) 50%, transparent)' }}>
                          <Clock className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-800 truncate">
                            {assessment.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {assessment.subject} • {new Date(assessment.assessmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span 
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-md",
                            assessment.daysUntil <= 1 ? 'bg-red-600 text-white' :
                            assessment.daysUntil <= 3 ? 'bg-amber-500 text-white' :
                            'text-white'
                          )}
                          style={{ 
                            backgroundColor: assessment.daysUntil > 3 ? 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' : undefined,
                            color: assessment.daysUntil > 3 ? 'var(--theme-primary)' : undefined
                          }}
                        >
                          {assessment.daysUntil === 0 ? 'Today' : assessment.daysUntil === 1 ? 'Tomorrow' : `${assessment.daysUntil}d`}
                        </span>
                        <ChevronRight className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming assessments</p>
                  <p className="text-xs mt-1">Enjoy your free time!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* School Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="rounded-t-2xl" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-tertiary) 30%, transparent), color-mix(in srgb, var(--theme-accent) 30%, transparent))' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl shadow-sm" style={{ background: 'linear-gradient(to bottom right, var(--theme-secondary), var(--theme-accent))' }}>
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">School Updates</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/announcements')}
                  style={{ color: 'var(--theme-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-secondary)'}
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {todayData.schoolUpdates?.polls?.slice(0, 1).map((poll: any) => (
                  <motion.div
                    key={poll.id}
                    whileHover={{ x: 4 }}
                    className="p-3 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--theme-accent)' }}
                    onClick={() => router.push('/student/announcements')}
                  >
                    <div className="mb-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--theme-highlight)', color: 'var(--theme-primary)' }}>POLL</div>
                    <p className="font-medium text-sm text-slate-800">{poll.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {poll.questions?.length || 0} questions • Tap to respond
                    </p>
                  </motion.div>
                ))}
                
                {todayData.schoolUpdates?.announcements?.slice(0, 2).map((announcement: any, index: number) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 6, scale: 1.01 }}
                    className="group relative p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                    style={{ 
                      backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 40%, white)',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      borderColor: 'var(--theme-tertiary)'
                    }}
                    onClick={() => router.push('/student/announcements')}
                  >
                    {/* Gradient overlay on hover */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm" 
                          style={{ 
                            background: 'linear-gradient(135deg, var(--theme-secondary), var(--theme-primary))',
                            color: 'white'
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          ANNOUNCEMENT
                        </div>
                        {announcement.priority === 'high' && (
                          <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                            URGENT
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-[15px] text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-slate-700 transition-colors">
                        {announcement.title}
                      </h4>
                      
                      {announcement.content && (
                        <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                          {announcement.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--theme-accent)' }}></span>
                          {new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {announcement.author && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">•</span>
                            {announcement.author}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover arrow indicator */}
                    <motion.div
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <ChevronRight className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                    </motion.div>
                  </motion.div>
                ))}

                {(!todayData.schoolUpdates?.polls?.length && !todayData.schoolUpdates?.announcements?.length) && (
                  <div className="text-center py-8 text-slate-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new updates</p>
                    <p className="text-xs mt-1">Check back later!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Enhanced Skeleton loader
function TodayTabSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl p-6 animate-pulse shadow-lg">
        <div className="h-8 bg-white/20 rounded w-48 mb-2" />
        <div className="h-4 bg-white/20 rounded w-32" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-8 bg-slate-200 rounded w-16 mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
          </Card>
        ))}
      </div>
      
      {/* Content skeleton */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
        </div>
      </Card>
    </div>
  )
}
