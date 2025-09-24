import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get current week date range
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Get gratitude entries this week
    const { count: gratitudeCount, error: gratitudeError } = await supabaseAdmin
      .from('gratitude_entries')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    // Get kindness acts this week
    const { count: kindnessCount, error: kindnessError } = await supabaseAdmin
      .from('kindness_counter')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    // Get courage log entries this week
    const { count: courageCount, error: courageError } = await supabaseAdmin
      .from('courage_log')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    // Get habit tracker data for sleep and water
    const { data: habitData, error: habitError } = await supabaseAdmin
      .from('habit_tracker')
      .select('sleep_hours, water_glasses, created_at')
      .eq('school_id', schoolId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    // Calculate average sleep and water intake
    let avgSleep = 0
    let avgWater = 0
    if (habitData && habitData.length > 0) {
      avgSleep = habitData.reduce((sum: number, entry: any) => sum + (entry.sleep_hours || 0), 0) / habitData.length
      avgWater = habitData.reduce((sum: number, entry: any) => sum + (entry.water_glasses || 0), 0) / habitData.length
    }

    // Calculate overall wellbeing score (weighted average)
    const gratitudeScore = Math.min((gratitudeCount || 0) / 10, 1) * 25 // Max 25 points
    const kindnessScore = Math.min((kindnessCount || 0) / 8, 1) * 25 // Max 25 points
    const courageScore = Math.min((courageCount || 0) / 5, 1) * 25 // Max 25 points
    const sleepScore = Math.min(avgSleep / 8, 1) * 15 // Max 15 points (8 hours ideal)
    const waterScore = Math.min(avgWater / 8, 1) * 10 // Max 10 points (8 glasses ideal)

    const overallWellbeing = Math.round(gratitudeScore + kindnessScore + courageScore + sleepScore + waterScore)

    // Get student streaks data
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select('current_streak')
      .eq('school_id', schoolId)
      .eq('role', 'student')

    let averageStreak = 0
    if (students && students.length > 0) {
      averageStreak = students.reduce((sum: number, student: any) => sum + (student.current_streak || 0), 0) / students.length
    }

    const wellbeingData = {
      overallWellbeing,
      gratitudeEntries: gratitudeCount || 0,
      kindnessActs: kindnessCount || 0,
      courageEntries: courageCount || 0,
      averageStreak: Math.round(averageStreak * 10) / 10,
      avgSleepHours: Math.round(avgSleep * 10) / 10,
      avgWaterGlasses: Math.round(avgWater * 10) / 10
    }

    return NextResponse.json(wellbeingData)
  } catch (error: any) {
    console.error('Wellbeing overview API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
