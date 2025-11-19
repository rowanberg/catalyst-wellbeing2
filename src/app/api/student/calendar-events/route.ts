import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

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
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      logger.warn('Unauthorized calendar access attempt', { reason: auth.error })
      
      if (auth.status === 401) {
        return ApiResponse.unauthorized('Authentication required')
      }
      
      if (auth.status === 403) {
        return ApiResponse.forbidden('Access denied. Students only.')
      }
      
      return ApiResponse.error(auth.error || 'Authentication failed')
    }
    
    const { supabase, userId, schoolId } = auth
    
    if (!schoolId) {
      logger.error('Student has no school_id', { userId })
      return ApiResponse.error('Student not assigned to a school')
    }
    
    logger.info('Student calendar access', { 
      userId,
      schoolId 
    })

    // Fetch events from academic_schedule
    // RLS policies ensure users can only see their school's data
    logger.info('Fetching student calendar events', {
      schoolId,
      userId,
      role: auth.role
    })

    const { data: events, error } = await supabase
      .from('academic_schedule')
      .select('id, title, description, event_type, start_date, end_date, all_day, subject, location, meeting_link, priority, target_audience')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .overlaps('target_audience', ['student']) // Check if array contains 'student'
      .order('start_date', { ascending: true })

    if (error) {
      logger.error('Error fetching student calendar events', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
        schoolId
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
      userId,
      schoolId
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
