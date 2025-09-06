import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SUPABASE CONFIG DEBUG ===')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? 'Present' : 'Missing')
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
        serviceKey: serviceKey ? 'Present' : 'Missing'
      }, { status: 500 })
    }

    // Test basic connection
    try {
      const { data, error } = await supabaseAdmin
        .from('schools')
        .select('count')
        .limit(1)

      if (error) {
        console.error('Database connection test failed:', error)
        return NextResponse.json({
          error: 'Database connection failed',
          details: error.message,
          code: error.code
        }, { status: 500 })
      }

      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database test error:', dbError)
      return NextResponse.json({
        error: 'Database test failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Test auth admin functions
    try {
      // This should not fail even if no users exist
      const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      })

      if (authError) {
        console.error('Auth admin test failed:', authError)
        return NextResponse.json({
          error: 'Auth admin functions failed',
          details: authError.message,
          code: authError.code
        }, { status: 500 })
      }

      console.log('Auth admin functions working')
    } catch (authError) {
      console.error('Auth test error:', authError)
      return NextResponse.json({
        error: 'Auth test failed',
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase configuration is working correctly',
      config: {
        supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
        serviceKeyPresent: true,
        databaseConnection: 'OK',
        authAdminFunctions: 'OK'
      }
    })

  } catch (error) {
    console.error('Supabase config debug error:', error)
    return NextResponse.json({
      error: 'Configuration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
