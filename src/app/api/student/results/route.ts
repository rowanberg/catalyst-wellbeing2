import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify student role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Get student's assessment grades with assessment details
    const { data: results, error: resultsError } = await supabase
      .from('assessment_grades')
      .select(`
        id,
        score,
        percentage,
        letter_grade,
        feedback,
        rubric_scores,
        created_at,
        updated_at,
        assessments!inner(
          id,
          title,
          type,
          max_score,
          created_at,
          teacher_id,
          profiles!teacher_id(
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', user.id)
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (resultsError) {
      console.error('Error fetching student results:', resultsError)
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
    }

    // Calculate statistics
    const stats = calculateResultsStats(results || [])

    // Format results for frontend
    const formattedResults = (results || []).map(result => {
      const assessment = Array.isArray(result.assessments) ? result.assessments[0] : result.assessments
      return {
        id: result.id,
        assessment: {
          id: assessment?.id || 'unknown',
          title: assessment?.title || 'Unknown Assessment',
          type: assessment?.type || 'Unknown',
          max_score: assessment?.max_score || 0,
          date: assessment?.created_at || result.created_at,
          teacher: assessment?.profiles 
            ? (Array.isArray(assessment.profiles) 
               ? `${(assessment.profiles[0] as any)?.first_name || ''} ${(assessment.profiles[0] as any)?.last_name || ''}`.trim()
               : `${(assessment.profiles as any)?.first_name || ''} ${(assessment.profiles as any)?.last_name || ''}`.trim())
            : 'Unknown Teacher'
        },
        grade: {
          score: result.score,
          percentage: result.percentage,
          letter_grade: result.letter_grade,
          feedback: result.feedback,
          rubric_scores: result.rubric_scores
        },
        submitted_at: result.created_at,
        updated_at: result.updated_at
      }
    })

    return NextResponse.json({ 
      results: formattedResults,
      stats,
      student_info: {
        name: `${profile.first_name} ${profile.last_name}`,
        school_id: profile.school_id
      }
    })

  } catch (error) {
    console.error('Error in student results API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateResultsStats(results: any[]) {
  if (!results || results.length === 0) {
    return {
      total_assessments: 0,
      average_percentage: 0,
      highest_score: 0,
      lowest_score: 0,
      grade_distribution: {},
      recent_trend: 'stable',
      improvement_areas: []
    }
  }

  const percentages = results.map(r => r.percentage)
  const scores = results.map(r => r.score)
  
  const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
  const highest = Math.max(...scores)
  const lowest = Math.min(...scores)

  // Grade distribution
  const gradeDistribution: { [key: string]: number } = {}
  results.forEach(result => {
    const grade = result.letter_grade
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1
  })

  // Calculate trend (compare recent vs older results)
  let trend = 'stable'
  if (results.length >= 4) {
    const recentResults = results.slice(0, Math.floor(results.length / 2))
    const olderResults = results.slice(Math.floor(results.length / 2))
    
    const recentAvg = recentResults.reduce((sum, r) => sum + r.percentage, 0) / recentResults.length
    const olderAvg = olderResults.reduce((sum, r) => sum + r.percentage, 0) / olderResults.length
    
    if (recentAvg > olderAvg + 5) trend = 'improving'
    else if (recentAvg < olderAvg - 5) trend = 'declining'
  }

  // Identify improvement areas (subjects/types with lower performance)
  const typePerformance: { [key: string]: number[] } = {}
  results.forEach(result => {
    const type = result.assessments.type
    if (!typePerformance[type]) typePerformance[type] = []
    typePerformance[type].push(result.percentage)
  })

  const improvementAreas = Object.entries(typePerformance)
    .map(([type, percentages]) => ({
      area: type,
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    }))
    .filter(area => area.average < average - 10)
    .sort((a, b) => a.average - b.average)
    .slice(0, 3)
    .map(area => area.area)

  return {
    total_assessments: results.length,
    average_percentage: Math.round(average * 100) / 100,
    highest_score: highest,
    lowest_score: lowest,
    grade_distribution: gradeDistribution,
    recent_trend: trend,
    improvement_areas: improvementAreas
  }
}
