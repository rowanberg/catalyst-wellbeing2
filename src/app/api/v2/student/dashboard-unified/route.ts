/**
 * ============================================================================
 * Unified Student Dashboard API
 * ============================================================================
 * Single endpoint that returns ALL dashboard data in one request
 * Eliminates waterfall requests and reduces total page load time
 * 
 * Target: <500ms response time (all data)
 * 
 * Returns:
 * - Growth data (GPA, tests, subjects, achievements)
 * - Today data (quests, exams, progress, school updates)
 * - Profile data (cached)
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import { getCached, cacheKeys } from '@/lib/cache/redis-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// Main Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate with caching (single auth check)
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    const { profileId, schoolId, supabase, profile } = auth

    // Get unified dashboard data with caching
    const dashboardData = await getCached(
      `student:${profileId}:dashboard:unified`,
      () => fetchUnifiedDashboard(profileId, schoolId, supabase, profile),
      { 
        ttl: 60,
        staleWhileRevalidate: true
      }
    )

    const duration = Date.now() - startTime

    console.log('🎯 [Unified Dashboard]', {
      studentId: profileId,
      duration: `${duration}ms`,
      cached: duration < 100,
      dataSize: JSON.stringify(dashboardData).length
    })

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${duration}ms`,
        'X-Cache-Status': duration < 100 ? 'HIT' : 'MISS',
        'X-Api-Version': 'v2-unified'
      }
    })

  } catch (error: any) {
    console.error('❌ [Unified Dashboard] Error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// Fetch All Dashboard Data (Parallel)
// ============================================================================

async function fetchUnifiedDashboard(
  studentId: string, 
  schoolId: string, 
  supabase: any,
  profile: any
) {
  const fetchStart = Date.now()
  const today = new Date().toISOString().split('T')[0]

  // Parallel fetch ALL data using materialized views
  const [
    growthSummaryRes,
    recentTestsRes,
    subjectPerfRes,
    todaySummaryRes,
    upcomingExamsRes,
    pollsRes,
    announcementsRes
  ] = await Promise.allSettled([
    // Growth data
    supabase
      .from('mv_student_growth_summary')
      .select('*')
      .eq('student_id', studentId)
      .single(),
    
    supabase
      .from('mv_student_recent_tests')
      .select('*')
      .eq('student_id', studentId)
      .lte('recency_rank', 10)
      .order('recency_rank', { ascending: true }),
    
    supabase
      .from('mv_student_subject_performance')
      .select('*')
      .eq('student_id', studentId),
    
    // Today data
    supabase
      .from('mv_student_today_summary')
      .select('*')
      .eq('student_id', studentId)
      .single(),
    
    supabase
      .from('mv_upcoming_assessments')
      .select('*')
      .eq('school_id', schoolId)
      .limit(5),
    
    supabase
      .from('mv_active_polls')
      .select('*')
      .eq('school_id', schoolId)
      .limit(2),
    
    supabase
      .from('mv_active_announcements')
      .select('*')
      .eq('school_id', schoolId)
      .limit(2)
  ])

  // Process all results
  const growthSummary = growthSummaryRes.status === 'fulfilled' ? growthSummaryRes.value.data : null
  const recentTests = recentTestsRes.status === 'fulfilled' ? recentTestsRes.value.data || [] : []
  const subjects = subjectPerfRes.status === 'fulfilled' ? subjectPerfRes.value.data || [] : []
  const todaySummary = todaySummaryRes.status === 'fulfilled' ? todaySummaryRes.value.data : null
  const upcomingExams = upcomingExamsRes.status === 'fulfilled' ? upcomingExamsRes.value.data || [] : []
  const polls = pollsRes.status === 'fulfilled' ? pollsRes.value.data || [] : []
  const announcements = announcementsRes.status === 'fulfilled' ? announcementsRes.value.data || [] : []

  const fetchDuration = Date.now() - fetchStart

  // Build unified response
  return {
    profile: {
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      email: profile.email,
      role: profile.role,
      schoolId: profile.school_id
    },
    
    growth: {
      stats: {
        overallGPA: growthSummary?.overall_gpa || 0,
        avgScore: Math.round(growthSummary?.avg_score_percentage || 0),
        testsCount: growthSummary?.total_tests || 0,
        attendance: growthSummary?.attendance_percentage || 92
      },
      recentTests: recentTests.map((test: any) => ({
        id: test.id,
        subject: test.subject,
        score: test.score,
        maxScore: test.max_score,
        percentage: Math.round(test.percentage),
        grade: test.letter_grade,
        date: test.date
      })),
      subjectPerformance: subjects.map((subj: any) => ({
        name: subj.subject_name,
        average: subj.average_score || 0,
        trend: subj.trend || 'stable',
        testCount: subj.test_count || 0
      })),
      achievements: {
        xp: profile.xp || 0,
        gems: profile.gems || 0,
        level: profile.level || 1,
        quests: profile.total_quests_completed || 0
      },
      analytics: {
        gradeDistribution: [
          { grade: 'A+', count: growthSummary?.grade_a_plus_count || 0, color: 'bg-green-500' },
          { grade: 'A', count: growthSummary?.grade_a_count || 0, color: 'bg-blue-500' },
          { grade: 'B+', count: growthSummary?.grade_b_plus_count || 0, color: 'bg-yellow-500' },
          { grade: 'B', count: growthSummary?.grade_b_count || 0, color: 'bg-orange-500' },
          { grade: 'C+', count: growthSummary?.grade_c_plus_count || 0, color: 'bg-red-500' }
        ].filter(g => g.count > 0),
        studyStreak: growthSummary?.study_streak || 0,
        focusAreas: subjects.slice(0, 3).map((s: any) => ({
          subject: s.subject_name,
          improvement: s.trend === 'up' ? 5 : s.trend === 'down' ? -3 : 0
        }))
      }
    },
    
    today: {
      quests: {
        completed: todaySummary?.quests_completed || 0,
        total: 6,
        items: [
          { id: 'gratitude', type: 'gratitude', title: 'Gratitude Journal', xp: 15, completed: todaySummary?.quest_gratitude || false },
          { id: 'kindness', type: 'kindness', title: 'Acts of Kindness', xp: 20, completed: todaySummary?.quest_kindness || false },
          { id: 'courage', type: 'courage', title: 'Courage Challenge', xp: 25, completed: todaySummary?.quest_courage || false },
          { id: 'breathing', type: 'breathing', title: 'Mindful Breathing', xp: 10, completed: todaySummary?.quest_breathing || false },
          { id: 'water', type: 'water', title: 'Hydration Hero', xp: 8, completed: todaySummary?.quest_water || false },
          { id: 'sleep', type: 'sleep', title: 'Sleep Champion', xp: 12, completed: todaySummary?.quest_sleep || false }
        ]
      },
      upcomingExams: upcomingExams.map((exam: any) => ({
        id: exam.id,
        subject: exam.subject,
        type: exam.exam_type || 'Test',
        date: exam.due_date,
        time: exam.exam_time || '9:00 AM',
        title: exam.title,
        daysUntil: exam.days_until
      })),
      weeklyProgress: {
        xp: todaySummary?.weekly_xp || 0,
        rank: todaySummary?.class_rank || 0,
        streak: todaySummary?.streak_days || 0
      },
      schoolUpdates: {
        polls: polls.map((poll: any) => ({
          id: poll.id,
          title: poll.title,
          description: poll.description,
          questions: poll.poll_questions || [],
          endDate: poll.end_date,
          type: poll.type
        })),
        announcements: announcements.map((ann: any) => ({
          id: ann.id,
          title: ann.title,
          content: ann.content,
          priority: ann.priority || 'medium',
          author: ann.display_author,
          created_at: ann.created_at
        }))
      }
    },
    
    metadata: {
      timestamp: new Date().toISOString(),
      fetchDuration,
      viewsAvailable: !!growthSummary && !!todaySummary,
      cacheKey: `student:${studentId}:dashboard:unified`
    }
  }
}
