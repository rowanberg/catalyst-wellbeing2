import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

const MONTHLY_LIMIT = 7000

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Issue Credits API called')
    const supabase = await createSupabaseServerClient()

    // Get current user from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔍 Cookie auth check:', { hasUser: !!user, userId: user?.id, error: userError })
    
    const { student_id, teacher_id, amount, reason } = await request.json()
    console.log('🔍 Request data:', { student_id, teacher_id, amount, reason })

    // Validation
    if (!student_id || !teacher_id || !amount || !reason) {
      console.log('🔍 Missing fields - returning 400')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use admin client for database operations (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin()
    
    // Verify teacher exists and get profile
    const { data: teacherAuth, error: teacherError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, role, school_id, first_name, last_name')
      .eq('user_id', teacher_id)
      .eq('role', 'teacher')
      .single()
    
    console.log('🔍 Teacher verification:', { teacherAuth, teacherError })
    
    if (teacherError || !teacherAuth) {
      console.log('🔍 Teacher not found - returning 401')
      return NextResponse.json({ error: 'Teacher not found or invalid' }, { status: 401 })
    }

    // If we have cookie auth, verify it matches the teacher_id
    if (user && user.id !== teacher_id) {
      console.log('🔍 Teacher ID mismatch - returning 403', { teacher_id, user_id: user.id })
      return NextResponse.json({ error: 'Unauthorized teacher' }, { status: 403 })
    }

    if (amount <= 0 || amount > 500) {
      return NextResponse.json({ error: 'Invalid amount (must be 1-500)' }, { status: 400 })
    }

    if (reason.length > 200) {
      return NextResponse.json({ error: 'Reason too long (max 200 characters)' }, { status: 400 })
    }

    // Check monthly limit using direct query (database function might not exist)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    console.log('🔍 Checking monthly limit for:', { teacher_id, currentMonth })
    
    const { data: monthlyTransactions, error: monthlyError } = await supabaseAdmin
      .from('gem_transactions')
      .select('amount')
      .eq('teacher_id', teacher_id)
      .eq('transaction_type', 'credit_issued')
      .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
      .lt('created_at', `${currentMonth === '2024-12' ? '2025-01' : currentMonth.slice(0, 5) + String(parseInt(currentMonth.slice(5)) + 1).padStart(2, '0')}-01T00:00:00.000Z`)

    console.log('🔍 Monthly transactions found:', monthlyTransactions)

    if (monthlyError) {
      console.error('🔍 Monthly limit check failed - returning 500:', monthlyError)
      return NextResponse.json({ error: 'Failed to check monthly limit' }, { status: 500 })
    }

    const monthlyTotal = monthlyTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0

    const totalIssued = monthlyTotal
    if (totalIssued + amount > MONTHLY_LIMIT) {
      return NextResponse.json({
        error: `Monthly limit exceeded. You have ${MONTHLY_LIMIT - totalIssued} gems remaining this month.`
      }, { status: 400 })
    }

    // Verify teacher has access to student (simplified check)
    // Check if teacher has any class assignments (basic validation)
    const { data: teacherClasses, error: accessError } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', teacher_id)
      .eq('is_active', true)

    if (accessError || !teacherClasses || teacherClasses.length === 0) {
      console.error('Teacher access verification failed:', accessError)
      return NextResponse.json({ error: 'No teaching assignments found' }, { status: 403 })
    }

    // Verify student exists - try both user_id and id fields
    console.log('🔍 Looking for student profile with ID:', student_id)
    
    // First try user_id
    let { data: studentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role, first_name, last_name, user_id, id, gems')
      .eq('user_id', student_id)
      .single()

    console.log('🔍 Student profile query by user_id:', { studentProfile, profileError })

    // If not found by user_id, try by id (profile.id)
    if (!studentProfile && profileError?.code === 'PGRST116') {
      console.log('🔍 Not found by user_id, trying by profile.id')
      const { data: studentByProfileId, error: profileIdError } = await supabaseAdmin
        .from('profiles')
        .select('school_id, role, first_name, last_name, user_id, id, gems')
        .eq('id', student_id)
        .single()
      
      console.log('🔍 Student profile query by profile.id:', { studentByProfileId, profileIdError })
      
      if (studentByProfileId) {
        studentProfile = studentByProfileId
        profileError = profileIdError
      }
    }

    if (profileError || !studentProfile) {
      console.error('🔍 Student verification failed:', profileError)
      return NextResponse.json({ error: 'Student not found or invalid' }, { status: 403 })
    }

    // Check if the profile has student role
    if (studentProfile.role !== 'student') {
      console.error('🔍 Profile found but role is not student:', studentProfile.role)
      return NextResponse.json({ error: 'Profile is not a student' }, { status: 403 })
    }

    // Get teacher's school ID for comparison
    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', teacher_id)
      .single()

    if (studentProfile.school_id !== teacherAuth?.school_id) {
      return NextResponse.json({ error: 'Student not in same school' }, { status: 403 })
    }

    console.log('🔍 Creating transaction for:', { 
      student_user_id: studentProfile.user_id, 
      teacher_id, 
      amount, 
      reason 
    })

    // Start transaction to issue credits - use student's user_id
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('gem_transactions')
      .insert({
        student_id: studentProfile.user_id, // Use the actual user_id from profile
        teacher_id,
        amount,
        reason,
        transaction_type: 'credit_issued',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // Update student's gem balance using the correct user_id
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        gems: (studentProfile.gems || 0) + amount // Direct calculation instead of RPC
      })
      .eq('user_id', studentProfile.user_id)

    if (updateError) {
      console.error('Error updating student gems:', updateError)
      // Try to rollback the transaction
      await supabaseAdmin
        .from('gem_transactions')
        .delete()
        .eq('id', transaction.id)
      
      return NextResponse.json({ error: 'Failed to update student gems' }, { status: 500 })
    }

    console.log('🔍 Successfully updated gems for student:', studentProfile.first_name)

    return NextResponse.json({
      success: true,
      message: `Successfully issued ${amount} gems to ${studentProfile.first_name}`,
      transaction: {
        id: transaction.id,
        amount,
        reason,
        created_at: transaction.created_at
      },
      student: {
        current_gems: (studentProfile.gems || 0) + amount
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
