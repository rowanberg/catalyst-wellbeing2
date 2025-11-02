/**
 * ============================================================================
 * Health Check Endpoint
 * ============================================================================
 * Verifies all performance optimization components are working
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCacheStats } from '@/lib/cache/redis-client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  }

  try {
    // Check Supabase connection
    const supabase = await createClient()
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
    
    checks.checks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      error: dbError?.message
    }

    // Check materialized views exist (simplified check)
    try {
      const { data: testView, error: viewError } = await supabase
        .from('mv_student_growth_summary')
        .select('student_id')
        .limit(1)
      
      checks.checks.materializedViews = {
        status: viewError ? 'warning' : 'healthy',
        note: viewError ? 'Views may not be created yet - run migration 042' : 'Views accessible'
      }
    } catch (error: any) {
      checks.checks.materializedViews = {
        status: 'warning',
        note: 'Cannot verify views - may need to run migrations'
      }
    }

    // Check Redis/Cache
    try {
      const cacheStats = await getCacheStats()
      checks.checks.cache = {
        status: 'healthy',
        ...cacheStats
      }
    } catch (cacheError: any) {
      checks.checks.cache = {
        status: 'warning',
        message: 'Using in-memory fallback',
        error: cacheError.message
      }
    }

    // Check critical indexes (performance validation)
    try {
      const startTime = Date.now()
      const { error: indexError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', 'test-id')
        .limit(1)
      
      const queryTime = Date.now() - startTime
      
      checks.checks.indexes = {
        status: queryTime < 100 ? 'healthy' : 'warning',
        queryTime: `${queryTime}ms`,
        note: queryTime < 100 ? 'Indexes performing well' : 'May need index optimization'
      }
    } catch (error: any) {
      checks.checks.indexes = {
        status: 'warning',
        note: 'Cannot verify index performance'
      }
    }

    // Overall status
    const hasUnhealthy = Object.values(checks.checks).some((c: any) => c.status === 'unhealthy')
    const hasWarnings = Object.values(checks.checks).some((c: any) => c.status === 'warning')
    
    checks.status = hasUnhealthy ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy'

    return NextResponse.json(checks, {
      status: hasUnhealthy ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Health-Status': checks.status
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
      checks
    }, { status: 503 })
  }
}
