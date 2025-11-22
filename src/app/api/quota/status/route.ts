import { NextRequest, NextResponse } from 'next/server'
import { createClient, User, AuthError } from '@supabase/supabase-js'
import { getUserQuotaStatus } from '@/lib/ai/quotaManager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// In-memory cache for quota status (1 minute TTL)
const quotaCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Check cache first
    const now = Date.now()
    const cached = quotaCache.get(token)
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Cache': 'HIT'
        }
      })
    }

    // Lightweight auth validation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )

    let user: User | null = null
    let error: AuthError | null = null

    // Retry logic for getUser with backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await supabase.auth.getUser(token)
        user = result.data.user
        error = result.error

        if (user || (error && error.status === 401)) {
          // If we got a user or a definitive auth error, stop retrying
          break
        }

        // If other error (like timeout), throw to trigger retry
        if (error) throw error

      } catch (e) {
        console.warn(`[QuotaStatus] Attempt ${attempt + 1} failed:`, e)
        if (attempt === 2) {
          // Last attempt failed
          console.error('[QuotaStatus] All auth attempts failed')
          return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 })
        }
        // Wait before retry (500ms, 1000ms)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)))
      }
    }

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const quotaStatus = await getUserQuotaStatus(user.id)

    // Store in cache
    quotaCache.set(token, { data: quotaStatus, timestamp: now })

    // Cleanup old cache entries (every 100 requests)
    if (quotaCache.size > 100) {
      const cutoff = now - CACHE_TTL
      Array.from(quotaCache.entries()).forEach(([key, value]) => {
        if (value.timestamp < cutoff) {
          quotaCache.delete(key)
        }
      })
    }

    return NextResponse.json(quotaStatus, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('[QuotaStatus] Error:', error)
    return NextResponse.json({ error: 'Failed to get quota status' }, { status: 500 })
  }
}
