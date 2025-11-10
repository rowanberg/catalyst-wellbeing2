import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { studentId, category, message, isPublic, templateId } = await request.json()

    if (!studentId || !message?.trim()) {
      return NextResponse.json({ error: 'Student ID and message are required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long. Maximum 500 characters.' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Get student to verify they exist and are in the same school
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, school_id, first_name, last_name, xp, gems')
      .eq('id', studentId)
      .eq('role', 'student')
      .eq('school_id', profile.school_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found or not accessible' }, { status: 404 })
    }

    // Get badge for category if using template
    let badge = null
    if (templateId) {
      const { data: template } = await supabase
        .from('shout_out_templates')
        .select('badge')
        .eq('id', templateId)
        .single()
      
      badge = template?.badge
    }

    // Create the shout-out
    const { data: shoutOut, error: createError } = await supabase
      .from('student_shout_outs')
      .insert({
        student_id: studentId,
        teacher_id: profile.id,
        school_id: profile.school_id,
        category: category || 'effort',
        message: message.trim(),
        is_public: isPublic !== false, // Default to true
        badge,
        template_id: templateId
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating shout-out:', createError)
      return NextResponse.json({ error: 'Failed to create shout-out' }, { status: 500 })
    }

    // Award XP to student for receiving recognition
    const xpReward = 50
    await supabase
      .from('profiles')
      .update({ 
        xp: student.xp + xpReward,
        gems: student.gems + 10
      })
      .eq('id', studentId)

    // Create notification for student (optional - won't fail if table doesn't exist)
    try {
      await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          type: 'shout_out_received',
          title: 'You received a shout-out! 🌟',
          message: `${profile.first_name} ${profile.last_name} recognized you: "${message.trim()}"`,
          priority: 'medium',
          school_id: profile.school_id,
          xp_reward: xpReward
        })
    } catch (notifError) {
      // Notification creation is optional, continue if it fails
      console.log('Notification not created (table may not exist)')
    }

    // If public, create announcement for class (optional)
    if (isPublic) {
      try {
        await supabase
          .from('class_announcements')
          .insert({
            school_id: profile.school_id,
            teacher_id: profile.id,
            title: `🌟 Shout-out for ${student.first_name}!`,
            content: `${student.first_name} ${student.last_name} was recognized for ${category}: "${message.trim()}"`,
            type: 'recognition',
            target_audience: 'class',
            is_pinned: false
          })
      } catch (announcementError) {
        // Announcement creation is optional, continue if it fails
        console.log('Announcement not created (table may not exist)')
      }
    }

    // Note: student_recognition_stats table not implemented yet
    // Will be added in future update for analytics

    return NextResponse.json({ 
      message: 'Shout-out sent successfully',
      shoutOutId: shoutOut.id,
      xpAwarded: xpReward
    })

  } catch (error: any) {
    console.error('Unexpected error in send shout-out API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
