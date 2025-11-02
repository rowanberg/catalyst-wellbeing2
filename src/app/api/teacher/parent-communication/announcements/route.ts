import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

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
      .from('class_announcements')
      .select(`
        id,
        title,
        content,
        announcement_type,
        priority,
        scheduled_for,
        expires_at,
        is_published,
        created_at,
        class:classes(id, name),
        read_status:announcement_read_status(count)
      `)
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: announcements, error } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { 
      class_id, 
      title, 
      content, 
      announcement_type = 'general',
      priority = 'normal',
      scheduled_for,
      expires_at,
      target_audience = 'all_parents',
      specific_parent_ids = [],
      is_published = true
    } = body

    // Validate required fields
    if (!class_id || !title || !content) {
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

    // Verify class belongs to teacher's school
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, school_id')
      .eq('id', class_id)
      .eq('school_id', teacher.school_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Invalid class' }, { status: 400 })
    }

    // Insert announcement
    const { data: newAnnouncement, error: insertError } = await supabase
      .from('class_announcements')
      .insert({
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        class_id,
        title,
        content,
        announcement_type,
        priority,
        scheduled_for: scheduled_for ? new Date(scheduled_for).toISOString() : null,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        target_audience,
        specific_parent_ids,
        is_published
      })
      .select(`
        id,
        title,
        content,
        announcement_type,
        priority,
        scheduled_for,
        expires_at,
        is_published,
        created_at,
        class:classes(name)
      `)
      .single()

    if (insertError) {
      console.error('Error inserting announcement:', insertError)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement: newAnnouncement }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { announcement_id, ...updates } = body

    if (!announcement_id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })
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

    // Update announcement
    const { data: updatedAnnouncement, error: updateError } = await supabase
      .from('class_announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', announcement_id)
      .eq('teacher_id', teacher.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating announcement:', updateError)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement: updatedAnnouncement })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { announcement_id, ...updates } = body

    if (!announcement_id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })
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

    // Update announcement
    const { data: updatedAnnouncement, error: updateError } = await supabase
      .from('class_announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', announcement_id)
      .eq('teacher_id', teacher.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating announcement:', updateError)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement: updatedAnnouncement })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const announcementId = searchParams.get('id')

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })
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

    // Delete announcement
    const { error: deleteError } = await supabase
      .from('class_announcements')
      .delete()
      .eq('id', announcementId)
      .eq('teacher_id', teacher.id)

    if (deleteError) {
      console.error('Error deleting announcement:', deleteError)
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
