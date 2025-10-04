import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('🔄 [SessionAPI] Auth error:', error.message)
      
      // Handle refresh token errors specifically
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found')) {
        console.log('🔄 [SessionAPI] Invalid refresh token detected')
        return NextResponse.json({ 
          error: 'Invalid refresh token', 
          code: 'REFRESH_TOKEN_INVALID' 
        }, { status: 401 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      console.log('🔄 [SessionAPI] No user found in session')
      return NextResponse.json({ error: 'Auth session missing!' }, { status: 401 })
    }

    console.log('✅ [SessionAPI] Valid session found for user:', user.email)
    return NextResponse.json({ user }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
