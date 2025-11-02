import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    console.log('🔍 Fetching assessments for student:', studentId)
    
    // Fetch school name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('school_id, schools!fk_profiles_school_id(name)')
      .eq('id', studentId)
      .single()

    const schoolName = (profileData?.schools as any)?.name || null
    console.log('🏫 School name:', schoolName)

    // Fetch from both assessment tables
    const [academicAssessments, assessmentGrades] = await Promise.all([
      // Academic assessments
      supabase
        .from('academic_assessments')
        .select('id, subject_name, assessment_type, title, score, max_score, date_taken, notes')
        .eq('student_id', studentId)
        .order('date_taken', { ascending: false }),
      
      // Assessment grades (without join)
      supabase
        .from('assessment_grades')
        .select('id, score, percentage, letter_grade, feedback, created_at, assessment_id')
        .eq('student_id', studentId)
    ])

    console.log('📚 Academic assessments result:', academicAssessments)
    console.log('📝 Assessment grades result:', assessmentGrades)
    
    const assessments: any[] = []

    // Process academic_assessments
    if (academicAssessments.data) {
      assessments.push(...academicAssessments.data.map(a => ({
        id: a.id,
        subject: a.subject_name,
        type: a.assessment_type,
        title: a.title,
        score: a.score,
        maxScore: a.max_score,
        percentage: a.max_score > 0 ? (a.score / a.max_score * 100).toFixed(1) : '0',
        date: a.date_taken,
        notes: a.notes,
        source: 'academic'
      })))
    }

    // Process assessment_grades directly (no lookup needed - assessment may not exist in DB)
    if (assessmentGrades.data) {
      assessments.push(...assessmentGrades.data.map((a: any, index: number) => ({
        id: a.id,
        subject: 'General',
        type: 'assessment',
        title: `Assessment ${index + 1}`, // Simple numbering since we can't get titles
        score: a.score,
        maxScore: 100,
        percentage: a.percentage,
        letterGrade: a.letter_grade,
        date: a.created_at,
        feedback: a.feedback,
        source: 'grades'
      })))
    }

    // Sort by date
    assessments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log('✅ Total assessments to return:', assessments.length)
    console.log('📋 Sample assessment:', assessments[0])

    return NextResponse.json({ assessments, schoolName })
  } catch (error) {
    console.error('Error fetching student assessments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
