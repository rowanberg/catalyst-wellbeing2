import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let conversations: any[] = []

    if (profile.role === 'parent') {
      // Get conversations for parent
      const { data, error } = await supabase
        .from('family_conversations')
        .select(`
          id,
          child_id,
          created_at,
          updated_at,
          profiles!family_conversations_child_id_fkey (
            id,
            first_name,
            last_name,
            grade_level,
            class_name
          )
        `)
        .eq('parent_id', profile.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching parent conversations:', error)
        return NextResponse.json({ error: 'Error fetching conversations' }, { status: 500 })
      }

      conversations = data?.map((conv: any) => ({
        id: conv.id,
        participantId: conv.child_id,
        participantName: `${conv.profiles.first_name} ${conv.profiles.last_name}`,
        participantRole: 'student',
        participantGrade: conv.profiles.grade_level ? `Grade ${conv.profiles.grade_level}` : '',
        participantClass: conv.profiles.class_name || '',
        lastUpdated: conv.updated_at,
        unreadCount: 0 // TODO: Calculate actual unread count
      })) || []

    } else if (profile.role === 'student') {
      // Get conversations for student
      const { data, error } = await supabase
        .from('family_conversations')
        .select(`
          id,
          parent_id,
          created_at,
          updated_at,
          profiles!family_conversations_parent_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('child_id', profile.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching student conversations:', error)
        return NextResponse.json({ error: 'Error fetching conversations' }, { status: 500 })
      }

      conversations = data?.map((conv: any) => ({
        id: conv.id,
        participantId: conv.parent_id,
        participantName: `${conv.profiles.first_name} ${conv.profiles.last_name}`,
        participantRole: 'parent',
        participantGrade: '',
        participantClass: '',
        lastUpdated: conv.updated_at,
        unreadCount: 0 // TODO: Calculate actual unread count
      })) || []
    }

    return NextResponse.json({ conversations: conversations as any[] })

  } catch (error) {
    console.error('Error in family conversations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { participantId } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let parentId, childId

    if (profile.role === 'parent') {
      parentId = profile.id
      childId = participantId
    } else if (profile.role === 'student') {
      parentId = participantId
      childId = profile.id
    } else {
      return NextResponse.json({ error: 'Invalid role for family messaging' }, { status: 403 })
    }

    // Verify parent-child relationship exists
    const { data: relationship, error: relationshipError } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .single()

    if (relationshipError || !relationship) {
      return NextResponse.json({ error: 'No parent-child relationship found' }, { status: 403 })
    }

    // Create or get existing conversation
    const { data: existingConv, error: existingError } = await supabase
      .from('family_conversations')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .single()

    if (existingConv) {
      return NextResponse.json({ conversationId: existingConv.id })
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('family_conversations')
      .insert({ parent_id: parentId, child_id: childId })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError)
      return NextResponse.json({ error: 'Error creating conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversationId: newConv.id })

  } catch (error) {
    console.error('Error in create family conversation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
