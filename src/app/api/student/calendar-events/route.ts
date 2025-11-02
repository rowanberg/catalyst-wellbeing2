import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Student Calendar Events API
 * Securely fetches academic schedule events for authenticated students
 * - Only returns events from student's school
 * - Only returns events targeted to students
 * - Uses RLS for security
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.warn('Unauthorized calendar access attempt')
      return ApiResponse.unauthorized('Authentication required')
    }

    // Get user's profile to verify role and get school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      logger.error('Profile not found for user', { userId: user.id })
      return ApiResponse.error('Profile not found')
    }

    // Verify user is a student
    if (profile.role !== 'student') {
      logger.warn('Non-student attempted to access student calendar', { 
        userId: user.id,
        role: profile.role 
      })
      return ApiResponse.forbidden('Access denied. Students only.')
    }

    if (!profile.school_id) {
      logger.error('Student has no school_id', { userId: user.id })
      return ApiResponse.error('Student not assigned to a school')
    }

    logger.info('Student calendar access', { 
      userId: user.id,
      schoolId: profile.school_id 
    })

    // Fetch events from academic_schedule
    // RLS policies ensure users can only see their school's data
    logger.info('Fetching student calendar events', {
      schoolId: profile.school_id,
      userId: user.id,
      role: profile.role
    })

    const { data: events, error } = await supabase
      .from('academic_schedule')
      .select('id, title, description, event_type, start_date, end_date, all_day, subject, location, meeting_link, priority, target_audience')
      .eq('school_id', profile.school_id)
      .eq('status', 'active')
      .overlaps('target_audience', ['student']) // Check if array contains 'student'
      .order('start_date', { ascending: true })

    if (error) {
      logger.error('Error fetching student calendar events', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: user.id,
        schoolId: profile.school_id
      })
      return ApiResponse.error(`Failed to fetch calendar events: ${error.message}`)
    }

    // Transform to match frontend interface
    const transformedEvents = (events || []).map(event => ({
      id: event.id,
      title: event.title,
      date: event.start_date, // Map start_date to date
      type: event.event_type, // Map event_type to type
      description: event.description,
      subject: event.subject
    }))

    logger.info('Student calendar events fetched', { 
      count: transformedEvents.length,
      events: transformedEvents.map(e => ({ id: e.id, title: e.title, date: e.date, type: e.type })),
      userId: user.id,
      schoolId: profile.school_id
    })

    return ApiResponse.success({
      events: transformedEvents,
      count: transformedEvents.length
    })
  } catch (error: any) {
    logger.error('Error in student calendar API', { 
      error: error.message,
      stack: error.stack 
    })
    return ApiResponse.error('Internal server error')
  }
}
