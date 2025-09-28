import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

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
      .eq('student_id', user.id)
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
        student_id: user.id,
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
