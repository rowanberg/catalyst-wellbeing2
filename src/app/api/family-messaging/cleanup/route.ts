import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== 'cleanup_messages_2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    console.log(`Cleaning up messages older than: ${oneMonthAgo.toISOString()}`)
    
    const { data: deletedMessages, error } = await supabaseAdmin
      .from('family_messages')
      .delete()
      .lt('created_at', oneMonthAgo.toISOString())
      .select('id')
    
    if (error) {
      console.error('Error cleaning up old messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const deletedCount = deletedMessages?.length || 0
    console.log(`Successfully deleted ${deletedCount} old messages`)
    
    return NextResponse.json({ 
      success: true, 
      deletedCount,
      cutoffDate: oneMonthAgo.toISOString(),
      message: `Deleted ${deletedCount} messages older than 1 month`
    })
    
  } catch (error: any) {
    console.error('Error in cleanup endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
