import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

/**
 * Student Attendance History API
 * Securely fetches attendance records for authenticated students
 * - Only returns attendance for the authenticated student
 * - Uses RLS for security
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      logger.warn('Unauthorized attendance access attempt', { reason: auth.error })
      
      if (auth.status === 401) {
        return ApiResponse.unauthorized('Authentication required')
      }
      
      if (auth.status === 403) {
        return ApiResponse.forbidden('Access denied. Students only.')
      }
      
      return ApiResponse.error(auth.error || 'Authentication failed')
    }
    
    const { supabase, userId, schoolId } = auth
    logger.info('Student attendance access', { userId })

    // Fetch attendance records for this student only
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', userId)
      .eq('school_id', schoolId)
      .order('date', { ascending: false })
      .limit(90) // Last 90 days

    if (error) {
      logger.error('Error fetching student attendance', { 
        error: error.message,
        userId
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
      userId
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
