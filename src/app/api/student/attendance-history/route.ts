import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Student Attendance History API
 * Securely fetches attendance records for authenticated students
 * - Only returns attendance for the authenticated student
 * - Uses RLS for security
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.warn('Unauthorized attendance access attempt')
      return ApiResponse.unauthorized('Authentication required')
    }

    // Get user's profile
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
      logger.warn('Non-student attempted to access attendance', { 
        userId: user.id,
        role: profile.role 
      })
      return ApiResponse.forbidden('Access denied. Students only.')
    }

    logger.info('Student attendance access', { userId: user.id })

    // Fetch attendance records for this student only
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', user.id)
      .eq('school_id', profile.school_id)
      .order('date', { ascending: false })
      .limit(90) // Last 90 days

    if (error) {
      logger.error('Error fetching student attendance', { 
        error: error.message,
        userId: user.id
      })
      return ApiResponse.error(`Failed to fetch attendance: ${error.message}`)
    }

    // Transform to expected format
    const records = (attendance || []).map(record => ({
      date: record.date,
      status: record.status as 'present' | 'absent' | 'late' | 'excused'
    }))

    logger.info('Student attendance fetched', { 
      count: records.length,
      userId: user.id
    })

    return ApiResponse.success({
      attendance: records,
      count: records.length
    })
  } catch (error: any) {
    logger.error('Error in student attendance API', { 
      error: error.message
    })
    return ApiResponse.error('Internal server error')
  }
}
