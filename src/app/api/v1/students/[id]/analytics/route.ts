/**
 * Parent Analytics API - Deep Dive Analytics
 * GET /api/v1/students/{student_id}/analytics
 */
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { getCachedStudentAnalytics, setCachedStudentAnalytics } from '@/lib/redis/parent-cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params

    console.log('[Analytics API] Request for student:', studentId)

    // Check two-tier cache first (local memory + Redis)
    const cachedData = await getCachedStudentAnalytics(studentId)
    if (cachedData) {
      console.log('[Analytics API] Returning CACHED data:', JSON.stringify(cachedData, null, 2))
      return ApiResponse.success(cachedData)
    }

    console.log('[Analytics API] Cache MISS - Fetching fresh data')

    const supabase = getSupabaseAdmin()

    console.log('[Analytics API] Fetching data for student:', studentId)

    // Parallel fetch from both tables separately (mirroring student API logic)
    const [academicAssessments, assessmentGrades] = await Promise.all([
      // Academic assessments table
      supabase
        .from('academic_assessments')
        .select('id, subject_name, score, max_score, date_taken')
        .eq('student_id', studentId)
        .order('date_taken', { ascending: false }),

      // Assessment grades table
      supabase
        .from('assessment_grades')
        .select('id, score, percentage, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
    ])

    console.log('[Analytics API] Academic assessments:', academicAssessments)
    console.log('[Analytics API] Assessment grades:', assessmentGrades)

    // Combine and normalize data
    const allGrades = [
      ...(academicAssessments.data || []).map(a => ({
        subject: a.subject_name || 'General',
        score: a.score,
        maxScore: a.max_score,
        percentage: a.max_score > 0 ? (a.score / a.max_score * 100) : 0,
        date: a.date_taken
      })),
      ...(assessmentGrades.data || []).map(a => ({
        subject: 'General', // Grades table often lacks subject info in this schema
        score: a.score,
        maxScore: 100,
        percentage: a.percentage,
        date: a.created_at
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log('[Analytics API] Combined grades count:', allGrades.length)
    console.log('[Analytics API] Sample grade:', allGrades[0])

    // Process academic performance data
    const performanceData = processAcademicPerformance(allGrades)

    // Calculate engagement/completion metrics
    // For now, we treat all graded items as "completed". 
    // Pending/Overdue would require a separate "assignments" table query if it exists.
    const completionRate = allGrades.length > 0 ? '100' : '0'

    const responseData = {
      academic: performanceData,
      engagement: {
        completionRate
      }
    }

    // Cache the aggregated analytics payload for future requests
    await setCachedStudentAnalytics(studentId, responseData)

    return ApiResponse.success(responseData)

  } catch (error: any) {
    console.error('Analytics API error:', error)
    return ApiResponse.internalError('Failed to fetch analytics')
  }
}

function processAcademicPerformance(grades: any[]) {
  // Group by subject
  const bySubject: Record<string, any[]> = {}
  grades.forEach(grade => {
    const subject = grade.subject
    if (!bySubject[subject]) bySubject[subject] = []
    bySubject[subject].push(grade)
  })

  // Calculate GPA trend over time
  const gpaTrend = calculateGPATrend(grades)

  // Subject performance
  const subjectPerformance = Object.entries(bySubject).map(([subject, subjectGrades]) => {
    const avg = subjectGrades.reduce((sum, g) => sum + g.percentage, 0) / subjectGrades.length
    return {
      subject,
      average: avg.toFixed(1),
      letterGrade: percentageToLetterGrade(avg),
      totalAssignments: subjectGrades.length,
      trend: calculateTrend(subjectGrades)
    }
  })

  return {
    gpaTrend,
    bySubject: subjectPerformance,
    currentGPA: calculateCurrentGPA(grades),
    totalAssignments: grades.length
  }
}

function calculateGPATrend(grades: any[]) {
  // Group by month
  const byMonth: Record<string, number[]> = {}

  grades.forEach(grade => {
    const month = new Date(grade.date).toISOString().slice(0, 7)
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(grade.percentage)
  })

  return Object.entries(byMonth)
    .map(([month, percentages]) => ({
      month,
      gpa: convertPercentageToGPA(
        percentages.reduce((sum, p) => sum + p, 0) / percentages.length
      ),
      avgPercentage: (percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(1)
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function calculateCurrentGPA(grades: any[]) {
  if (grades.length === 0) return '0.0'

  const avgPercentage = grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
  return convertPercentageToGPA(avgPercentage).toFixed(2)
}

function convertPercentageToGPA(percentage: number): number {
  if (percentage >= 93) return 4.0
  if (percentage >= 90) return 3.7
  if (percentage >= 87) return 3.3
  if (percentage >= 83) return 3.0
  if (percentage >= 80) return 2.7
  if (percentage >= 77) return 2.3
  if (percentage >= 73) return 2.0
  if (percentage >= 70) return 1.7
  if (percentage >= 67) return 1.3
  if (percentage >= 65) return 1.0
  return 0.0
}

function percentageToLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A'
  if (percentage >= 90) return 'A-'
  if (percentage >= 87) return 'B+'
  if (percentage >= 83) return 'B'
  if (percentage >= 80) return 'B-'
  if (percentage >= 77) return 'C+'
  if (percentage >= 73) return 'C'
  if (percentage >= 70) return 'C-'
  if (percentage >= 67) return 'D+'
  if (percentage >= 65) return 'D'
  return 'F'
}

function calculateTrend(grades: any[]): 'up' | 'down' | 'stable' {
  if (grades.length < 2) return 'stable'

  const recent = grades.slice(0, Math.ceil(grades.length / 2))
  const older = grades.slice(Math.ceil(grades.length / 2))

  const recentAvg = recent.reduce((sum, g) => sum + g.percentage, 0) / recent.length
  const olderAvg = older.reduce((sum, g) => sum + g.percentage, 0) / older.length

  if (recentAvg > olderAvg + 2) return 'up'
  if (recentAvg < olderAvg - 2) return 'down'
  return 'stable'
}
