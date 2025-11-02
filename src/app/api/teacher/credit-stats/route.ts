import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const MONTHLY_LIMIT = 7000

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

    if (!teacherId || teacherId !== user.id) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }

    // Get current month statistics
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const { data: monthlyStats, error: statsError } = await supabase
      .from('gem_transactions')
      .select('amount')
      .eq('teacher_id', teacherId)
      .eq('transaction_type', 'credit_issued')
      .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
      .lt('created_at', `${currentMonth === '2024-12' ? '2025-01' : currentMonth.slice(0, 5) + String(parseInt(currentMonth.slice(5), 10) + 1).padStart(2, '0')}-01T00:00:00.000Z`)

    if (statsError) {
      console.error('Error fetching monthly stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    const totalIssued = monthlyStats?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0
    const transactionsCount = monthlyStats?.length || 0
    const remainingAllowance = MONTHLY_LIMIT - totalIssued

    return NextResponse.json({
      success: true,
      stats: {
        total_issued: totalIssued,
        remaining_allowance: Math.max(0, remainingAllowance),
        transactions_count: transactionsCount,
        monthly_limit: MONTHLY_LIMIT,
        month: currentMonth
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
