/**
 * ============================================================================
 * Performance Optimization Setup Validator
 * ============================================================================
 * Validates that all required components are properly configured
 * 
 * Usage:
 *   npx ts-node scripts/validate-setup.ts
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

const results: CheckResult[] = []

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ name, status, message, details })
  
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  console.log(`${emoji} ${name}: ${message}`)
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
  }
}

async function validateEnvironment() {
  console.log('🔍 Checking environment variables...\n')
  
  if (!SUPABASE_URL) {
    addResult('Supabase URL', 'fail', 'NEXT_PUBLIC_SUPABASE_URL not set')
  } else {
    addResult('Supabase URL', 'pass', 'Configured')
  }
  
  if (!SUPABASE_ANON_KEY) {
    addResult('Supabase Key', 'fail', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
  } else {
    addResult('Supabase Key', 'pass', 'Configured')
  }
  
  if (!REDIS_URL) {
    addResult('Redis', 'warning', 'Not configured - will use in-memory cache')
  } else {
    addResult('Redis', 'pass', 'Configured')
  }
}

async function validateDatabase() {
  console.log('\n🗄️  Checking database setup...\n')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    addResult('Database', 'fail', 'Cannot connect - Supabase credentials missing')
    return
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Check connection
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error
    addResult('Database Connection', 'pass', 'Connected successfully')
  } catch (error: any) {
    addResult('Database Connection', 'fail', error.message)
    return
  }
  
  // Check indexes exist
  const criticalIndexes = [
    'idx_profiles_user_id_critical',
    'idx_test_results_student_date',
    'idx_daily_quests_student_date',
    'idx_assessments_school_upcoming'
  ]
  
  try {
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .in('indexname', criticalIndexes)
    
    if (error) throw error
    
    const foundIndexes = indexes?.map(i => i.indexname) || []
    const missingIndexes = criticalIndexes.filter(i => !foundIndexes.includes(i))
    
    if (missingIndexes.length === 0) {
      addResult('Database Indexes', 'pass', `All ${criticalIndexes.length} critical indexes exist`)
    } else {
      addResult(
        'Database Indexes', 
        'warning', 
        `Missing ${missingIndexes.length} indexes`, 
        { missing: missingIndexes }
      )
    }
  } catch (error: any) {
    addResult('Database Indexes', 'warning', 'Cannot verify indexes - may need admin access')
  }
  
  // Check materialized views
  const requiredViews = [
    'mv_student_growth_summary',
    'mv_student_recent_tests',
    'mv_student_subject_performance',
    'mv_student_today_summary',
    'mv_upcoming_assessments',
    'mv_active_polls',
    'mv_active_announcements'
  ]
  
  try {
    const { data: views, error } = await supabase
      .from('pg_matviews')
      .select('matviewname, last_refresh')
      .in('matviewname', requiredViews)
    
    if (error) throw error
    
    const foundViews = views?.map(v => v.matviewname) || []
    const missingViews = requiredViews.filter(v => !foundViews.includes(v))
    
    if (missingViews.length === 0) {
      addResult('Materialized Views', 'pass', `All ${requiredViews.length} views exist`)
      
      // Check if views are fresh (refreshed in last hour)
      const staleViews = views?.filter(v => {
        if (!v.last_refresh) return true
        const lastRefresh = new Date(v.last_refresh).getTime()
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        return lastRefresh < oneHourAgo
      })
      
      if (staleViews && staleViews.length > 0) {
        addResult(
          'View Freshness', 
          'warning', 
          `${staleViews.length} views need refresh`,
          { stale: staleViews.map(v => v.matviewname) }
        )
      } else {
        addResult('View Freshness', 'pass', 'All views recently refreshed')
      }
    } else {
      addResult(
        'Materialized Views', 
        'fail', 
        `Missing ${missingViews.length} views - run migration 042`,
        { missing: missingViews }
      )
    }
  } catch (error: any) {
    addResult('Materialized Views', 'fail', 'Cannot verify views - may need to run migrations')
  }
  
  // Check if refresh function exists
  try {
    const { error } = await supabase.rpc('refresh_student_dashboard_views')
    
    if (error && error.code === '42883') {
      addResult('Refresh Function', 'fail', 'Function not found - run migration 042')
    } else if (error) {
      addResult('Refresh Function', 'warning', 'Cannot execute - may need permissions')
    } else {
      addResult('Refresh Function', 'pass', 'Exists and executable')
    }
  } catch (error: any) {
    addResult('Refresh Function', 'warning', 'Cannot verify function')
  }
}

async function validateAPIs() {
  console.log('\n🌐 Checking API endpoints...\n')
  
  const apiBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Check health endpoint
  try {
    const response = await fetch(`${apiBase}/api/health`)
    const data = await response.json()
    
    if (data.status === 'healthy') {
      addResult('Health Endpoint', 'pass', 'All systems operational')
    } else if (data.status === 'degraded') {
      addResult('Health Endpoint', 'warning', 'Some systems degraded', data.checks)
    } else {
      addResult('Health Endpoint', 'fail', 'Systems unhealthy', data.checks)
    }
  } catch (error: any) {
    addResult('Health Endpoint', 'warning', 'Cannot reach - server may not be running')
  }
}

async function validateCache() {
  console.log('\n💾 Checking cache setup...\n')
  
  if (!REDIS_URL) {
    addResult('Redis URL', 'warning', 'Not configured - using in-memory cache')
    return
  }
  
  try {
    // Try to import and check redis
    const { redis } = await import('../src/lib/cache/redis-client')
    addResult('Redis Client', 'pass', 'Module loaded successfully')
    
    // Connection check happens automatically in the module
    setTimeout(async () => {
      try {
        await redis.set('health-check', 'ok', 10)
        const value = await redis.get('health-check')
        
        if (value === 'ok') {
          addResult('Redis Connection', 'pass', 'Can read/write successfully')
        } else {
          addResult('Redis Connection', 'warning', 'Connected but data mismatch')
        }
      } catch (error: any) {
        addResult('Redis Connection', 'warning', 'Using in-memory fallback', error.message)
      }
    }, 1000)
  } catch (error: any) {
    addResult('Redis Client', 'fail', error.message)
  }
}

async function printSummary() {
  await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for async checks
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(60) + '\n')
  
  const passed = results.filter(r => r.status === 'pass').length
  const warnings = results.filter(r => r.status === 'warning').length
  const failed = results.filter(r => r.status === 'fail').length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)
  console.log()
  
  if (failed > 0) {
    console.log('❌ VALIDATION FAILED')
    console.log('Please fix the failed checks before deploying optimizations.\n')
    
    const failedChecks = results.filter(r => r.status === 'fail')
    console.log('Failed checks:')
    failedChecks.forEach(check => {
      console.log(`  - ${check.name}: ${check.message}`)
    })
    
    process.exit(1)
  } else if (warnings > 0) {
    console.log('⚠️  VALIDATION PASSED WITH WARNINGS')
    console.log('System will work but may not be fully optimized.\n')
    process.exit(0)
  } else {
    console.log('✅ VALIDATION PASSED')
    console.log('All systems ready for optimal performance!\n')
    process.exit(0)
  }
}

// Run validation
async function main() {
  console.log('🚀 Performance Optimization Setup Validator\n')
  console.log('='.repeat(60) + '\n')
  
  await validateEnvironment()
  await validateDatabase()
  await validateAPIs()
  await validateCache()
  await printSummary()
}

main().catch(console.error)
