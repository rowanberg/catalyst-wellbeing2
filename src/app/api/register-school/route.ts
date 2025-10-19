import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateSchoolCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Debug: Check Supabase connection
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔍 Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Debug: Test if tables are accessible
    const { data: testQuery, error: testError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .limit(1)
    
    console.log('🔍 Test query result:', { success: !testError, error: testError?.message })
    
    const {
      schoolName,
      address,
      phone,
      schoolEmail,
      adminFirstName,
      adminLastName,
      adminEmail,
      password
    } = await request.json()

    // Generate unique school code
    const schoolCode = generateSchoolCode()

    // Create admin user account with email confirmation required
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: password,
      email_confirm: false, // Send confirmation email to admin
      user_metadata: {
        first_name: adminFirstName,
        last_name: adminLastName,
        role: 'admin'
      }
    })

    if (authError) {
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 400 }
      )
    }

    // Send verification email via SendGrid
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${authData.user.id}&type=email`
      
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: adminEmail,
          firstName: adminFirstName,
          verificationUrl
        })
      })
      
      if (emailResponse.ok) {
        console.log('✅ Verification email sent via SendGrid to:', adminEmail)
      } else {
        console.error('❌ Failed to send verification email:', adminEmail)
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Don't fail registration if email sending fails
    }

    // Create school record using admin client to bypass RLS
    console.log('📝 Attempting to insert school:', { schoolName, schoolCode, adminId: authData.user.id })
    
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        address,
        phone,
        email: schoolEmail,
        admin_id: authData.user.id,
        school_code: schoolCode,
      })
      .select()
      .single()

    if (schoolError) {
      console.error('❌ School creation error:', {
        message: schoolError.message,
        code: schoolError.code,
        details: schoolError.details,
        hint: schoolError.hint
      })
      return NextResponse.json(
        { message: `Failed to create school record: ${schoolError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ School created successfully:', schoolData.id)

    // Create admin profile using admin client to bypass RLS
    console.log('📝 Attempting to insert profile:', { userId: authData.user.id, schoolId: schoolData.id })
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: adminFirstName,
        last_name: adminLastName,
        role: 'admin',
        school_id: schoolData.id,
        xp: 0,
        gems: 0,
        level: 1,
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        attemptedSchoolId: schoolData.id
      })
      return NextResponse.json(
        { message: `Failed to create admin profile: ${profileError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Profile created successfully:', profileData.id)

    // Create school_details record with basic information
    // This ensures the school appears in the admin setup flow and other school-related features
    const { data: schoolDetailsData, error: schoolDetailsError } = await supabaseAdmin
      .from('school_details')
      .insert({
        school_id: schoolData.id,
        school_name: schoolName,
        school_code: schoolCode,
        primary_email: schoolEmail,
        primary_phone: phone,
        street_address: address,
        school_type: 'Public', // Default type
        setup_completed: false, // Not completed - will trigger setup flow in admin dashboard
        setup_completed_by: authData.user.id
      })
      .select()
      .single()

    if (schoolDetailsError) {
      console.error('School details creation error:', schoolDetailsError)
      // Don't fail the whole registration, but log the error
      console.warn('School was created but school_details failed:', schoolDetailsError.message)
    } else {
      console.log('School details created successfully:', schoolDetailsData.id)
    }

    console.log('School registration completed:', {
      schoolId: schoolData.id,
      adminUserId: authData.user.id,
      profileCreated: profileData ? 'yes' : 'no',
      schoolDetailsCreated: schoolDetailsData ? 'yes' : 'no',
      schoolCode
    })

    return NextResponse.json({
      schoolCode,
      message: 'School registered successfully'
    })
  } catch (error) {
    console.error('Register school API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
