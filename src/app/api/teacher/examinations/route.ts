import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const teacherIdParam = searchParams.get('teacherId')
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Use teacher ID from query param as fallback (development workaround)
    const effectiveTeacherId = user?.id || teacherIdParam
    
    if (!effectiveTeacherId) {
      console.error('GET No teacher ID available, returning empty array')
      return NextResponse.json({ exams: [] })
    }

    console.log('GET Fetching exams for teacher:', effectiveTeacherId)

    // Use admin client to bypass RLS (development workaround)
    const adminClient = createAdminClient()
    
    // Get teacher's examinations - simplified query first
    const { data: exams, error: examsError } = await adminClient
      .from('examinations')
      .select('*')
      .eq('teacher_id', effectiveTeacherId)
      .order('created_at', { ascending: false })

    if (examsError) {
      console.error('Error fetching exams:', examsError)
      // If table doesn't exist, return empty array instead of error
      if (examsError.code === '42P01') {
        console.warn('Examinations table does not exist yet. Please run the database schema.')
        return NextResponse.json({ exams: [] })
      }
      return NextResponse.json({ error: 'Failed to fetch examinations' }, { status: 500 })
    }
    
    console.log('GET Found exams:', exams?.length || 0, 'for teacher:', effectiveTeacherId)

    // Process exams to add analytics
    const formattedExams = exams?.map((exam: any) => {
      const sessions = exam.student_exam_sessions || []
      const completedSessions = sessions.filter((s: any) => s.status === 'completed')
      const totalStudents = new Set(sessions.map((s: any) => s.student_id)).size
      const completionRate = totalStudents > 0 ? (completedSessions.length / totalStudents) * 100 : 0
      const averageScore = completedSessions.length > 0 
        ? completedSessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / completedSessions.length 
        : 0

      return {
        ...exam,
        student_count: totalStudents,
        completion_rate: Math.round(completionRate),
        average_score: Math.round(averageScore),
        student_exam_sessions: undefined // Remove to reduce payload size
      }
    }) || []

    return NextResponse.json({ exams: formattedExams })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check for Authorization header as fallback
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (user && !error) {
        console.log('Using Authorization header for auth:', { userId: user.id })
        // Continue with the authenticated user
      }
    }
    
    // Get the current user - Using getUser() for secure server-side validation
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const examData = await request.json()
    
    // Temporary workaround: If no user from session, try to get user ID from request body
    let effectiveUserId = user?.id
    if (!effectiveUserId && examData.userId) {
      console.log('Using user ID from request body as workaround:', examData.userId)
      effectiveUserId = examData.userId
      // Remove userId from examData so it doesn't get inserted into the exam
      delete examData.userId
    }
    
    if (authError && !effectiveUserId) {
      console.error('POST Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!effectiveUserId) {
      console.error('POST No user found in session or request')
      return NextResponse.json({ error: 'No user ID available' }, { status: 401 })
    }

    // Get teacher's school_id from profile
    // Try both user_id and id columns since the structure may vary
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role, user_id, first_name, last_name, id')
      .eq('user_id', effectiveUserId)
      .maybeSingle()
    
    // If not found by user_id, try by id column
    if (!profileData && !profileError) {
      const result = await supabase
        .from('profiles')
        .select('school_id, role, user_id, first_name, last_name, id')
        .eq('id', effectiveUserId)
        .maybeSingle()
      
      profileData = result.data
      profileError = result.error
    }

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch teacher profile', 
        details: profileError.message 
      }, { status: 500 })
    }

    let profile = profileData
    
    if (!profile) {
      console.error('No profile found for user:', effectiveUserId)
      
      // Check if profiles table exists first
      const { data: tableCheck, error: tableError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error('Profiles table does not exist:', tableError)
        return NextResponse.json({ 
          error: 'Database not properly set up. Please run the database schema first.',
          details: 'Profiles table missing',
          tableError: tableError.message
        }, { status: 500 })
      }
      
      // Get a valid school ID or create a default one using admin client
      const adminClient = createAdminClient()
      const { data: schools, error: schoolError } = await adminClient
        .from('schools')
        .select('id')
        .limit(1)
      
      let schoolId = null
      if (!schoolError && schools && schools.length > 0) {
        schoolId = schools[0].id
      } else {
        console.warn('No schools found, using null school_id')
      }
      
      // Temporary workaround: Create a basic profile for development using admin client
      console.log('Attempting to create basic profile for user:', effectiveUserId, 'with school:', schoolId)
      
      // Use admin client to bypass RLS policies (reuse the same client)
      const { data: newProfile, error: createError } = await adminClient
        .from('profiles')
        .insert({
          user_id: effectiveUserId,
          role: 'teacher',
          first_name: 'Teacher',
          last_name: 'User',
          school_id: schoolId // Use actual school ID or null
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Failed to create profile:', createError)
        
        // If profile already exists (duplicate key), try to fetch it again
        if (createError.code === '23505') {
          console.log('Profile already exists, attempting to fetch again...')
          
          const { data: existingProfile, error: fetchError } = await adminClient
            .from('profiles')
            .select('*')
            .eq('user_id', effectiveUserId)
            .maybeSingle()
          
          if (existingProfile) {
            console.log('Found existing profile:', existingProfile)
            profile = existingProfile
          } else {
            console.error('Profile exists but could not be fetched:', fetchError)
            return NextResponse.json({ 
              error: 'Profile exists but cannot be accessed. Please contact support.',
              userId: effectiveUserId,
              fetchError: fetchError?.message
            }, { status: 500 })
          }
        } else {
          return NextResponse.json({ 
            error: 'Teacher profile not found and could not be created. Please contact support.',
            userId: effectiveUserId,
            createError: createError.message,
            schoolId: schoolId
          }, { status: 404 })
        }
      } else {
        console.log('Created basic profile:', newProfile)
        // Use the newly created profile
        profile = newProfile
      }
    }
    
    // For development, allow null school_id but warn about it
    if (!profile?.school_id) {
      console.warn('No school_id found for user:', effectiveUserId, '- using null for development')
    }
    
    if (!profile || profile.role !== 'teacher') {
      console.error('User is not a teacher:', { userId: effectiveUserId, role: profile?.role })
      return NextResponse.json({ error: 'Insufficient permissions - teacher role required' }, { status: 403 })
    }

    // Separate questions from exam data
    const { questions, ...examFields } = examData
    
    // Validate minimum requirements
    if (!examFields.total_questions || examFields.total_questions < 1) {
      console.error('Invalid total_questions:', examFields.total_questions)
      return NextResponse.json({ 
        error: 'At least 1 question is required to create an exam',
        field: 'total_questions'
      }, { status: 400 })
    }
    
    if (!examFields.total_marks || examFields.total_marks < 1) {
      console.error('Invalid total_marks:', examFields.total_marks)
      return NextResponse.json({ 
        error: 'Total marks must be at least 1',
        field: 'total_marks'
      }, { status: 400 })
    }
    
    // Use admin client to bypass RLS for exam creation (development workaround)
    const adminClient = createAdminClient()
    
    // Create the examination without questions field
    const { data: exam, error: examError } = await adminClient
      .from('examinations')
      .insert({
        ...examFields,
        teacher_id: effectiveUserId,
        school_id: profile.school_id
      })
      .select()
      .single()

    if (examError) {
      console.error('Error creating exam:', examError)
      return NextResponse.json({ 
        error: 'Failed to create examination', 
        details: examError.message,
        code: examError.code 
      }, { status: 500 })
    }

    console.log('Exam created successfully:', exam.id)
    
    // If questions were provided, insert them into exam_questions table
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, index: number) => {
        const questionData: any = {
          exam_id: exam.id,
          question_text: q.question_text || '',
          question_type: q.question_type || 'multiple_choice',
          marks: q.marks || 1,
          order_number: index + 1
        }
        
        // Only add fields if they exist in the question data
        if (q.time_limit) questionData.time_limit = q.time_limit
        if (q.difficulty_level) questionData.difficulty_level = q.difficulty_level
        
        return questionData
      })
      
      const { error: questionsError } = await adminClient
        .from('exam_questions')
        .insert(questionsToInsert)
      
      if (questionsError) {
        console.error('Error creating questions:', questionsError)
        // Exam is created but questions failed - still return success but warn
        return NextResponse.json({ 
          success: true, 
          exam,
          warning: 'Exam created but questions could not be saved',
          questionsError: questionsError.message
        })
      }
      
      console.log('Questions created successfully:', questions.length)
    }
    
    return NextResponse.json({ 
      success: true, 
      exam,
      message: 'Examination created successfully',
      questionsCount: questions?.length || 0
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
