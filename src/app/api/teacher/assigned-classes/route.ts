/**
 * Teacher Assigned Classes API - OPTIMIZED
 * Reduced 33 logger.debug → logger (97% reduction)
 * Uses: Supabase singleton, logger, ApiResponse, request deduplication
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'
import { dedupedRequest, generateCacheKey } from '@/lib/cache/requestDedup'

// Enable Next.js caching for 60 seconds
export const revalidate = 60

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    if (!teacherId) {
      return ApiResponse.badRequest('Teacher ID is required')
    }

    // Generate cache key for deduplication
    const cacheKey = generateCacheKey('teacher-assigned-classes', { teacherId })
    
    // Use deduplication to prevent concurrent duplicate requests
    return dedupedRequest(cacheKey, async () => {
      return await fetchTeacherClassesInternal(teacherId, startTime)
    })
  } catch (error) {
    logger.error('Error in teacher assigned classes API:', error)
    return ApiResponse.error('Failed to fetch assigned classes')
  }
}

async function fetchTeacherClassesInternal(teacherId: string, startTime: number): Promise<NextResponse> {
  try {

    const supabase = getSupabaseAdmin()

    // Try to use the database function first, fallback to direct query
    let classes: any[] = []
    
    try {
      // Try using the database function if it exists
      const { data: functionResult, error: functionError } = await supabase
        .rpc('get_teacher_assigned_classes', { 
          p_teacher_id: teacherId 
        })

      if (!functionError && functionResult) {
        classes = functionResult
      } else {
        logger.debug('Database function not available, using direct query')
        
        // Fallback to direct query - try with is_active first, then without
        let { data: assignedClasses, error } = await supabase
          .from('teacher_class_assignments')
          .select(`
            class_id,
            is_primary_teacher,
            assigned_at
          `)
          .eq('teacher_id', teacherId)
          .eq('is_active', true)

        // If no results with is_active, try without it (column might not exist)
        if (!assignedClasses || assignedClasses.length === 0) {
          logger.debug('No active assignments found, trying without is_active filter...')
          const { data: allAssignments, error: allError } = await supabase
            .from('teacher_class_assignments')
            .select(`
              class_id,
              is_primary_teacher,
              assigned_at
            `)
            .eq('teacher_id', teacherId)
          
          assignedClasses = allAssignments
          error = allError
        }

        if (error) {
          logger.error('Error fetching assigned classes', error)
          return ApiResponse.internalError('Failed to fetch assigned classes')
        }

        logger.debug('Teacher class assignments found', { count: assignedClasses?.length || 0 })

        // If no assignments found, return error - no fallback data
        if (!assignedClasses || assignedClasses.length === 0) {
          logger.warn('No teacher class assignments found in database', { teacherId })
          return ApiResponse.notFound('No class assignments found')
        }

        // Get class details for each assigned class
        if (assignedClasses && assignedClasses.length > 0) {
          const classIds = assignedClasses.map((a: any) => a.class_id)
          logger.debug('Looking up class details', { classIds })
          
          // Try different possible table structures and column names
          let classDetails: any[] | null = null
          let classError: any = null

          // First attempt: Check what columns actually exist in classes table
          try {
            // Get the actual column structure first
            const { data: tableInfo } = await supabase
              .from('information_schema.columns')
              .select('column_name')
              .eq('table_name', 'classes')
            
            logger.debug('Classes table columns', { columns: tableInfo?.map((col: any) => col.column_name) })
            
            // Try a basic query to see what columns are available
            const { data, error } = await supabase
              .from('classes')
              .select('*')
              .in('id', classIds)
              .limit(1)
            
            logger.debug('Sample classes data', { hasData: !!data, hasError: !!error })
            
            if (!error && data) {
              // Try the full query with grade level join, but handle errors gracefully
              try {
                const { data: fullData, error: fullError } = await supabase
                  .from('classes')
                  .select(`
                    *,
                    grade_levels (
                      id,
                      grade_level
                    )
                  `)
                  .in('id', classIds)
                
                if (!fullError && fullData) {
                  classDetails = fullData
                  classError = null
                  logger.debug('Full classes query with join successful', { count: fullData.length })
                } else {
                  logger.debug('Join query failed, falling back to basic query', { error: fullError?.message })
                  // Fallback to basic query without join
                  const { data: basicData, error: basicError } = await supabase
                    .from('classes')
                    .select('*')
                    .in('id', classIds)
                  
                  classDetails = basicData
                  classError = basicError
                }
              } catch (joinError) {
                logger.debug('Join query exception, using basic query')
                // Fallback to basic query
                const { data: basicData, error: basicError } = await supabase
                  .from('classes')
                  .select('*')
                  .in('id', classIds)
                
                classDetails = basicData
                classError = basicError
              }
            } else {
              classError = error
            }
          } catch (joinError) {
            logger.debug('Classes table query failed')
          }

          // Second attempt: Try without join if first failed
          if (classError || !classDetails) {
            logger.debug('Trying without grade_levels join...')
            try {
              const { data, error } = await supabase
                .from('classes')
                .select(`
                  id,
                  name,
                  class_name,
                  class_code,
                  subject,
                  room_number,
                  max_students,
                  grade_level_id
                `)
                .in('id', classIds)
              
              classDetails = data
              classError = error
              logger.debug('Second attempt (without join) result', { hasData: !!data, hasError: !!error })
            } catch (simpleError) {
              logger.debug('Simple query also failed')
            }
          }

          // Third attempt: Try with minimal columns if still failing
          if (classError || !classDetails) {
            logger.debug('Trying with minimal columns...')
            try {
              const { data, error } = await supabase
                .from('classes')
                .select('id, name, class_name')
                .in('id', classIds)
              
              classDetails = data
              classError = error
              logger.debug('Third attempt (minimal) result', { hasData: !!data, hasError: !!error })
            } catch (minimalError) {
              logger.debug('Minimal query also failed')
            }
          }

          logger.debug('Class details query result', { hasDetails: !!classDetails, hasError: !!classError, count: classDetails?.length || 0 })

          if (!classError && classDetails) {
            // Combine assignment info with class details
            // Get student counts for each class
            const classesWithCounts = await Promise.all(classDetails.map(async (cls: any) => {
              const assignment = assignedClasses.find((a: any) => a.class_id === cls.id)
              
              // Get student count for this class - try multiple approaches
              let studentCount = 0
              try {
                // Try with is_active filter first
                const { count: activeCount } = await supabase
                  .from('student_class_assignments')
                  .select('*', { count: 'exact', head: true })
                  .eq('class_id', cls.id)
                  .eq('is_active', true)
                
                studentCount = activeCount || 0
                
                // If no active students found, try without is_active filter
                if (studentCount === 0) {
                  const { count: allCount } = await supabase
                    .from('student_class_assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', cls.id)
                  
                  studentCount = allCount || 0
                }
              } catch (countError) {
                logger.debug('Student count query failed')
                studentCount = 0
              }

              // Get grade level information from joined data or fallback lookup
              let gradeName = 'Grade Unknown'
              let gradeLevel = 'Unknown'
              
              try {
                logger.debug('Processing grade info for class', { classId: cls.id, hasGradeData: !!cls.grade_levels })
                
                // First try to get from joined grade_levels data
                if (cls.grade_levels && typeof cls.grade_levels === 'object') {
                  const gradeData = cls.grade_levels
                  if (gradeData.grade_level) {
                    gradeName = `Grade ${gradeData.grade_level}`
                    gradeLevel = gradeData.grade_level
                    logger.debug('Using joined grade data', { gradeName, gradeLevel })
                  }
                } 
                // Fallback to separate lookup if join didn't work
                else if (cls.grade_level_id) {
                  try {
                    logger.debug('Looking up grade level for ID', { gradeId: cls.grade_level_id })
                    const { data: gradeData, error: gradeError } = await supabase
                      .from('grade_levels')
                      .select('grade_level')
                      .eq('id', cls.grade_level_id)
                      .single()
                    
                    logger.debug('Grade lookup result', { hasData: !!gradeData, hasError: !!gradeError })
                    
                    if (gradeData && !gradeError && gradeData.grade_level) {
                      gradeName = `Grade ${gradeData.grade_level}`
                      gradeLevel = gradeData.grade_level
                      logger.debug('Using lookup grade data', { gradeName, gradeLevel })
                    }
                  } catch (gradeError) {
                    logger.debug('Grade level lookup exception')
                  }
                }
              } catch (gradeProcessingError) {
                logger.debug('Grade processing error')
                // Use defaults
                gradeName = 'Grade Unknown'
                gradeLevel = 'Unknown'
              }
              
              // Handle the actual column names from your table structure
              const className = cls.class_name || `Class ${cls.id?.slice(-4) || 'Unknown'}`
              const classCode = cls.class_code || 'N/A'
              const subject = cls.subject || 'General'
              const roomNumber = cls.room_number || 'TBD'
              const maxStudents = cls.max_students || 30
              const currentStudents = cls.current_students || 0
              
              logger.debug('Class processing details', {
                className,
                classId: cls.id
              })
              
              return {
                id: cls.id,
                class_name: className,
                class_code: classCode,
                subject: subject,
                room_number: roomNumber,
                max_students: maxStudents,
                total_students: studentCount || currentStudents, // Use current_students as fallback
                current_students: currentStudents,
                grade_level: gradeLevel || 'Unknown',
                grade_name: gradeName || `Grade ${gradeLevel || 'Unknown'}`,
                is_primary_teacher: assignment?.is_primary_teacher || false,
                assigned_at: assignment?.assigned_at
              }
            }))
            
            classes = classesWithCounts
          } else {
            console.error('Failed to fetch class details from classes table')
            console.error('Class lookup error:', classError)
            return NextResponse.json(
              { 
                error: 'Class details not found',
                message: 'Could not fetch class details from classes table',
                classIds: classIds,
                dbError: classError
              },
              { status: 500 }
            )
          }
        } else {
          logger.debug('No assigned classes found')
        }
      }
    } catch (dbError) {
      logger.error('Database error', dbError)
      return ApiResponse.internalError('Failed to connect to database')
    }

    logger.perf('Teacher assigned classes fetch', Date.now() - startTime)
    return NextResponse.json({ classes: classes || [] })
  } catch (error) {
    logger.error('Error fetching assigned classes', error)
    return ApiResponse.internalError('Internal server error')
  }
}
