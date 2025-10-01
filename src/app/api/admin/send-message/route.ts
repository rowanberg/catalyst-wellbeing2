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

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientId, subject, content, messageType = 'management' } = body

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipientId, subject, content' 
      }, { status: 400 })
    }

    // Verify recipient exists and is in the same school
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, school_id')
      .eq('id', recipientId)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    if (recipient.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Cannot send messages across schools' }, { status: 403 })
    }

    // Insert management message
    const { data: message, error: messageError } = await supabase
      .from('management_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject: subject,
        content: content,
        message_type: messageType,
        sender_name: `${profile.first_name} ${profile.last_name}`,
        sender_role: profile.role,
        school_id: profile.school_id,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message
    })

  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
