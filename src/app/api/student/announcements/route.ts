import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50) // Max 50 items
    const offset = (page - 1) * limit
    
    // Enhanced authentication with better error handling
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

    // Get the current user with retry logic
    let user: { id: string; [key: string]: any } | null = null
    let authError: any = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error('Auth error:', error)
      authError = error
    }
    
    if (authError || !user) {
      console.log('Authentication failed:', { authError, hasUser: !!user })
      return NextResponse.json({ 
        error: 'Authentication required',
        details: (authError as any)?.message || 'No user session found'
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

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

    // Optimized query with JOIN to get author info in single query
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
        expires_at,
        created_by,
        profiles:created_by (
          first_name,
          last_name
        )
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .in('target_audience', ['all', 'students'])
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
      author: announcement.author_name || 
              ((announcement as any).profiles ? `${(announcement as any).profiles.first_name} ${(announcement as any).profiles.last_name}` : 'School Admin'),
      created_at: announcement.created_at,
      expires_at: announcement.expires_at
    }))

    // Add pagination metadata
    const responseData = {
      data: transformedAnnouncements,
      pagination: {
        page,
        limit,
        total: transformedAnnouncements.length,
        hasMore: transformedAnnouncements.length === limit
      }
    }

    // Add caching headers for performance
    const response = NextResponse.json(responseData)
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600') // 5min cache, 10min stale
    response.headers.set('CDN-Cache-Control', 'max-age=300')
    response.headers.set('Vary', 'Cookie')
    
    return response

  } catch (error) {
    console.error('Student announcements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
