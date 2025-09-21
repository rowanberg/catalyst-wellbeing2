import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables without exposing sensitive data
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project'),
        format: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? 'valid' : 'invalid'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder') || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('your-anon'),
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        isPlaceholder: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('placeholder') || 
                      process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('your_supabase'),
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        isPlaceholder: process.env.NEXTAUTH_SECRET?.includes('placeholder'),
        length: process.env.NEXTAUTH_SECRET?.length || 0
      },
      NEXTAUTH_URL: {
        exists: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL
      }
    }

    // Test basic Supabase connection
    let connectionTest = null
    if (envCheck.NEXT_PUBLIC_SUPABASE_URL.exists && 
        envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY.exists && 
        !envCheck.NEXT_PUBLIC_SUPABASE_URL.isPlaceholder &&
        !envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY.isPlaceholder) {
      
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Test connection with a simple query
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        
        connectionTest = {
          success: !error,
          error: error?.message,
          tablesAccessible: !!data
        }
      } catch (error) {
        connectionTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown connection error'
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environmentVariables: envCheck,
      connectionTest,
      recommendations: generateRecommendations(envCheck, connectionTest)
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateRecommendations(envCheck: any, connectionTest: any) {
  const recommendations = []

  if (!envCheck.NEXT_PUBLIC_SUPABASE_URL.exists || envCheck.NEXT_PUBLIC_SUPABASE_URL.isPlaceholder) {
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in .env.local with your actual Supabase project URL')
  }

  if (!envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY.exists || envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY.isPlaceholder) {
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with your actual anon key')
  }

  if (!envCheck.SUPABASE_SERVICE_ROLE_KEY.exists || envCheck.SUPABASE_SERVICE_ROLE_KEY.isPlaceholder) {
    recommendations.push('Set SUPABASE_SERVICE_ROLE_KEY in .env.local with your actual service role key')
  }

  if (connectionTest && !connectionTest.success) {
    recommendations.push(`Supabase connection failed: ${connectionTest.error}`)
    recommendations.push('Verify your Supabase project is active and credentials are correct')
  }

  if (!connectionTest?.tablesAccessible) {
    recommendations.push('Database tables may not exist - run the SQL schema files in Supabase')
  }

  if (recommendations.length === 0) {
    recommendations.push('Environment looks good! The 500 error may be due to database schema or RLS policies.')
  }

  return recommendations
}
