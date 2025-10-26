import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, xp, gems, level, total_quests_completed')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 })
    }

    // Parallel fetch all data needed for Growth tab
    const [testsRes, subjectsRes, analyticsRes] = await Promise.allSettled([
      // Recent test results
      supabase
        .from('test_results')
        .select('*')
        .eq('student_id', profile.id)
        .order('date', { ascending: false })
        .limit(10),
      
      // Subject performance
      supabase
        .from('subject_performance')
        .select('*')
        .eq('student_id', profile.id),
      
      // Analytics data
      supabase
        .from('student_analytics')
        .select('*')
        .eq('student_id', profile.id)
        .single()
    ])

    // Process results
    const recentTests = testsRes.status === 'fulfilled' ? testsRes.value.data || [] : []
    const subjects = subjectsRes.status === 'fulfilled' ? subjectsRes.value.data || [] : []
    const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : null

    // Calculate overall statistics
    const testsCount = recentTests.length
    const avgScore = testsCount > 0 
      ? recentTests.reduce((sum, test) => sum + (test.score / test.max_score) * 100, 0) / testsCount
      : 0
    
    // Calculate GPA (simplified)
    const overallGPA = avgScore >= 90 ? 4.0 :
                       avgScore >= 80 ? 3.5 :
                       avgScore >= 70 ? 3.0 :
                       avgScore >= 60 ? 2.5 : 2.0

    // Format subject performance
    const subjectPerformance = subjects.map(subj => ({
      name: subj.subject_name,
      average: subj.average_score || 0,
      trend: subj.trend || 'stable'
    }))

    // Grade distribution
    const gradeDistribution = [
      { grade: 'A+', count: recentTests.filter(t => (t.score / t.max_score) >= 0.95).length, color: 'bg-green-500' },
      { grade: 'A', count: recentTests.filter(t => (t.score / t.max_score) >= 0.90 && (t.score / t.max_score) < 0.95).length, color: 'bg-blue-500' },
      { grade: 'B+', count: recentTests.filter(t => (t.score / t.max_score) >= 0.85 && (t.score / t.max_score) < 0.90).length, color: 'bg-yellow-500' },
      { grade: 'B', count: recentTests.filter(t => (t.score / t.max_score) >= 0.80 && (t.score / t.max_score) < 0.85).length, color: 'bg-orange-500' },
      { grade: 'C+', count: recentTests.filter(t => (t.score / t.max_score) < 0.80).length, color: 'bg-red-500' }
    ].filter(g => g.count > 0)

    // Mock focus areas (would come from analytics in production)
    const focusAreas = [
      { subject: 'Mathematics', improvement: 5 },
      { subject: 'Science', improvement: 3 },
      { subject: 'English', improvement: -2 }
    ]

    return NextResponse.json({
      stats: {
        overallGPA: overallGPA,
        avgScore: Math.round(avgScore),
        testsCount: testsCount,
        attendance: analytics?.attendance_percentage || 92
      },
      recentTests: recentTests.map(test => ({
        id: test.id,
        subject: test.subject,
        score: test.score,
        maxScore: test.max_score,
        grade: test.score >= 90 ? 'A' :
               test.score >= 80 ? 'B' :
               test.score >= 70 ? 'C' :
               test.score >= 60 ? 'D' : 'F',
        date: test.date
      })),
      subjectPerformance: subjectPerformance,
      achievements: {
        xp: profile.xp || 0,
        gems: profile.gems || 0,
        level: profile.level || 1,
        quests: profile.total_quests_completed || 0
      },
      analytics: {
        gradeDistribution: gradeDistribution,
        studyStreak: analytics?.study_streak || 0,
        focusAreas: focusAreas
      }
    })

  } catch (error: any) {
    console.error('Error in /api/v2/student/growth:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
