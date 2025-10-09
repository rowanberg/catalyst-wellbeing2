import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    const debugInfo = {
      hasSession: !!session,
      sessionError: sessionError?.message,
      hasUser: !!user,
      userError: userError?.message,
      userId: user?.id,
      userEmail: user?.email,
      cookies: request.headers.get('cookie'),
      allHeaders: Object.fromEntries(request.headers.entries())
    }
    
    console.log('Auth Debug Info:', debugInfo)
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}
