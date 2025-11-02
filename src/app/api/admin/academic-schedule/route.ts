import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')

    logger.info('Academic schedule GET request', { schoolId })

    if (!schoolId) {
      logger.warn('Missing school_id parameter')
      return ApiResponse.badRequest('School ID is required')
    }

    // Fetch academic schedule events for the school
    const { data: events, error } = await supabase
      .from('academic_schedule')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('start_date', { ascending: true })

    if (error) {
      logger.error('Error fetching academic schedule', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        schoolId 
      })
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return ApiResponse.error('Database table not found. Please run migrations first.', 500)
      }
      
      return ApiResponse.error(`Failed to fetch academic schedule: ${error.message}`)
    }

    logger.info('Academic schedule fetched successfully', { 
      count: events?.length || 0,
      schoolId 
    })

    return ApiResponse.success({
      events: events || [],
      count: events?.length || 0
    })
  } catch (error: any) {
    logger.error('Error in academic schedule GET', { 
      error: error.message,
      stack: error.stack 
    })
    return ApiResponse.error('Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const {
      school_id,
      title,
      description,
      event_type,
      start_date,
      end_date,
      all_day,
      target_audience,
      grade_levels,
      sections,
      subject,
      academic_year,
      term,
      priority,
      location,
      meeting_link,
      send_notification
    } = body

    // Validation
    if (!school_id || !title || !event_type || !start_date || !academic_year) {
      return ApiResponse.badRequest('Missing required fields')
    }

    // Insert event
    const { data: event, error } = await supabase
      .from('academic_schedule')
      .insert({
        school_id,
        title,
        description,
        event_type,
        start_date,
        end_date,
        all_day: all_day ?? true,
        target_audience: target_audience || ['student', 'teacher', 'parent'],
        grade_levels,
        sections,
        subject,
        academic_year,
        term,
        status: 'active',
        priority: priority || 'normal',
        location,
        meeting_link,
        send_notification: send_notification ?? true,
        notification_sent: false
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating academic schedule event', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        schoolId: school_id
      })
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return ApiResponse.error('Database table not found. Please run migrations first.', 500)
      }
      
      return ApiResponse.error(`Failed to create event: ${error.message}`)
    }

    logger.info('Academic schedule event created', { eventId: event.id })

    return ApiResponse.success({ event })
  } catch (error) {
    logger.error('Error in academic schedule POST', { error })
    return ApiResponse.error('Internal server error')
  }
}
