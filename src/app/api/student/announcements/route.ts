import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get student profile to verify role and get school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Fetch active announcements for the student's school
    const { data: announcements, error: announcementsError } = await supabaseAdmin
      .from('school_announcements')
      .select(`
        id,
        title,
        content,
        priority,
        author_name,
        target_audience,
        created_at,
        expires_at
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .in('target_audience', ['all', 'students'])
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (announcementsError) {
      console.error('Error fetching student announcements:', announcementsError)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    // Transform announcements to match expected format
    const transformedAnnouncements = (announcements || []).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: 'general', // Default type since school_announcements doesn't have type field
      priority: announcement.priority || 'medium',
      author: announcement.author_name || 'School Admin',
      created_at: announcement.created_at,
      expires_at: announcement.expires_at
    }))

    return NextResponse.json(transformedAnnouncements)

  } catch (error) {
    console.error('Student announcements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
