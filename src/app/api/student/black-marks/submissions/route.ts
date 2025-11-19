import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }
    
    const { supabase, userId } = auth

    const body = await request.json()
    const { blackMarkId, submissionText, submissionFiles } = body

    if (!blackMarkId || !submissionText) {
      return NextResponse.json({ error: 'Black mark ID and submission text are required' }, { status: 400 })
    }

    // Verify the black mark belongs to this student
    const { data: blackMark, error: blackMarkError } = await supabase
      .from('black_marks')
      .select('id, student_id, status')
      .eq('id', blackMarkId)
      .eq('student_id', userId)
      .single()

    if (blackMarkError || !blackMark) {
      return NextResponse.json({ error: 'Black mark not found' }, { status: 404 })
    }

    if (blackMark.status === 'resolved') {
      return NextResponse.json({ error: 'Cannot submit to a resolved black mark' }, { status: 400 })
    }

    // Create the submission
    const { data: submission, error: submissionError } = await supabase
      .from('black_mark_submissions')
      .insert({
        black_mark_id: blackMarkId,
        student_id: userId,
        submission_text: submissionText,
        submission_files: submissionFiles || [],
        status: 'pending'
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    // Update black mark status to in_progress
    await supabase
      .from('black_marks')
      .update({ status: 'in_progress' })
      .eq('id', blackMarkId)

    return NextResponse.json({
      message: 'Submission created successfully',
      submission
    }, { status: 201 })

  } catch (error) {
    console.error('Error in black mark submission API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
