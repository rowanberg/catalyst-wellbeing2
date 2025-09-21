import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { decryptMessage } from '@/lib/schoolEncryption'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SCHOOL-FILTERED ADMIN HELP REQUESTS API START ===')
    
    // Get admin's session and profile to determine their school
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No-op for server-side
          },
          remove(name: string, options: any) {
            // No-op for server-side
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      console.error('Authentication failed:', userError?.message || 'No user found')
      const allCookies = cookieStore.getAll()
      console.log('Available cookies:', allCookies.map(c => c.name))
      
      // Return empty data instead of mock data - no requests if not authenticated
      return NextResponse.json({
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 },
        schoolInfo: {
          name: 'No School - Please Login',
          id: 'no-auth'
        },
        message: 'Please login as an admin to view help requests from your school'
      })
    }

    console.log('Authenticated user:', user.id, user.email)

    // Get admin's profile and school information
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        schools!profiles_school_id_fkey (
          id,
          name,
          messaging_encryption_key
        )
      `)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (profileError || !adminProfile) {
      console.error('Admin profile not found:', profileError)
      return NextResponse.json({
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 },
        schoolInfo: {
          name: 'No Profile Found',
          id: 'no-profile'
        },
        message: 'Admin profile not found. Please create an admin profile first.'
      })
    }

    if (!adminProfile.schools) {
      console.error('Admin school not found')
      return NextResponse.json({ 
        error: 'Admin school not found',
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 }
      }, { status: 403 })
    }

    const adminSchool = adminProfile.schools
    const schoolEncryptionKey = adminSchool.messaging_encryption_key

    console.log(`Admin ${adminProfile.first_name} ${adminProfile.last_name} from ${adminSchool.name}`)

    // Fetch help requests that belong to this school
    const { data: helpRequests, error: helpRequestsError } = await supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        message,
        encrypted_message,
        school_encryption_key,
        school_id,
        urgency,
        status,
        created_at,
        updated_at,
        student_id,
        profiles!help_requests_student_id_fkey (
          user_id,
          first_name,
          last_name,
          grade_level,
          class_name,
          school_id,
          schools!profiles_school_id_fkey (
            name
          )
        )
      `)
      .eq('school_id', adminSchool.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (helpRequestsError) {
      console.error('Error fetching help requests:', helpRequestsError)
      return NextResponse.json({ 
        error: 'Failed to fetch help requests',
        details: helpRequestsError.message,
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 }
      }, { status: 500 })
    }

    // Decrypt and transform data for frontend
    const transformedRequests = helpRequests?.map((request: any) => {
      const studentProfile = request.profiles
      let decryptedMessage = request.message

      // Try to decrypt the message if encrypted_message exists
      if (request.encrypted_message) {
        try {
          decryptedMessage = decryptMessage(request.encrypted_message, schoolEncryptionKey)
        } catch (error) {
          console.error('Failed to decrypt message:', error)
          decryptedMessage = '[Message could not be decrypted]'
        }
      }

      return {
        id: request.id,
        type: 'help_request',
        content: decryptedMessage,
        sender: studentProfile ? 
          `${studentProfile.first_name} ${studentProfile.last_name} (Grade ${studentProfile.grade_level})` : 
          `Student ID: ${request.student_id}`,
        recipient: 'Support Team',
        timestamp: request.created_at,
        severity: request.urgency,
        status: request.status,
        flagReason: `${request.urgency?.toUpperCase() || 'UNKNOWN'} priority help request`,
        priorityScore: request.urgency === 'high' ? 3 : request.urgency === 'medium' ? 2 : 1,
        location: null,
        incidentType: 'help_request',
        followUpRequired: request.urgency === 'high',
        notes: null,
        resolvedAt: null,
        studentInfo: studentProfile ? {
          grade: studentProfile.grade_level,
          class: studentProfile.class_name,
          school: studentProfile.schools?.name || adminSchool.name
        } : null,
        resolver: null
      }
    }) || []

    const stats = {
      total: transformedRequests.length,
      pending: transformedRequests.filter((r: any) => r.status === 'pending').length,
      urgent: transformedRequests.filter((r: any) => r.severity === 'high').length,
      high: transformedRequests.filter((r: any) => r.severity === 'high').length,
      resolved: transformedRequests.filter((r: any) => r.status === 'resolved').length
    }

    console.log(`Found ${transformedRequests.length} help requests for ${adminSchool.name}`)
    console.log('=== SCHOOL-FILTERED ADMIN HELP REQUESTS API END ===')

    return NextResponse.json({
      helpRequests: transformedRequests,
      stats,
      schoolInfo: {
        name: adminSchool.name,
        id: adminSchool.id
      }
    })

  } catch (error) {
    console.error('Direct help requests API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
