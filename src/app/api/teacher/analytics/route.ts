/**
 * Teacher Analytics API - Comprehensive class insights
 * Returns wellbeing, engagement, and performance data for teacher's assigned classes
 */
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const schoolId = searchParams.get('school_id')
    const classId = searchParams.get('class_id') // Optional: filter by specific class

    if (!teacherId || !schoolId) {
      return ApiResponse.badRequest('Teacher ID and School ID are required')
    }

    const supabase = getSupabaseAdmin()

    // Get teacher's assigned classes
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (!assignments || assignments.length === 0) {
      return ApiResponse.success({
        message: 'No assigned classes found',
        data: getEmptyAnalytics()
      })
    }

    const classIds = assignments.map(a => a.class_id)
    const targetClassIds = classId ? [classId] : classIds

    // Get students in these classes
    const { data: studentAssignments } = await supabase
      .from('student_class_assignments')
      .select('student_id, class_id')
      .in('class_id', targetClassIds)
      .eq('is_active', true)

    if (!studentAssignments || studentAssignments.length === 0) {
      return ApiResponse.success({
        message: 'No students found in assigned classes',
        data: getEmptyAnalytics()
      })
    }

    const studentIds = Array.from(new Set(studentAssignments.map(s => s.student_id)))
    const totalStudents = studentIds.length

    // Calculate date thresholds once
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Batch queries with limits to reduce data transfer
    const [
      profiles,
      moodData,
      helpRequests,
      questCompletions,
      habitData,
      kindnessData
    ] = await Promise.all([
      // Student profiles with progress - only needed fields
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, xp, level')
        .in('user_id', studentIds),

      // Recent mood data (last 7 days) - limited fields
      supabase
        .from('mood_tracking')
        .select('user_id, mood, energy, stress, date')
        .in('user_id', studentIds)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false }),

      // Help requests (last 30 days) - only pending/urgent
      supabase
        .from('help_requests')
        .select('student_id, urgency, status')
        .in('student_id', studentIds)
        .gte('created_at', thirtyDaysAgo),

      // Quest completions (last 7 days)
      supabase
        .from('daily_quests')
        .select('user_id, completed, date')
        .in('user_id', studentIds)
        .gte('date', sevenDaysAgo),

      // Habit data (last 7 days)
      supabase
        .from('habit_tracker')
        .select('user_id, water_glasses, sleep_hours, date')
        .in('user_id', studentIds)
        .gte('date', sevenDaysAgo),

      // Kindness acts
      supabase
        .from('kindness_counter')
        .select('user_id, weekly_acts')
        .in('user_id', studentIds)
    ])

    // Process analytics
    const analytics = processAnalytics({
      totalStudents,
      profiles: profiles.data || [],
      moodData: moodData.data || [],
      helpRequests: helpRequests.data || [],
      questCompletions: questCompletions.data || [],
      habitData: habitData.data || [],
      kindnessData: kindnessData.data || []
    })

    return ApiResponse.success({
      ...analytics,
      metadata: {
        totalClasses: targetClassIds.length,
        totalStudents,
        dataRange: '7 days',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    logger.error('Teacher analytics API error', error)
    return ApiResponse.internalError('Failed to fetch analytics')
  }
}

function processAnalytics(data: any) {
  const { totalStudents, profiles, moodData, helpRequests, questCompletions, habitData, kindnessData } = data

  // Calculate averages
  const avgXP = profiles.length > 0 
    ? Math.round(profiles.reduce((sum: number, p: any) => sum + (p.xp || 0), 0) / profiles.length)
    : 0

  const avgLevel = profiles.length > 0
    ? Math.round(profiles.reduce((sum: number, p: any) => sum + (p.level || 1), 0) / profiles.length)
    : 1

  // Mood distribution
  const moodDistribution: any = {
    happy: 0,
    excited: 0,
    calm: 0,
    sad: 0,
    angry: 0,
    anxious: 0
  }
  moodData.forEach((m: any) => {
    if (moodDistribution[m.mood] !== undefined) {
      moodDistribution[m.mood]++
    }
  })

  // Average energy and stress
  const avgEnergy = moodData.length > 0
    ? Math.round(moodData.reduce((sum: number, m: any) => sum + (m.energy || 50), 0) / moodData.length)
    : 50

  const avgStress = moodData.length > 0
    ? Math.round(moodData.reduce((sum: number, m: any) => sum + (m.stress || 30), 0) / moodData.length)
    : 30

  // Students who logged mood today
  const today = new Date().toISOString().split('T')[0]
  const activeToday = new Set(moodData.filter((m: any) => m.date === today).map((m: any) => m.user_id)).size

  // Help requests analysis
  const pendingHelp = helpRequests.filter((h: any) => h.status === 'pending').length
  const urgentHelp = helpRequests.filter((h: any) => h.urgency === 'high' && h.status === 'pending').length

  // Quest completion rate (last 7 days)
  const totalQuests = questCompletions.length
  const completedQuests = questCompletions.filter((q: any) => q.completed).length
  const questCompletionRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

  // Habit tracker insights
  const avgWater = habitData.length > 0
    ? Math.round(habitData.reduce((sum: number, h: any) => sum + (h.water_glasses || 0), 0) / habitData.length)
    : 0

  const avgSleep = habitData.length > 0
    ? (habitData.reduce((sum: number, h: any) => sum + (parseFloat(h.sleep_hours) || 0), 0) / habitData.length).toFixed(1)
    : '0.0'

  // Kindness acts - only use weekly data
  const weeklyKindness = kindnessData.reduce((sum: number, k: any) => sum + (k.weekly_acts || 0), 0)

  // Students needing support (low mood, high stress, or help request)
  const studentsNeedingSupport = new Set([
    ...moodData.filter((m: any) => m.mood === 'sad' || m.mood === 'angry' || m.mood === 'anxious' || m.stress > 70).map((m: any) => m.user_id),
    ...helpRequests.filter((h: any) => h.status === 'pending').map((h: any) => h.student_id)
  ])
  const studentsNeedingSupportCount = studentsNeedingSupport.size

  // Top performers
  const topPerformers = profiles
    .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5)
    .map((p: any) => ({
      id: p.user_id,
      name: `${p.first_name} ${p.last_name}`,
      xp: p.xp || 0,
      level: p.level || 1
    }))

  // Wellbeing trend (last 7 days)
  const wellbeingTrend = calculateWellbeingTrend(moodData)

  return {
    overview: {
      totalStudents,
      activeToday,
      avgXP,
      avgLevel,
      engagementRate: Math.round((activeToday / totalStudents) * 100)
    },
    wellbeing: {
      moodDistribution,
      avgEnergy,
      avgStress,
      studentsNeedingSupport: studentsNeedingSupportCount,
      pendingHelpRequests: pendingHelp,
      urgentHelpRequests: urgentHelp,
      trend: wellbeingTrend
    },
    engagement: {
      questCompletionRate,
      totalQuestsCompleted: completedQuests,
      avgWaterIntake: avgWater,
      avgSleepHours: parseFloat(avgSleep),
      weeklyKindnessActs: weeklyKindness
    },
    topPerformers,
    insights: generateInsights({
      totalStudents,
      activeToday,
      studentsNeedingSupport,
      urgentHelp,
      questCompletionRate,
      avgStress
    })
  }
}

function calculateWellbeingTrend(moodData: any[]) {
  // Group by date and calculate average wellbeing score
  const dateMap = new Map<string, { energy: number[], stress: number[], count: number }>()
  
  moodData.forEach((m: any) => {
    if (!dateMap.has(m.date)) {
      dateMap.set(m.date, { energy: [], stress: [], count: 0 })
    }
    const day = dateMap.get(m.date)!
    day.energy.push(m.energy || 50)
    day.stress.push(m.stress || 30)
    day.count++
  })

  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      avgEnergy: Math.round(data.energy.reduce((a, b) => a + b, 0) / data.energy.length),
      avgStress: Math.round(data.stress.reduce((a, b) => a + b, 0) / data.stress.length),
      checkIns: data.count
    }))
}

function generateInsights(data: any): Array<{
  type: 'alert' | 'warning' | 'info' | 'success'
  priority: 'high' | 'medium' | 'low'
  message: string
  action: string | null
}> {
  const insights: Array<{
    type: 'alert' | 'warning' | 'info' | 'success'
    priority: 'high' | 'medium' | 'low'
    message: string
    action: string | null
  }> = []

  if (data.urgentHelp > 0) {
    insights.push({
      type: 'alert',
      priority: 'high',
      message: `${data.urgentHelp} student(s) need urgent support`,
      action: 'Review help requests'
    })
  }

  if (data.studentsNeedingSupport > data.totalStudents * 0.2) {
    insights.push({
      type: 'warning',
      priority: 'medium',
      message: `${Math.round((data.studentsNeedingSupport / data.totalStudents) * 100)}% of students may need support`,
      action: 'Check wellbeing dashboard'
    })
  }

  if (data.activeToday < data.totalStudents * 0.5) {
    insights.push({
      type: 'info',
      priority: 'low',
      message: `Low engagement today (${Math.round((data.activeToday / data.totalStudents) * 100)}%)`,
      action: 'Send encouraging message'
    })
  }

  if (data.questCompletionRate >= 80) {
    insights.push({
      type: 'success',
      priority: 'low',
      message: `Excellent quest completion rate (${data.questCompletionRate}%)`,
      action: null
    })
  }

  return insights
}

function getEmptyAnalytics() {
  return {
    overview: {
      totalStudents: 0,
      activeToday: 0,
      avgXP: 0,
      avgLevel: 1,
      engagementRate: 0
    },
    wellbeing: {
      moodDistribution: { happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0 },
      avgEnergy: 50,
      avgStress: 30,
      studentsNeedingSupport: 0,
      pendingHelpRequests: 0,
      urgentHelpRequests: 0,
      trend: []
    },
    engagement: {
      questCompletionRate: 0,
      totalQuestsCompleted: 0,
      avgWaterIntake: 0,
      avgSleepHours: 0,
      weeklyKindnessActs: 0
    },
    topPerformers: [],
    insights: []
  }
}
