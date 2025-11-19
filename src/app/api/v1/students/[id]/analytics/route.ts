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

    // Check two-tier cache first (local memory + Redis)
    const cachedData = await getCachedStudentAnalytics(studentId)
    if (cachedData) {
      return ApiResponse.success(cachedData)
    }

    const supabase = getSupabaseAdmin()

    // Parallel fetch all analytics data
    const [
      academicData,
      engagementData,
      benchmarkData,
      detailedGrades
    ] = await Promise.all([
      // Academic performance over time
      supabase
        .from('assessment_grades')
        .select(`
          id,
          score,
          percentage,
          letter_grade,
          created_at,
          assessments (
            title,
            subject,
            assessment_type,
            total_points
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(100),

      // Engagement metrics
      supabase
        .from('daily_quests')
        .select('completed, date, xp_earned')
        .eq('user_id', studentId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false }),

      // Anonymous benchmarks
      supabase
        .from('performance_benchmarks')
        .select('*')
        .eq('school_id', 
          supabase
            .from('profiles')
            .select('school_id')
            .eq('id', studentId)
            .single()
        ),

      // Detailed gradebook
      supabase
        .from('assessment_grades')
        .select(`
          *,
          assessments (
            title,
            subject,
            assessment_type,
            due_date,
            class_id,
            classes (
              name,
              subject
            )
          ),
          teacher:profiles!teacher_id (
            first_name,
            last_name
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
    ])

    // Process academic performance data
    const performanceData = processAcademicPerformance(academicData.data || [])
    
    // Process engagement data
    const engagementMetrics = processEngagementData(engagementData.data || [])
    
    // Process benchmark comparisons
    const benchmarks = processBenchmarks(benchmarkData.data || [], performanceData)
    
    // Format detailed gradebook
    const gradebook = formatGradebook(detailedGrades.data || [])

    const responseData = {
      academic: performanceData,
      engagement: engagementMetrics,
      benchmarks,
      gradebook
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
    const subject = grade.assessments?.subject || 'General'
    if (!bySubject[subject]) bySubject[subject] = []
    bySubject[subject].push(grade)
  })

  // Calculate GPA trend over time
  const gpaTrend = calculateGPATrend(grades)
  
  // Performance by category
  const byCategory = calculatePerformanceByCategory(grades)
  
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
    byCategory,
    bySubject: subjectPerformance,
    currentGPA: calculateCurrentGPA(grades),
    totalAssignments: grades.length
  }
}

function calculateGPATrend(grades: any[]) {
  // Group by month
  const byMonth: Record<string, number[]> = {}
  
  grades.forEach(grade => {
    const month = new Date(grade.created_at).toISOString().slice(0, 7)
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

function calculatePerformanceByCategory(grades: any[]) {
  const categories: Record<string, number[]> = {
    exam: [],
    quiz: [],
    homework: [],
    project: [],
    other: []
  }

  grades.forEach(grade => {
    const type = grade.assessments?.assessment_type || 'other'
    const category = categories[type] || categories.other
    category.push(grade.percentage)
  })

  return Object.entries(categories)
    .filter(([_, percentages]) => percentages.length > 0)
    .map(([category, percentages]) => ({
      category,
      average: (percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(1),
      count: percentages.length
    }))
}

function processEngagementData(quests: any[]) {
  const totalQuests = quests.length
  const completedQuests = quests.filter(q => q.completed).length
  const completionRate = totalQuests > 0 ? (completedQuests / totalQuests * 100).toFixed(1) : '0'
  
  // Weekly XP trend
  const weeklyXP: Record<string, number> = {}
  quests.forEach(quest => {
    const week = getWeekNumber(new Date(quest.date))
    if (!weeklyXP[week]) weeklyXP[week] = 0
    if (quest.completed && quest.xp_earned) {
      weeklyXP[week] += quest.xp_earned
    }
  })

  // On-time submission rate (assuming all completed quests are on-time for now)
  const onTimeRate = completionRate

  return {
    completionRate,
    totalCompleted: completedQuests,
    totalQuests,
    onTimeRate,
    weeklyXPTrend: Object.entries(weeklyXP).map(([week, xp]) => ({ week, xp }))
  }
}

function processBenchmarks(benchmarks: any[], studentData: any) {
  // Find relevant benchmarks for student's subjects
  const relevantBenchmarks = studentData.bySubject.map((subjectData: any) => {
    const classBenchmark = benchmarks.find(b => 
      b.subject === subjectData.subject && 
      b.metric_type === 'avg_grade' &&
      b.class_id
    )
    const schoolBenchmark = benchmarks.find(b => 
      b.subject === subjectData.subject && 
      b.metric_type === 'avg_grade' &&
      !b.class_id
    )

    return {
      subject: subjectData.subject,
      studentAverage: parseFloat(subjectData.average),
      classAverage: classBenchmark?.metric_value || null,
      schoolAverage: schoolBenchmark?.metric_value || null,
      comparison: {
        vsClass: classBenchmark 
          ? (parseFloat(subjectData.average) - classBenchmark.metric_value).toFixed(1)
          : null,
        vsSchool: schoolBenchmark
          ? (parseFloat(subjectData.average) - schoolBenchmark.metric_value).toFixed(1)  
          : null
      }
    }
  })

  return relevantBenchmarks
}

function formatGradebook(grades: any[]) {
  // Group by class/subject
  const byClass: Record<string, any[]> = {}
  
  grades.forEach(grade => {
    const className = grade.assessments?.classes?.name || grade.assessments?.subject || 'General'
    if (!byClass[className]) byClass[className] = []
    
    byClass[className].push({
      id: grade.id,
      assignment: grade.assessments?.title || 'Unknown',
      type: grade.assessments?.assessment_type || 'assignment',
      score: grade.score,
      totalPoints: grade.assessments?.total_points || 100,
      percentage: grade.percentage,
      letterGrade: grade.letter_grade,
      date: grade.created_at,
      teacher: grade.teacher ? 
        `${grade.teacher.first_name} ${grade.teacher.last_name}` : 
        'Unknown',
      feedback: grade.feedback
    })
  })

  return Object.entries(byClass).map(([className, assignments]) => ({
    className,
    assignments: assignments.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    average: (assignments.reduce((sum, a) => sum + a.percentage, 0) / assignments.length).toFixed(1)
  }))
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

function getWeekNumber(date: Date): string {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return `Week ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`
}
