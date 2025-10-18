import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { apiCache, createCacheKey } from '@/lib/utils/apiCache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const schoolCode = searchParams.get('school_code')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const audience = searchParams.get('audience')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    let finalSchoolId = schoolId

    // If no school_id but school_code is provided, look up the school_id
    if (!schoolId && schoolCode) {
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('id')
        .eq('school_code', schoolCode)
        .single()

      if (schoolError || !school) {
        return NextResponse.json({ error: 'School not found with provided school code' }, { status: 404 })
      }
      
      finalSchoolId = school.id
    }

    if (!finalSchoolId) {
      return NextResponse.json({ error: 'School ID or school code required' }, { status: 400 })
    }

    // Check cache first for announcements
    const cacheKey = createCacheKey('announcements', { 
      schoolId: finalSchoolId, 
      status, 
      type, 
      audience,
      limit 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [ANNOUNCEMENTS-API] Returning cached announcements for school:', finalSchoolId)
      return NextResponse.json(cachedData)
    }

    let query = supabaseAdmin
      .from('school_announcements')
      .select('*')
      .eq('school_id', finalSchoolId)

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (audience) {
      query = query.eq('target_audience', audience)
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit)
    }

    const { data: announcements, error } = await query.order('created_at', { ascending: false })

    console.log('Announcements query result:', { announcements, error, schoolId: finalSchoolId, audience })

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements', details: error.message }, { status: 500 })
    }

    // Transform data to include author name and filter active announcements
    const transformedAnnouncements = announcements
      ?.filter(announcement => {
        // Filter active announcements (handle missing is_active column)
        const isActive = announcement.is_active !== undefined ? announcement.is_active : true;
        const notExpired = !announcement.expires_at || new Date(announcement.expires_at) > new Date();
        console.log('Filtering announcement:', { 
          id: announcement.id, 
          title: announcement.title,
          isActive, 
          notExpired, 
          expires_at: announcement.expires_at,
          is_active: announcement.is_active 
        });
        return isActive && notExpired;
      })
      ?.map(announcement => ({
        ...announcement,
        author: announcement.author_name || 'Admin'
      }))

    const responseData = { announcements: transformedAnnouncements || [] }
    
    // Cache the response for 5 minutes to reduce database load
    apiCache.set(cacheKey, responseData, 5)
    console.log('✅ [ANNOUNCEMENTS-API] Announcements cached for school:', finalSchoolId)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Admin announcements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { 
      title, 
      content, 
      priority, 
      target_audience,
      expires_at
    } = await request.json()

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Create announcement (handle missing columns gracefully)
    const announcementData: any = {
      title,
      content,
      priority: priority || 'medium',
      school_id: profile.school_id,
      author_id: user.id,
      author_name: `${profile.first_name} ${profile.last_name}`,
      expires_at
    };

    // Add optional fields if they exist in the table
    if (target_audience) {
      announcementData.target_audience = target_audience;
    }

    // First check if table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('school_announcements')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      console.error('Table school_announcements does not exist')
      return NextResponse.json({ 
        error: 'Database table not found. Please run the schema setup first.',
        details: 'school_announcements table does not exist'
      }, { status: 500 })
    }

    const { data: announcement, error: insertError } = await supabaseAdmin
      .from('school_announcements')
      .insert(announcementData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating announcement:', insertError)
      console.error('Announcement data:', announcementData)
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        details: insertError.details
      })
      return NextResponse.json({ 
        error: 'Failed to create announcement', 
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 })
    }

    // Add author name to response
    const responseAnnouncement = {
      ...announcement,
      author: `${profile.first_name} ${profile.last_name}`
    }

    return NextResponse.json({ announcement: responseAnnouncement })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })
    }

    // Verify announcement belongs to admin's school
    const { data: existingAnnouncement, error: fetchError } = await supabaseAdmin
      .from('school_announcements')
      .select('school_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (existingAnnouncement.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update announcement
    const { data: announcement, error: updateError } = await supabaseAdmin
      .from('school_announcements')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating announcement:', updateError)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Update announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })
    }

    // Verify announcement belongs to admin's school
    const { data: existingAnnouncement, error: fetchError } = await supabaseAdmin
      .from('school_announcements')
      .select('school_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (existingAnnouncement.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete announcement
    const { error: deleteError } = await supabaseAdmin
      .from('school_announcements')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting announcement:', deleteError)
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
