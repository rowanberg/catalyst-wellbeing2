import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id: eventId } = await params

    const {
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
      send_notification,
      status
    } = body

    // Update event
    const { data: event, error } = await supabase
      .from('academic_schedule')
      .update({
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
        send_notification,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating academic schedule event', { error, eventId })
      return ApiResponse.error('Failed to update event')
    }

    logger.info('Academic schedule event updated', { eventId })

    return ApiResponse.success({ event })
  } catch (error) {
    logger.error('Error in academic schedule PUT', { error })
    return ApiResponse.error('Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin()
    const { id: eventId } = await params

    // Delete event
    const { error } = await supabase
      .from('academic_schedule')
      .delete()
      .eq('id', eventId)

    if (error) {
      logger.error('Error deleting academic schedule event', { error, eventId })
      return ApiResponse.error('Failed to delete event')
    }

    logger.info('Academic schedule event deleted', { eventId })

    return ApiResponse.success({ message: 'Event deleted successfully' })
  } catch (error) {
    logger.error('Error in academic schedule DELETE', { error })
    return ApiResponse.error('Internal server error')
  }
}
