import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { assessment_ids, export_options } = body

    if (!assessment_ids || assessment_ids.length === 0) {
      return NextResponse.json({ error: 'No assessments selected' }, { status: 400 })
    }

    // Get assessment data with grades
    const { data: assessmentData, error: dataError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        type,
        max_score,
        created_at,
        assessment_grades!inner(
          id,
          student_id,
          score,
          percentage,
          letter_grade,
          feedback,
          rubric_scores,
          created_at as grade_created_at,
          students!inner(
            id,
            first_name,
            last_name,
            grade_level,
            class_name
          )
        )
      `)
      .in('id', assessment_ids)
      .eq('teacher_id', user.id)

    if (dataError) {
      console.error('Error fetching assessment data:', dataError)
      return NextResponse.json({ error: 'Failed to fetch assessment data' }, { status: 500 })
    }

    // Generate export based on format
    const exportData = generateExportData(assessmentData || [], export_options)
    
    switch (export_options.format) {
      case 'csv':
        return new NextResponse(exportData.csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="grades_export.csv"'
          }
        })
      
      case 'json':
        return new NextResponse(JSON.stringify(exportData.json, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="grades_export.json"'
          }
        })
      
      case 'excel':
        // For Excel, we'll return CSV for now (in a real implementation, use a library like xlsx)
        return new NextResponse(exportData.csv, {
          headers: {
            'Content-Type': 'application/vnd.ms-excel',
            'Content-Disposition': 'attachment; filename="grades_export.xlsx"'
          }
        })
      
      case 'pdf':
        // For PDF, return a simple text format (in a real implementation, use a PDF library)
        return new NextResponse(exportData.text, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename="grades_export.txt"'
          }
        })
      
      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in export grades API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateExportData(assessments: any[], options: any) {
  const { includeStudentInfo, includeRubricScores, includeFeedback, includeAnalytics, groupBy } = options
  
  // Flatten data structure
  const flatData: any[] = []
  
  assessments.forEach(assessment => {
    assessment.assessment_grades.forEach((grade: any) => {
      const row: any = {
        assessment_title: assessment.title,
        assessment_type: assessment.type,
        assessment_max_score: assessment.max_score,
        assessment_date: new Date(assessment.created_at).toLocaleDateString(),
        score: grade.score,
        percentage: grade.percentage,
        letter_grade: grade.letter_grade,
        grade_date: new Date(grade.grade_created_at).toLocaleDateString()
      }
      
      if (includeStudentInfo) {
        row.student_first_name = grade.students.first_name
        row.student_last_name = grade.students.last_name
        row.student_grade_level = grade.students.grade_level
        row.student_class = grade.students.class_name
      }
      
      if (includeFeedback && grade.feedback) {
        row.feedback = grade.feedback
      }
      
      if (includeRubricScores && grade.rubric_scores) {
        Object.entries(grade.rubric_scores).forEach(([criteria, score]) => {
          row[`rubric_${criteria}`] = score
        })
      }
      
      flatData.push(row)
    })
  })
  
  // Generate CSV
  const csvHeaders = Object.keys(flatData[0] || {})
  const csvRows = flatData.map(row => 
    csvHeaders.map(header => {
      const value = row[header] || ''
      // Escape commas and quotes in CSV
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    }).join(',')
  )
  const csv = [csvHeaders.join(','), ...csvRows].join('\n')
  
  // Generate JSON
  const json = {
    export_info: {
      generated_at: new Date().toISOString(),
      total_assessments: assessments.length,
      total_grades: flatData.length,
      options: options
    },
    data: groupBy === 'student' ? groupByStudent(flatData) :
          groupBy === 'assessment' ? groupByAssessment(flatData) :
          flatData
  }
  
  // Generate text format
  const text = generateTextReport(assessments, flatData, options)
  
  return { csv, json, text }
}

function groupByStudent(data: any[]) {
  const grouped: { [key: string]: any } = {}
  
  data.forEach(row => {
    const studentKey = `${row.student_first_name} ${row.student_last_name}`
    if (!grouped[studentKey]) {
      grouped[studentKey] = {
        student_info: {
          first_name: row.student_first_name,
          last_name: row.student_last_name,
          grade_level: row.student_grade_level,
          class: row.student_class
        },
        assessments: []
      }
    }
    
    grouped[studentKey].assessments.push({
      title: row.assessment_title,
      type: row.assessment_type,
      max_score: row.assessment_max_score,
      date: row.assessment_date,
      score: row.score,
      percentage: row.percentage,
      letter_grade: row.letter_grade,
      feedback: row.feedback
    })
  })
  
  return grouped
}

function groupByAssessment(data: any[]) {
  const grouped: { [key: string]: any } = {}
  
  data.forEach(row => {
    const assessmentKey = row.assessment_title
    if (!grouped[assessmentKey]) {
      grouped[assessmentKey] = {
        assessment_info: {
          title: row.assessment_title,
          type: row.assessment_type,
          max_score: row.assessment_max_score,
          date: row.assessment_date
        },
        grades: []
      }
    }
    
    grouped[assessmentKey].grades.push({
      student: `${row.student_first_name} ${row.student_last_name}`,
      score: row.score,
      percentage: row.percentage,
      letter_grade: row.letter_grade,
      feedback: row.feedback
    })
  })
  
  return grouped
}

function generateTextReport(assessments: any[], flatData: any[], options: any) {
  let report = 'GRADE EXPORT REPORT\n'
  report += '===================\n\n'
  report += `Generated: ${new Date().toLocaleString()}\n`
  report += `Total Assessments: ${assessments.length}\n`
  report += `Total Grade Entries: ${flatData.length}\n\n`
  
  if (options.includeAnalytics) {
    // Calculate basic analytics
    const totalScores = flatData.map(d => d.percentage)
    const average = totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length
    const highest = Math.max(...totalScores)
    const lowest = Math.min(...totalScores)
    
    report += 'ANALYTICS SUMMARY\n'
    report += '-----------------\n'
    report += `Class Average: ${average.toFixed(2)}%\n`
    report += `Highest Score: ${highest}%\n`
    report += `Lowest Score: ${lowest}%\n\n`
  }
  
  report += 'DETAILED RESULTS\n'
  report += '----------------\n'
  
  flatData.forEach(row => {
    report += `${row.student_first_name} ${row.student_last_name} - ${row.assessment_title}\n`
    report += `  Score: ${row.score}/${row.assessment_max_score} (${row.percentage}%) - Grade: ${row.letter_grade}\n`
    if (row.feedback) {
      report += `  Feedback: ${row.feedback}\n`
    }
    report += '\n'
  })
  
  return report
}
