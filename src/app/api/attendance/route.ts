import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
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
}

// Simple GET for testing
export async function GET(request: NextRequest) {
  console.log('🎯 GET /api/attendance called')
  return NextResponse.json({ 
    message: 'Attendance GET working', 
    timestamp: new Date().toISOString(),
    url: request.url 
  })
}

// Simple POST for testing
export async function POST(request: NextRequest) {
  console.log('🎯 POST /api/attendance called')
  try {
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    return NextResponse.json({ 
      message: 'Attendance POST working', 
      timestamp: new Date().toISOString(),
      receivedData: body
    })
  } catch (error) {
    console.error('Error in POST:', error)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
