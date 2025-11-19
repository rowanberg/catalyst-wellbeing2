import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50) // Max 50 items
    const offset = (page - 1) * limit

    // Shared student authentication (cookie or bearer) with caching
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ 
          error: 'Authentication required',
          details: auth.error || 'No user session found'
        }, { status: 401 })
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 })
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }
    
    const { userId, schoolId } = auth
    
    console.log('✅ User authenticated:', userId)

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
      .eq('school_id', schoolId)
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
