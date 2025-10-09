import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('🏥 Health check API called')
  
  try {
    // Basic health check without any imports that might fail
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      // Check environment variables without importing anything
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not-set'
      }
    }

    console.log('✅ Health check completed:', healthData)
    
    return NextResponse.json({
      success: true,
      message: 'API is working',
      data: healthData,
      nextSteps: [
        healthData.env.hasSupabaseUrl ? '✅ Supabase URL found' : '❌ Add NEXT_PUBLIC_SUPABASE_URL to .env.local',
        healthData.env.hasSupabaseAnonKey ? '✅ Supabase anon key found' : '❌ Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
        healthData.env.hasSupabaseServiceKey ? '✅ Supabase service key found' : '❌ Add SUPABASE_SERVICE_ROLE_KEY to .env.local'
      ]
    })

  } catch (error: any) {
    console.error('❌ Health check failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Health check failed',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  return GET() // Same response for POST
}
