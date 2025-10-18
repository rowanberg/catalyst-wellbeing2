import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
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
}

// GET - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile (removed email and student_number columns that don't exist)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        role,
        school_id,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching profile', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // For teachers without school_id in profile, try to get it from teacher_class_assignments
    if (profile.role === 'teacher' && !profile.school_id) {
      logger.debug('Teacher profile missing school_id, checking teacher_class_assignments')
      
      const { data: assignment } = await supabase
        .from('teacher_class_assignments')
        .select('school_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (assignment?.school_id) {
        profile.school_id = assignment.school_id
        logger.debug('Found school_id from teacher_class_assignments', { school_id: assignment.school_id })
        
        // Update the profile with the school_id for future requests
        await supabase
          .from('profiles')
          .update({ school_id: assignment.school_id })
          .eq('user_id', user.id)
        
        logger.info('Updated teacher profile with school_id', { user_id: user.id, school_id: assignment.school_id })
      } else {
        // Try with profile.id instead of user.id
        const { data: assignmentByProfileId } = await supabase
          .from('teacher_class_assignments')
          .select('school_id')
          .eq('teacher_id', profile.id)
          .eq('is_active', true)
          .limit(1)
          .single()
        
        if (assignmentByProfileId?.school_id) {
          profile.school_id = assignmentByProfileId.school_id
          logger.debug('Found school_id from teacher_class_assignments using profile.id', { school_id: assignmentByProfileId.school_id })
          
          // Update the profile with the school_id for future requests
          await supabase
            .from('profiles')
            .update({ school_id: assignmentByProfileId.school_id })
            .eq('user_id', user.id)
          
          logger.info('Updated teacher profile with school_id', { user_id: user.id, school_id: assignmentByProfileId.school_id })
        }
      }
    }

    return NextResponse.json(profile)

  } catch (error) {
    logger.error('Error in profile GET', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
