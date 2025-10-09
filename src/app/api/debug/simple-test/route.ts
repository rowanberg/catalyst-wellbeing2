import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🧪 Simple test API called')
  
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'test@example.com'
    
    // Basic environment check
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not set'
    }
    
    console.log('🔍 Environment check:', envCheck)
    
    // Try to load Supabase admin
    let supabaseStatus = 'Not loaded'
    let supabaseError = null
    
    try {
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
      supabaseStatus = 'Loaded successfully'
      console.log('✅ Supabase admin loaded')
      
      // Try a simple test
      try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1
        })
        
        if (error) {
          supabaseError = error.message
          supabaseStatus = `Error: ${error.message}`
        } else {
          supabaseStatus = `Working - Found ${data.users.length} users (showing 1)`
        }
      } catch (testError: any) {
        supabaseError = testError.message
        supabaseStatus = `Test failed: ${testError.message}`
      }
      
    } catch (loadError: any) {
      supabaseError = loadError.message
      supabaseStatus = `Failed to load: ${loadError.message}`
    }
    
    return NextResponse.json({
      success: true,
      message: 'Simple test completed',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        ...envCheck
      },
      supabase: {
        status: supabaseStatus,
        error: supabaseError
      },
      testEmail: email,
      recommendations: [
        envCheck.supabaseUrl ? '✅ Supabase URL configured' : '❌ Missing NEXT_PUBLIC_SUPABASE_URL',
        envCheck.supabaseAnonKey ? '✅ Supabase anon key configured' : '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY',
        envCheck.supabaseServiceKey ? '✅ Supabase service key configured' : '❌ Missing SUPABASE_SERVICE_ROLE_KEY',
        supabaseStatus.includes('Working') ? '✅ Supabase connection working' : '❌ Supabase connection issues'
      ]
    })
    
  } catch (error: any) {
    console.error('❌ Simple test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Simple test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🧪 Simple test POST called')
  
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email required for POST test'
      }, { status: 400 })
    }
    
    // Just test basic functionality without actually sending emails
    return NextResponse.json({
      success: true,
      message: 'POST test successful',
      receivedEmail: email,
      note: 'This is a safe test that does not send actual emails'
    })
    
  } catch (error: any) {
    console.error('❌ Simple POST test error:', error)
    return NextResponse.json({
      success: false,
      message: 'POST test failed',
      error: error.message
    }, { status: 500 })
  }
}
