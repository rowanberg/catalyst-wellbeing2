import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple content moderation function
function moderateContent(content: string): { isAppropriate: boolean; reason?: string } {
  const inappropriateWords = [
    'hate', 'stupid', 'dumb', 'idiot', 'kill', 'die', 'hurt', 'violence',
    'bullying', 'mean', 'ugly', 'loser', 'freak', 'weird'
  ]
  
  const lowerContent = content.toLowerCase()
  
  for (const word of inappropriateWords) {
    if (lowerContent.includes(word)) {
      return { isAppropriate: false, reason: `Contains inappropriate language: "${word}"` }
    }
  }
  
  // Check for excessive caps (more than 50% uppercase)
  const upperCount = (content.match(/[A-Z]/g) || []).length
  if (upperCount > content.length * 0.5 && content.length > 10) {
    return { isAppropriate: false, reason: 'Excessive use of capital letters' }
  }
  
  // Check for repeated characters (like "hellooooo")
  if (/(.)\1{4,}/.test(content)) {
    return { isAppropriate: false, reason: 'Excessive repeated characters' }
  }
  
  return { isAppropriate: true }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { conversationId, content } = await request.json()

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and message content required' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long. Maximum 500 characters.' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is part of this conversation and it's active
    const { data: conversation, error: convError } = await supabase
      .from('office_hours_conversations')
      .select('student_id, teacher_id, status, school_id')
      .eq('id', conversationId)
      .eq('student_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    if (conversation.status !== 'active') {
      return NextResponse.json({ error: 'Conversation is not active' }, { status: 400 })
    }

    // Check if teacher is currently available
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
    const currentTime = now.toTimeString().slice(0, 5)

    const { data: officeHours, error: hoursError } = await supabase
      .from('teacher_office_hours')
      .select('*')
      .eq('teacher_id', conversation.teacher_id)
      .eq('day_of_week', currentDay)
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)

    if (hoursError) {
      console.error('Error checking office hours:', hoursError)
    }

    if (!officeHours || officeHours.length === 0) {
      return NextResponse.json({ 
        error: 'Messages can only be sent during teacher office hours' 
      }, { status: 400 })
    }

    // Moderate content
    const moderation = moderateContent(content.trim())
    
    if (!moderation.isAppropriate) {
      // Log the inappropriate message attempt
      await supabase
        .from('office_hours_moderation_log')
        .insert({
          conversation_id: conversationId,
          student_id: user.id,
          original_content: content.trim(),
          moderation_reason: moderation.reason,
          school_id: conversation.school_id
        })

      return NextResponse.json({ 
        error: `Message blocked: ${moderation.reason}. Please revise your message.` 
      }, { status: 400 })
    }

    // Check rate limiting - max 10 messages per 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const { data: recentMessages, error: rateLimitError } = await supabase
      .from('office_hours_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id)
      .gte('created_at', fiveMinutesAgo.toISOString())

    if (rateLimitError) {
      console.error('Error checking rate limit:', rateLimitError)
    }

    if (recentMessages && recentMessages.length >= 10) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please wait before sending more messages.' 
      }, { status: 429 })
    }

    // Send the message
    const { data: message, error: messageError } = await supabase
      .from('office_hours_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: 'student',
        content: content.trim(),
        is_moderated: true,
        school_id: conversation.school_id
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation timestamp
    await supabase
      .from('office_hours_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Notify teacher (in a real app, this would trigger a real-time notification)
    await supabase
      .from('office_hours_notifications')
      .insert({
        recipient_id: conversation.teacher_id,
        type: 'new_message',
        conversation_id: conversationId,
        message: `New message from student in office hours`,
        school_id: conversation.school_id
      })

    return NextResponse.json({ 
      message: 'Message sent successfully',
      messageId: message.id
    })

  } catch (error) {
    console.error('Unexpected error in send message API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
