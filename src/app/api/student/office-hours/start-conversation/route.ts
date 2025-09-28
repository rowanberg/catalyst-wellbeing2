import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { teacherId } = await request.json()

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify student role and school
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden - Student access required' }, { status: 403 })
    }

    // Verify teacher is from same school
    const { data: teacher, error: teacherError } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .eq('school_id', profile.school_id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found or not accessible' }, { status: 404 })
    }

    // Check if teacher is currently available (has office hours now)
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
    const currentTime = now.toTimeString().slice(0, 5)

    const { data: officeHours, error: hoursError } = await supabase
      .from('teacher_office_hours')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('day_of_week', currentDay)
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)

    if (hoursError) {
      console.error('Error checking office hours:', hoursError)
    }

    if (!officeHours || officeHours.length === 0) {
      return NextResponse.json({ 
        error: 'Teacher is not currently available. Please check their office hours.' 
      }, { status: 400 })
    }

    // Check if there's already an active conversation
    const { data: existingConversation, error: existingError } = await supabase
      .from('office_hours_conversations')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('teacher_id', teacherId)
      .in('status', ['active', 'pending_approval'])
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing conversation:', existingError)
      return NextResponse.json({ error: 'Failed to check existing conversations' }, { status: 500 })
    }

    if (existingConversation) {
      return NextResponse.json({ 
        conversationId: existingConversation.id,
        message: 'Conversation already exists'
      })
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('office_hours_conversations')
      .insert({
        student_id: user.id,
        teacher_id: teacherId,
        status: 'active',
        school_id: profile.school_id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Send initial system message
    await supabase
      .from('office_hours_messages')
      .insert({
        conversation_id: newConversation.id,
        sender_id: user.id,
        sender_type: 'system',
        content: 'Office hours conversation started. All messages are moderated for safety.',
        is_moderated: true
      })

    return NextResponse.json({ 
      conversationId: newConversation.id,
      message: 'Conversation started successfully'
    })

  } catch (error) {
    console.error('Unexpected error in start conversation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
