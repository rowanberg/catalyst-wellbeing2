import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

const MONTHLY_LIMIT = 7000

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Step 2: Get authenticated user's profile and verify teacher role
    const supabaseAdmin = getSupabaseAdmin()
    const { data: teacherProfile, error: teacherError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()
    
    if (teacherError || !teacherProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (teacherProfile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden - Teacher access only' },
        { status: 403 }
      )
    }

    // Step 3: Parse request body (DO NOT accept teacher_id - use authenticated user)
    const { student_id, amount, reason } = await request.json()

    // Validation
    if (!student_id || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0 || amount > 500) {
      return NextResponse.json({ error: 'Invalid amount (must be 1-500)' }, { status: 400 })
    }

    if (reason.length > 200) {
      return NextResponse.json({ error: 'Reason too long (max 200 characters)' }, { status: 400 })
    }

    // Check monthly limit using direct query (database function might not exist)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const { data: monthlyTransactions, error: monthlyError } = await supabaseAdmin
      .from('gem_transactions')
      .select('amount')
      .eq('teacher_id', user.id)
      .eq('transaction_type', 'credit_issued')
      .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
      .lt('created_at', `${currentMonth === '2024-12' ? '2025-01' : currentMonth.slice(0, 5) + String(parseInt(currentMonth.slice(5), 10) + 1).padStart(2, '0')}-01T00:00:00.000Z`)

    if (monthlyError) {
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
      .eq('teacher_id', user.id)
      .eq('is_active', true)

    if (accessError || !teacherClasses || teacherClasses.length === 0) {
      return NextResponse.json({ error: 'No teaching assignments found' }, { status: 403 })
    }

    // Verify student exists - try both user_id and id fields
    // First try user_id
    let { data: studentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role, first_name, last_name, user_id, id, gems')
      .eq('user_id', student_id)
      .single()

    // If not found by user_id, try by id (profile.id)
    if (!studentProfile && profileError?.code === 'PGRST116') {
      const { data: studentByProfileId, error: profileIdError } = await supabaseAdmin
        .from('profiles')
        .select('school_id, role, first_name, last_name, user_id, id, gems')
        .eq('id', student_id)
        .single()
      
      if (studentByProfileId) {
        studentProfile = studentByProfileId
        profileError = profileIdError
      }
    }

    if (profileError || !studentProfile) {
      return NextResponse.json({ error: 'Student not found or invalid' }, { status: 403 })
    }

    // Check if the profile has student role
    if (studentProfile.role !== 'student') {
      return NextResponse.json({ error: 'Profile is not a student' }, { status: 403 })
    }

    // Verify student is in same school as teacher
    if (studentProfile.school_id !== teacherProfile.school_id) {
      return NextResponse.json({ error: 'Student not in same school' }, { status: 403 })
    }

    // Start transaction to issue credits - use student's user_id
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('gem_transactions')
      .insert({
        student_id: studentProfile.user_id, // Use the actual user_id from profile
        teacher_id: user.id, // Use authenticated teacher's ID
        amount,
        reason,
        transaction_type: 'credit_issued',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) {
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
      // Try to rollback the transaction
      await supabaseAdmin
        .from('gem_transactions')
        .delete()
        .eq('id', transaction.id)
      
      return NextResponse.json({ error: 'Failed to update student gems' }, { status: 500 })
    }

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
