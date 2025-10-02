# 🛠️ Optimization Implementation Scripts & Tools
## Automated Scripts for Quick Fixes

**Generated:** 2025-10-02  
**Purpose:** Ready-to-run scripts for implementing optimizations

---

## 📦 SETUP SCRIPTS

### 1. Create Required Directories

```bash
#!/bin/bash
# setup-optimization.sh

echo "🚀 Setting up optimization structure..."

# Create lib directories
mkdir -p src/lib/supabase
mkdir -p src/lib/cache
mkdir -p src/lib/api
mkdir -p src/lib/utils

# Create database directories
mkdir -p database/migrations
mkdir -p database/rollbacks
mkdir -p database/functions
mkdir -p database/seed
mkdir -p database/debug

# Create docs directory
mkdir -p docs/getting-started
mkdir -p docs/features
mkdir -p docs/api
mkdir -p docs/deployment
mkdir -p docs/troubleshooting

echo "✅ Directories created!"
```

---

## 🔍 ANALYSIS SCRIPTS

### 2. Find All Console.log Usage

```bash
#!/bin/bash
# find-console-logs.sh

echo "🔍 Finding all console.log statements..."

# Create report
OUTPUT="console-log-report.txt"
echo "Console.log Analysis Report" > $OUTPUT
echo "Generated: $(date)" >> $OUTPUT
echo "================================" >> $OUTPUT
echo "" >> $OUTPUT

# Find and count
echo "Files with console.log:" >> $OUTPUT
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" | \
  cut -d: -f1 | sort | uniq -c | sort -rn >> $OUTPUT

echo "" >> $OUTPUT
echo "Total occurrences:" >> $OUTPUT
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" | wc -l >> $OUTPUT

echo "" >> $OUTPUT
echo "Top 10 files:" >> $OUTPUT
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -10 >> $OUTPUT

cat $OUTPUT
echo ""
echo "✅ Report saved to $OUTPUT"
```

### 3. Analyze Component Sizes

```bash
#!/bin/bash
# analyze-component-sizes.sh

echo "📏 Analyzing component file sizes..."

OUTPUT="component-sizes.txt"
echo "Component Size Analysis" > $OUTPUT
echo "Generated: $(date)" >> $OUTPUT
echo "================================" >> $OUTPUT
echo "" >> $OUTPUT

echo "Components larger than 10KB:" >> $OUTPUT
find src/components -name "*.tsx" -type f -size +10k -exec ls -lh {} \; | \
  awk '{print $5 "\t" $9}' | sort -rh >> $OUTPUT

echo "" >> $OUTPUT
echo "Top 20 largest components:" >> $OUTPUT
find src/components -name "*.tsx" -type f -exec ls -lh {} \; | \
  awk '{print $5 "\t" $9}' | sort -rh | head -20 >> $OUTPUT

cat $OUTPUT
echo ""
echo "✅ Report saved to $OUTPUT"
```

### 4. Find Duplicate Supabase Client Creation

```bash
#!/bin/bash
# find-supabase-clients.sh

echo "🔍 Finding Supabase client creation..."

OUTPUT="supabase-clients.txt"
echo "Supabase Client Creation Analysis" > $OUTPUT
echo "Generated: $(date)" >> $OUTPUT
echo "================================" >> $OUTPUT
echo "" >> $OUTPUT

echo "Files creating Supabase clients:" >> $OUTPUT
grep -r "createClient" src/ --include="*.ts" --include="*.tsx" | \
  grep -v "node_modules" >> $OUTPUT

echo "" >> $OUTPUT
echo "Total files:" >> $OUTPUT
grep -r "createClient" src/ --include="*.ts" --include="*.tsx" | \
  cut -d: -f1 | sort | uniq | wc -l >> $OUTPUT

cat $OUTPUT
echo ""
echo "✅ Report saved to $OUTPUT"
```

---

## 🔧 MIGRATION SCRIPTS

### 5. Create Logger Utility

```bash
#!/bin/bash
# create-logger.sh

echo "📝 Creating logger utility..."

cat > src/lib/logger.ts << 'EOF'
/**
 * Environment-aware logging utility
 * Replaces console.log with conditional logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  component?: string
  function?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? JSON.stringify(context) : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isTest) return false
    if (level === 'error' || level === 'warn') return true
    return this.isDevelopment
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error
    console.error(this.formatMessage('error', message, { ...context, error: errorDetails }))
  }

  // API-specific logging
  api(method: string, path: string, status: number, duration?: number) {
    const message = `${method} ${path} - ${status}`
    const context = duration ? { duration: `${duration}ms` } : undefined
    
    if (status >= 500) {
      this.error(message, undefined, context)
    } else if (status >= 400) {
      this.warn(message, context)
    } else {
      this.info(message, context)
    }
  }

  // Performance logging
  perf(label: string, duration: number) {
    this.info(`Performance: ${label}`, { duration: `${duration}ms` })
  }
}

export const logger = new Logger()

// Convenience exports
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const apiLog = logger.api.bind(logger)
export const perfLog = logger.perf.bind(logger)
EOF

echo "✅ Logger utility created at src/lib/logger.ts"
```

### 6. Create Supabase Singleton

```bash
#!/bin/bash
# create-supabase-singleton.sh

echo "📝 Creating Supabase singleton..."

cat > src/lib/supabase/admin-client.ts << 'EOF'
/**
 * Supabase Admin Client Singleton
 * Prevents connection pool exhaustion
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { logger } from '@/lib/logger'

let supabaseAdminInstance: SupabaseClient<Database> | null = null

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase credentials. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  supabaseAdminInstance = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-app-name': 'catalyst',
        'x-app-version': process.env.npm_package_version || '1.0.0',
      },
    },
  })

  logger.info('Supabase admin client initialized')

  return supabaseAdminInstance
}

// Reset function for testing
export function resetSupabaseAdmin() {
  supabaseAdminInstance = null
}
EOF

echo "✅ Supabase singleton created at src/lib/supabase/admin-client.ts"
```

### 7. Create Profile Cache

```bash
#!/bin/bash
# create-profile-cache.sh

echo "📝 Creating profile cache..."

cat > src/lib/cache/profile-cache.ts << 'EOF'
/**
 * Profile Caching System
 * Reduces database queries for frequently accessed profiles
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ProfileCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000

  set<T>(key: string, data: T, ttl?: number): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl

    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    logger.debug('Profile cache cleared')
  }

  cleanup(): void {
    const now = Date.now()
    let deletedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Profile cache cleanup: removed ${deletedCount} expired entries`)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilizationPercent: (this.cache.size / this.MAX_CACHE_SIZE) * 100,
    }
  }
}

export const profileCache = new ProfileCache()

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => profileCache.cleanup(), 5 * 60 * 1000)
}

/**
 * Helper function to get profile with caching
 */
export async function getCachedProfile(
  userId: string,
  supabase: SupabaseClient
) {
  const cacheKey = `profile:${userId}`

  // Check cache first
  const cached = profileCache.get(cacheKey)
  if (cached) {
    logger.debug('Profile cache hit', { userId })
    return cached
  }

  // Fetch from database
  logger.debug('Profile cache miss', { userId })
  const startTime = Date.now()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, school_id, avatar_url, created_at')
    .eq('id', userId)
    .single()

  const duration = Date.now() - startTime
  logger.perf('Profile fetch', duration)

  if (error) {
    logger.error('Failed to fetch profile', error, { userId })
    throw error
  }

  // Cache the result
  profileCache.set(cacheKey, data)

  return data
}

/**
 * Invalidate profile cache when updated
 */
export function invalidateProfileCache(userId: string) {
  const cacheKey = `profile:${userId}`
  profileCache.delete(cacheKey)
  logger.debug('Profile cache invalidated', { userId })
}
EOF

echo "✅ Profile cache created at src/lib/cache/profile-cache.ts"
```

### 8. Create API Response Helper

```bash
#!/bin/bash
# create-api-response.sh

echo "📝 Creating API response helper..."

cat > src/lib/api/response.ts << 'EOF'
/**
 * Standardized API Response Helper
 * Ensures consistent response format across all endpoints
 */

import { NextResponse } from 'next/server'

interface SuccessResponse<T> {
  success: true
  data: T
  timestamp: string
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    [key: string]: any
  }
}

interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: any
  }
  timestamp: string
}

export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(
    data: T,
    status: number = 200,
    meta?: SuccessResponse<T>['meta']
  ): NextResponse<SuccessResponse<T>> {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }

    if (meta) {
      response.meta = meta
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Error response
   */
  static error(
    message: string,
    status: number = 400,
    code?: string,
    details?: any
  ): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Common error responses
   */
  static badRequest(message: string = 'Bad Request'): NextResponse {
    return this.error(message, 400, 'BAD_REQUEST')
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return this.error(message, 401, 'UNAUTHORIZED')
  }

  static forbidden(message: string = 'Forbidden'): NextResponse {
    return this.error(message, 403, 'FORBIDDEN')
  }

  static notFound(message: string = 'Not Found'): NextResponse {
    return this.error(message, 404, 'NOT_FOUND')
  }

  static conflict(message: string = 'Conflict'): NextResponse {
    return this.error(message, 409, 'CONFLICT')
  }

  static tooManyRequests(
    message: string = 'Too Many Requests',
    retryAfter?: number
  ): NextResponse {
    const response = this.error(message, 429, 'TOO_MANY_REQUESTS')
    
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString())
    }
    
    return response
  }

  static internalError(
    message: string = 'Internal Server Error',
    error?: Error
  ): NextResponse {
    return this.error(
      message,
      500,
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? error?.stack : undefined
    )
  }

  /**
   * Response with caching
   */
  static cached<T>(
    data: T,
    cacheSeconds: number = 60,
    status: number = 200
  ): NextResponse<SuccessResponse<T>> {
    const response = this.success(data, status)
    
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${Math.floor(cacheSeconds / 2)}`
    )
    
    return response
  }
}
EOF

echo "✅ API response helper created at src/lib/api/response.ts"
```

---

## 🗃️ DATABASE SCRIPTS

### 9. Create Database Index Script

```bash
#!/bin/bash
# create-indexes.sh

echo "📝 Creating database indexes script..."

cat > database/migrations/001_add_performance_indexes.sql << 'EOF'
-- Performance Indexes for Catalyst
-- Generated: 2025-10-02
-- Purpose: Improve query performance for frequently accessed tables

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_school_role ON profiles(school_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Classes table indexes
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level_id ON classes(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_grade ON classes(school_id, grade_level_id);

-- Teacher assignments indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id 
  ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id 
  ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_school 
  ON teacher_class_assignments(teacher_id, school_id);

-- Student assignments indexes
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id 
  ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_class_id 
  ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_class 
  ON student_class_assignments(student_id, class_id);

-- Assessments indexes
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_due_date ON assessments(due_date);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_student 
  ON grades(assessment_id, student_id);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date 
  ON attendance(student_id, attendance_date);

-- Help requests indexes
CREATE INDEX IF NOT EXISTS idx_help_requests_student_id ON help_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_school_id ON help_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON help_requests(created_at);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_classes 
  ON classes(school_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pending_help_requests 
  ON help_requests(created_at) 
  WHERE status = 'pending';

-- Analyze tables for query planner
ANALYZE profiles;
ANALYZE classes;
ANALYZE teacher_class_assignments;
ANALYZE student_class_assignments;
ANALYZE assessments;
ANALYZE grades;
ANALYZE attendance;
ANALYZE help_requests;

-- Create index usage view
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

COMMENT ON VIEW index_usage_stats IS 'Monitor index usage for optimization';
EOF

echo "✅ Index script created at database/migrations/001_add_performance_indexes.sql"
```

### 10. Consolidate SQL Files Script

```bash
#!/bin/bash
# consolidate-sql-files.sh

echo "📦 Consolidating SQL files..."

# Move existing SQL files to migrations
echo "Moving SQL files to database/migrations/..."
mv *.sql database/migrations/ 2>/dev/null || true

# Organize by purpose
cd database/migrations

# Create organized structure
mkdir -p schema functions debug seed

echo "Organizing files..."

# Move schema files
mv *schema*.sql schema/ 2>/dev/null || true
mv *setup*.sql schema/ 2>/dev/null || true
mv create_*.sql schema/ 2>/dev/null || true

# Move function files
mv *function*.sql functions/ 2>/dev/null || true

# Move debug files
mv debug_*.sql debug/ 2>/dev/null || true
mv check_*.sql debug/ 2>/dev/null || true
mv analyze_*.sql debug/ 2>/dev/null || true

# Move fix files
mv fix_*.sql debug/ 2>/dev/null || true

# Create README
cat > README.md << 'SQLEOF'
# Database Migrations

## Structure
- `schema/` - Table and schema definitions
- `functions/` - Database functions and procedures
- `debug/` - Diagnostic and debugging queries
- `seed/` - Sample data for development

## Running Migrations
Run migrations in numerical order:
```bash
psql -f 001_add_performance_indexes.sql
psql -f 002_next_migration.sql
```

## Rollback
Run corresponding rollback script:
```bash
psql -f rollbacks/001_rollback.sql
```
SQLEOF

cd ../..

echo "✅ SQL files consolidated in database/migrations/"
echo "📁 Structure:"
tree database/migrations -L 2
```

---

## 🧪 TESTING SCRIPTS

### 11. Performance Testing Script

```bash
#!/bin/bash
# test-performance.sh

echo "🧪 Running performance tests..."

# Test API response times
echo "Testing API endpoints..."
for endpoint in "/api/teacher/students" "/api/student/dashboard" "/api/admin/stats"; do
  echo "Testing $endpoint..."
  time curl -s "http://localhost:3000$endpoint" > /dev/null
  echo ""
done

# Test database query times
echo "Testing database queries..."
cat > test_queries.sql << 'EOF'
\timing on

-- Test profile query
EXPLAIN ANALYZE
SELECT * FROM profiles WHERE school_id = '123' LIMIT 50;

-- Test class query
EXPLAIN ANALYZE
SELECT * FROM classes WHERE school_id = '123';

-- Test join query
EXPLAIN ANALYZE
SELECT p.*, c.class_name
FROM profiles p
JOIN student_class_assignments sca ON p.id = sca.student_id
JOIN classes c ON sca.class_id = c.id
WHERE p.school_id = '123'
LIMIT 50;
EOF

psql < test_queries.sql

rm test_queries.sql

echo "✅ Performance tests complete"
```

---

## 🚀 DEPLOYMENT SCRIPTS

### 12. Pre-deployment Checklist

```bash
#!/bin/bash
# pre-deploy-check.sh

echo "✅ Pre-deployment Checklist"
echo "=========================="

# Check for console.log
CONSOLE_COUNT=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ $CONSOLE_COUNT -gt 0 ]; then
  echo "⚠️  Warning: $CONSOLE_COUNT console.log statements found"
else
  echo "✅ No console.log statements"
fi

# Check bundle size
echo "📦 Building production bundle..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
  echo "Bundle size:"
  du -sh .next/static/chunks | awk '{print "  " $1}'
else
  echo "❌ Build failed"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Tests passed"
else
  echo "⚠️  Some tests failed"
fi

# Check environment variables
echo "🔐 Checking environment variables..."
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    MISSING=1
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "✅ All required env vars present"
fi

echo ""
echo "=========================="
echo "✅ Pre-deployment check complete"
```

---

## 📊 MONITORING SCRIPTS

### 13. Performance Monitoring

```typescript
// src/lib/monitoring/performance.ts
// Created by scripts/create-monitoring.sh

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export function reportWebVitals(metric: any) {
  const { name, value, rating, id } = metric

  const perfMetric: PerformanceMetric = {
    name,
    value,
    rating,
    timestamp: Date.now(),
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', perfMetric)
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfMetric),
    }).catch(console.error)
  }
}
```

---

## 🎯 ALL-IN-ONE SETUP

### 14. Complete Setup Script

```bash
#!/bin/bash
# setup-all-optimizations.sh

echo "🚀 Setting up ALL optimizations..."
echo "================================="

# 1. Create directories
./scripts/setup-optimization.sh

# 2. Create utilities
./scripts/create-logger.sh
./scripts/create-supabase-singleton.sh
./scripts/create-profile-cache.sh
./scripts/create-api-response.sh

# 3. Create database migrations
./scripts/create-indexes.sh

# 4. Consolidate SQL files
./scripts/consolidate-sql-files.sh

# 5. Run analysis
./scripts/find-console-logs.sh
./scripts/analyze-component-sizes.sh
./scripts/find-supabase-clients.sh

# 6. Install additional dependencies
echo "📦 Installing additional dependencies..."
npm install --save-dev @next/bundle-analyzer
npm install @tanstack/react-query

echo ""
echo "✅ All optimizations setup complete!"
echo ""
echo "Next steps:"
echo "1. Review generated reports"
echo "2. Replace console.log with logger"
echo "3. Update imports to use singletons"
echo "4. Run database migrations"
echo "5. Test thoroughly"
echo "6. Deploy!"
```

---

## 📝 USAGE INSTRUCTIONS

### Running the Scripts

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run individual scripts
./scripts/create-logger.sh
./scripts/create-supabase-singleton.sh

# Or run all at once
./scripts/setup-all-optimizations.sh
```

### Integration into package.json

```json
{
  "scripts": {
    "optimize:setup": "bash scripts/setup-all-optimizations.sh",
    "optimize:analyze": "bash scripts/find-console-logs.sh && bash scripts/analyze-component-sizes.sh",
    "optimize:test": "bash scripts/test-performance.sh",
    "pre-deploy": "bash scripts/pre-deploy-check.sh"
  }
}
```

---

**All scripts ready to use! Run setup-all-optimizations.sh to begin.**
