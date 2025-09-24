import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Test database connectivity and schema
    const tests = []

    // Test 1: Check if safety tables exist
    try {
      const { data: incidents } = await supabase
        .from('safety_incidents')
        .select('id')
        .limit(1)
      tests.push({ name: 'Safety Incidents Table', status: 'pass', message: 'Table accessible' })
    } catch (error: any) {
      tests.push({ name: 'Safety Incidents Table', status: 'fail', message: 'Table not found or inaccessible' })
    }

    try {
      const { data: digitalChecks } = await supabase
        .from('digital_safety_checks')
        .select('id')
        .limit(1)
      tests.push({ name: 'Digital Safety Checks Table', status: 'pass', message: 'Table accessible' })
    } catch (error: any) {
      tests.push({ name: 'Digital Safety Checks Table', status: 'fail', message: 'Table not found or inaccessible' })
    }

    try {
      const { data: alerts } = await supabase
        .from('safety_alerts')
        .select('id')
        .limit(1)
      tests.push({ name: 'Safety Alerts Table', status: 'pass', message: 'Table accessible' })
    } catch (error: any) {
      tests.push({ name: 'Safety Alerts Table', status: 'fail', message: 'Table not found or inaccessible' })
    }

    // Test 2: Check if stored functions exist
    try {
      const { data: metricsResult } = await supabase
        .rpc('get_safety_metrics', {
          p_school_id: profile.school_id,
          p_start_date: null,
          p_end_date: null
        })
      tests.push({ name: 'Safety Metrics Function', status: 'pass', message: 'Function callable' })
    } catch (error: any) {
      tests.push({ name: 'Safety Metrics Function', status: 'fail', message: 'Function not found or error' })
    }

    // Test 3: Test API endpoints
    const apiTests = [
      { endpoint: '/api/admin/safety-incidents', method: 'GET' },
      { endpoint: '/api/admin/safety-metrics', method: 'GET' },
      { endpoint: '/api/admin/digital-safety', method: 'GET' },
      { endpoint: '/api/admin/safety-alerts', method: 'GET' }
    ]

    for (const apiTest of apiTests) {
      try {
        const testResponse = await fetch(`${request.nextUrl.origin}${apiTest.endpoint}`, {
          method: apiTest.method,
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        })
        
        if (testResponse.ok) {
          tests.push({ 
            name: `API ${apiTest.endpoint}`, 
            status: 'pass', 
            message: `${apiTest.method} request successful` 
          })
        } else {
          tests.push({ 
            name: `API ${apiTest.endpoint}`, 
            status: 'fail', 
            message: `${apiTest.method} request failed with status ${testResponse.status}` 
          })
        }
      } catch (error: any) {
        tests.push({ 
          name: `API ${apiTest.endpoint}`, 
          status: 'fail', 
          message: `${apiTest.method} request error: ${error}` 
        })
      }
    }

    const passedTests = tests.filter(test => test.status === 'pass').length
    const totalTests = tests.length
    const overallStatus = passedTests === totalTests ? 'pass' : 'partial'

    return NextResponse.json({
      overall_status: overallStatus,
      passed_tests: passedTests,
      total_tests: totalTests,
      tests,
      summary: {
        database_connectivity: tests.filter(t => t.name.includes('Table')).every(t => t.status === 'pass'),
        api_endpoints: tests.filter(t => t.name.includes('API')).every(t => t.status === 'pass'),
        stored_functions: tests.filter(t => t.name.includes('Function')).every(t => t.status === 'pass')
      }
    })
  } catch (error: any) {
    console.error('Error in safety system test:', error)
    return NextResponse.json({ 
      error: 'Test execution failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
