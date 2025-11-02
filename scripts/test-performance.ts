/**
 * ============================================================================
 * Performance Testing Script
 * ============================================================================
 * Test and compare performance before/after optimization
 * 
 * Usage:
 *   npx ts-node scripts/test-performance.ts
 * ============================================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN // Set this to a valid auth token

interface TestResult {
  endpoint: string
  duration: number
  status: number
  cacheStatus?: string
  size: number
  error?: string
}

async function testEndpoint(url: string, name: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.text()
    const duration = Date.now() - startTime
    
    return {
      endpoint: name,
      duration,
      status: response.status,
      cacheStatus: response.headers.get('X-Cache-Status') || 'UNKNOWN',
      size: data.length,
      error: response.ok ? undefined : data
    }
  } catch (error: any) {
    return {
      endpoint: name,
      duration: Date.now() - startTime,
      status: 0,
      size: 0,
      error: error.message
    }
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n')
  
  if (!TEST_TOKEN) {
    console.error('❌ TEST_AUTH_TOKEN not set in environment')
    console.log('Set it to a valid auth token to run tests\n')
    process.exit(1)
  }

  const tests = [
    // Old APIs
    { url: `${API_BASE}/api/v2/student/growth`, name: 'Growth API (Old)' },
    { url: `${API_BASE}/api/v2/student/today`, name: 'Today API (Old)' },
    { url: `${API_BASE}/api/get-profile`, name: 'Profile API (Old)' },
    
    // New Optimized APIs
    { url: `${API_BASE}/api/v2/student/growth-optimized`, name: 'Growth API (Optimized)' },
    { url: `${API_BASE}/api/v2/student/today-optimized`, name: 'Today API (Optimized)' },
    { url: `${API_BASE}/api/v2/student/dashboard-unified`, name: 'Dashboard API (Unified)' }
  ]

  console.log('📊 Running first pass (cache MISS)...\n')
  const firstPass: TestResult[] = []
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name)
    firstPass.push(result)
    
    const statusEmoji = result.status === 200 ? '✅' : '❌'
    const durationColor = result.duration < 500 ? '\x1b[32m' : result.duration < 2000 ? '\x1b[33m' : '\x1b[31m'
    
    console.log(`${statusEmoji} ${test.name}:`)
    console.log(`   Duration: ${durationColor}${result.duration}ms\x1b[0m`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Cache: ${result.cacheStatus}`)
    console.log(`   Size: ${(result.size / 1024).toFixed(2)} KB`)
    if (result.error) console.log(`   Error: ${result.error}`)
    console.log()
  }

  // Wait a bit before second pass
  console.log('⏳ Waiting 2 seconds before second pass...\n')
  await new Promise(resolve => setTimeout(resolve, 2000))

  console.log('📊 Running second pass (cache HIT)...\n')
  const secondPass: TestResult[] = []
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name)
    secondPass.push(result)
    
    const statusEmoji = result.status === 200 ? '✅' : '❌'
    const durationColor = result.duration < 500 ? '\x1b[32m' : result.duration < 2000 ? '\x1b[33m' : '\x1b[31m'
    
    console.log(`${statusEmoji} ${test.name}:`)
    console.log(`   Duration: ${durationColor}${result.duration}ms\x1b[0m`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Cache: ${result.cacheStatus}`)
    console.log(`   Size: ${(result.size / 1024).toFixed(2)} KB`)
    if (result.error) console.log(`   Error: ${result.error}`)
    console.log()
  }

  // Generate comparison report
  console.log('📈 Performance Comparison:\n')
  console.log('┌─────────────────────────────┬──────────────┬──────────────┬─────────────┐')
  console.log('│ Endpoint                    │ First (MISS) │ Second (HIT) │ Improvement │')
  console.log('├─────────────────────────────┼──────────────┼──────────────┼─────────────┤')
  
  for (let i = 0; i < tests.length; i++) {
    const first = firstPass[i]
    const second = secondPass[i]
    const improvement = ((first.duration - second.duration) / first.duration * 100).toFixed(1)
    
    const name = tests[i].name.padEnd(27)
    const firstDur = `${first.duration}ms`.padEnd(12)
    const secondDur = `${second.duration}ms`.padEnd(12)
    const imp = `${improvement}%`.padEnd(11)
    
    console.log(`│ ${name} │ ${firstDur} │ ${secondDur} │ ${imp} │`)
  }
  
  console.log('└─────────────────────────────┴──────────────┴──────────────┴─────────────┘')

  // Calculate totals
  console.log('\n📊 Summary:\n')
  
  const oldTotal = firstPass.slice(0, 3).reduce((sum, r) => sum + r.duration, 0)
  const newTotal = secondPass.slice(3, 6).reduce((sum, r) => sum + r.duration, 0)
  const improvement = ((oldTotal - newTotal) / oldTotal * 100).toFixed(1)
  
  console.log(`Old APIs Total (Growth + Today + Profile): ${oldTotal}ms`)
  console.log(`New Unified API (Single Request): ${secondPass[5].duration}ms`)
  console.log(`Overall Improvement: \x1b[32m${improvement}%\x1b[0m`)
  console.log()
  
  // Targets
  console.log('🎯 Target Achievement:\n')
  const targets = [
    { name: 'Growth API', target: 500, actual: secondPass[3].duration },
    { name: 'Today API', target: 400, actual: secondPass[4].duration },
    { name: 'Unified API', target: 500, actual: secondPass[5].duration }
  ]
  
  targets.forEach(t => {
    const achieved = t.actual <= t.target
    const emoji = achieved ? '✅' : '⚠️'
    const color = achieved ? '\x1b[32m' : '\x1b[33m'
    console.log(`${emoji} ${t.name}: ${color}${t.actual}ms\x1b[0m / ${t.target}ms target ${achieved ? '(ACHIEVED)' : '(NEEDS WORK)'}`)
  })
  
  console.log('\n✨ Performance testing complete!')
}

// Run tests
runPerformanceTests().catch(console.error)
