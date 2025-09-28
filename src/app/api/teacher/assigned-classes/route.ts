import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    if (!teacherId) {
      return NextResponse.json(
        { message: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Try to use the database function first, fallback to direct query
    let classes = []
    
    try {
      // Try using the database function if it exists
      const { data: functionResult, error: functionError } = await supabaseAdmin
        .rpc('get_teacher_assigned_classes', { 
          p_teacher_id: teacherId 
        })

      if (!functionError && functionResult) {
        classes = functionResult
      } else {
        console.log('Database function not available, using direct query')
        
        // Fallback to direct query - try with is_active first, then without
        let { data: assignedClasses, error } = await supabaseAdmin
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
          console.log('No active assignments found, trying without is_active filter...')
          const { data: allAssignments, error: allError } = await supabaseAdmin
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
          console.error('Error fetching assigned classes:', error)
          return NextResponse.json(
            { message: 'Failed to fetch assigned classes' },
            { status: 500 }
          )
        }

        console.log('Teacher class assignments found:', assignedClasses)
        console.log('Number of assignments:', assignedClasses?.length || 0)

        // If no assignments found, return error - no fallback data
        if (!assignedClasses || assignedClasses.length === 0) {
          console.error('No teacher class assignments found in database')
          return NextResponse.json(
            { 
              error: 'No class assignments found',
              message: 'Teacher has no class assignments in teacher_class_assignments table',
              teacherId: teacherId
            },
            { status: 404 }
          )
        }

        // Get class details for each assigned class
        if (assignedClasses && assignedClasses.length > 0) {
          const classIds = assignedClasses.map(a => a.class_id)
          console.log('Looking up class details for IDs:', classIds)
          
          // Try different possible table structures and column names
          let classDetails = null
          let classError = null

          // First attempt: Check what columns actually exist in classes table
          try {
            // Get the actual column structure first
            const { data: tableInfo } = await supabaseAdmin
              .from('information_schema.columns')
              .select('column_name')
              .eq('table_name', 'classes')
            
            console.log('Classes table columns:', tableInfo?.map(col => col.column_name))
            
            // Try a basic query to see what columns are available
            const { data, error } = await supabaseAdmin
              .from('classes')
              .select('*')
              .in('id', classIds)
              .limit(1)
            
            console.log('Sample classes data:', data)
            console.log('Classes query error:', error)
            
            if (!error && data) {
              // Try the full query with grade level join, but handle errors gracefully
              try {
                const { data: fullData, error: fullError } = await supabaseAdmin
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
                  console.log('Full classes query with join successful:', fullData.length, 'classes')
                } else {
                  console.log('Join query failed, falling back to basic query:', fullError)
                  // Fallback to basic query without join
                  const { data: basicData, error: basicError } = await supabaseAdmin
                    .from('classes')
                    .select('*')
                    .in('id', classIds)
                  
                  classDetails = basicData
                  classError = basicError
                }
              } catch (joinError) {
                console.log('Join query exception, using basic query:', joinError)
                // Fallback to basic query
                const { data: basicData, error: basicError } = await supabaseAdmin
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
            console.log('Classes table query failed:', joinError)
          }

          // Second attempt: Try without join if first failed
          if (classError || !classDetails) {
            console.log('Trying without grade_levels join...')
            try {
              const { data, error } = await supabaseAdmin
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
              console.log('Second attempt (without join) result:', { data, error })
            } catch (simpleError) {
              console.log('Simple query also failed:', simpleError)
            }
          }

          // Third attempt: Try with minimal columns if still failing
          if (classError || !classDetails) {
            console.log('Trying with minimal columns...')
            try {
              const { data, error } = await supabaseAdmin
                .from('classes')
                .select('id, name, class_name')
                .in('id', classIds)
              
              classDetails = data
              classError = error
              console.log('Third attempt (minimal) result:', { data, error })
            } catch (minimalError) {
              console.log('Minimal query also failed:', minimalError)
            }
          }

          console.log('Class details query result:', { classDetails, classError })
          console.log('Number of class details found:', classDetails?.length || 0)

          if (!classError && classDetails) {
            // Combine assignment info with class details
            // Get student counts for each class
            const classesWithCounts = await Promise.all(classDetails.map(async (cls: any) => {
              const assignment = assignedClasses.find(a => a.class_id === cls.id)
              
              // Get student count for this class - try multiple approaches
              let studentCount = 0
              try {
                // Try with is_active filter first
                const { count: activeCount } = await supabaseAdmin
                  .from('student_class_assignments')
                  .select('*', { count: 'exact', head: true })
                  .eq('class_id', cls.id)
                  .eq('is_active', true)
                
                studentCount = activeCount || 0
                
                // If no active students found, try without is_active filter
                if (studentCount === 0) {
                  const { count: allCount } = await supabaseAdmin
                    .from('student_class_assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', cls.id)
                  
                  studentCount = allCount || 0
                }
              } catch (countError) {
                console.log('Student count query failed:', countError)
                studentCount = 0
              }

              // Get grade level information from joined data or fallback lookup
              let gradeName = 'Grade Unknown'
              let gradeLevel = 'Unknown'
              
              try {
                console.log('Processing grade info for class:', cls.id, 'grade_levels data:', cls.grade_levels)
                
                // First try to get from joined grade_levels data
                if (cls.grade_levels && typeof cls.grade_levels === 'object') {
                  const gradeData = cls.grade_levels
                  if (gradeData.grade_level) {
                    gradeName = `Grade ${gradeData.grade_level}`
                    gradeLevel = gradeData.grade_level
                    console.log('Using joined grade data:', { gradeName, gradeLevel })
                  }
                } 
                // Fallback to separate lookup if join didn't work
                else if (cls.grade_level_id) {
                  try {
                    console.log('Looking up grade level for ID:', cls.grade_level_id)
                    const { data: gradeData, error: gradeError } = await supabaseAdmin
                      .from('grade_levels')
                      .select('grade_level')
                      .eq('id', cls.grade_level_id)
                      .single()
                    
                    console.log('Grade lookup result:', { data: gradeData, error: gradeError })
                    
                    if (gradeData && !gradeError && gradeData.grade_level) {
                      gradeName = `Grade ${gradeData.grade_level}`
                      gradeLevel = gradeData.grade_level
                      console.log('Using lookup grade data:', { gradeName, gradeLevel })
                    }
                  } catch (gradeError) {
                    console.log('Grade level lookup exception:', gradeError)
                  }
                }
              } catch (gradeProcessingError) {
                console.log('Grade processing error:', gradeProcessingError)
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
              
              console.log('Class processing details:', {
                originalClassName: cls.class_name,
                finalClassName: className,
                classId: cls.id,
                rawClassData: cls
              })
              
              console.log('Processing class:', {
                id: cls.id,
                originalData: cls,
                processedName: className,
                processedCode: classCode
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
          console.log('No assigned classes found')
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          error: 'Database error',
          message: 'Failed to connect to database or execute queries',
          dbError: dbError
        },
        { status: 500 }
      )
    }

    console.log('Final classes response:', { classes: classes || [] })
    console.log('Number of classes being returned:', (classes || []).length)
    return NextResponse.json({ classes: classes || [] })
  } catch (error) {
    console.error('Error fetching assigned classes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
