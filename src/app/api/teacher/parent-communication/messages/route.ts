import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const parentId = searchParams.get('parent_id')
    const studentId = searchParams.get('student_id')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('parent_teacher_messages')
      .select(`
        id,
        subject,
        message,
        sender_type,
        is_read,
        priority,
        created_at,
        parent:parents(id, full_name, email),
        student:students(id, full_name),
        reply_count:parent_teacher_messages!reply_to_id(count)
      `)
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { parent_id, student_id, subject, message, priority = 'normal', reply_to_id } = body

    // Validate required fields
    if (!parent_id || !student_id || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Verify parent and student belong to teacher's school
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, parent_id, school_id')
      .eq('id', student_id)
      .eq('parent_id', parent_id)
      .eq('school_id', teacher.school_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Invalid student or parent' }, { status: 400 })
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('parent_teacher_messages')
      .insert({
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        parent_id,
        student_id,
        subject,
        message,
        sender_type: 'teacher',
        priority,
        reply_to_id
      })
      .select(`
        id,
        subject,
        message,
        sender_type,
        priority,
        created_at,
        parent:parents(full_name, email),
        student:students(full_name)
      `)
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { message_id, is_read } = body

    if (!message_id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Update message
    const { error: updateError } = await supabase
      .from('parent_teacher_messages')
      .update({ is_read })
      .eq('id', message_id)
      .eq('teacher_id', teacher.id)

    if (updateError) {
      console.error('Error updating message:', updateError)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { message_id, is_read } = body

    if (!message_id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Update message
    const { error: updateError } = await supabase
      .from('parent_teacher_messages')
      .update({ is_read })
      .eq('id', message_id)
      .eq('teacher_id', teacher.id)

    if (updateError) {
      console.error('Error updating message:', updateError)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
