import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!teacherId || teacherId !== user.id) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }

    // Use admin client for reliable data access
    const supabaseAdmin = getSupabaseAdmin()

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('gem_transactions')
      .select(`
        id,
        student_id,
        teacher_id,
        amount,
        reason,
        created_at
      `)
      .eq('teacher_id', teacherId)
      .eq('transaction_type', 'credit_issued')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Format the transactions with student names
    let formattedTransactions: any[] = []
    if (transactions && transactions.length > 0) {
      // Get unique student IDs
      const studentIds = Array.from(new Set(transactions.map((t: any) => t.student_id)))
      
      // Get student names using admin client
      const { data: students, error: studentsError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', studentIds)

      if (studentsError) {
        console.error('Error fetching student names:', studentsError)
        // Return transactions without names as fallback
        formattedTransactions = transactions.map((transaction: any) => ({
          id: transaction.id,
          student_id: transaction.student_id,
          teacher_id: transaction.teacher_id,
          amount: transaction.amount,
          reason: transaction.reason,
          created_at: transaction.created_at,
          student_name: 'Unknown Student'
        }))
      } else {
        // Create a map of student IDs to names
        const studentMap = new Map()
        students?.forEach((student: any) => {
          studentMap.set(student.user_id, `${student.first_name} ${student.last_name}`.trim())
        })

        // Format transactions with student names
        formattedTransactions = transactions.map((transaction: any) => ({
          id: transaction.id,
          student_id: transaction.student_id,
          teacher_id: transaction.teacher_id,
          amount: transaction.amount,
          reason: transaction.reason,
          created_at: transaction.created_at,
          student_name: studentMap.get(transaction.student_id) || 'Unknown Student'
        }))
      }
    }

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
