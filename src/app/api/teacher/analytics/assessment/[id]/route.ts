import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const assessmentId = params.id
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify teacher role and assessment ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, title, max_score, teacher_id')
      .eq('id', assessmentId)
      .eq('teacher_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 403 })
    }

    // Get all grades for this assessment
    const { data: grades, error: gradesError } = await supabase
      .from('assessment_grades')
      .select('score, percentage, letter_grade')
      .eq('assessment_id', assessmentId)

    if (gradesError) {
      console.error('Error fetching grades for analytics:', gradesError)
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
    }

    if (!grades || grades.length === 0) {
      return NextResponse.json({
        class_average: 0,
        highest_score: 0,
        lowest_score: 0,
        pass_rate: 0,
        grade_distribution: {},
        total_students: 0,
        recommendations: []
      })
    }

    // Calculate analytics
    const scores = grades.map(g => g.score)
    const percentages = grades.map(g => g.percentage)
    
    const classAverage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    const highestScore = Math.max(...scores)
    const lowestScore = Math.min(...scores)
    const passingGrades = grades.filter(g => g.percentage >= 60).length
    const passRate = Math.round((passingGrades / grades.length) * 100)

    // Grade distribution
    const gradeDistribution: { [key: string]: number } = {}
    grades.forEach(grade => {
      const letter = grade.letter_grade
      gradeDistribution[letter] = (gradeDistribution[letter] || 0) + 1
    })

    // Generate recommendations
    const recommendations = []
    if (classAverage < 70) {
      recommendations.push({
        type: 'warning',
        message: 'Class average is below 70%. Consider reviewing the material or providing additional support.',
        action: 'Schedule review session'
      })
    }
    if (passRate < 80) {
      recommendations.push({
        type: 'alert',
        message: `${100 - passRate}% of students are not meeting expectations. Individual interventions may be needed.`,
        action: 'Identify struggling students'
      })
    }
    if (highestScore === assessment.max_score && lowestScore < assessment.max_score * 0.5) {
      recommendations.push({
        type: 'info',
        message: 'Wide score distribution detected. Consider differentiated instruction approaches.',
        action: 'Review teaching strategies'
      })
    }

    // Item analysis (placeholder - would need question-level data)
    const itemAnalysis = {
      most_missed: 'Question analysis requires detailed response data',
      difficulty_distribution: 'Available with OMR scanning'
    }

    const analytics = {
      class_average: classAverage,
      highest_score: highestScore,
      lowest_score: lowestScore,
      pass_rate: passRate,
      grade_distribution: gradeDistribution,
      total_students: grades.length,
      item_analysis: itemAnalysis,
      recommendations,
      assessment_info: {
        title: assessment.title,
        max_score: assessment.max_score
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error in assessment analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
