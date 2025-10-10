import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AI Chat functionality has been disabled
    return NextResponse.json({ 
      error: 'AI Chat functionality is currently unavailable. Please contact your teacher for homework assistance.' 
    }, { status: 503 })

  } catch (error: any) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({ 
      error: 'AI Chat functionality is currently unavailable.' 
    }, { status: 503 })
  }
}
