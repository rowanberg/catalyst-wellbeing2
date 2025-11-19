import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import { apiCache, createCacheKey } from '@/lib/utils/apiCache'
import { createCachedResponse, CacheStrategies } from '@/lib/api/cache-headers'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth

    // Check cache first (25-minute cache for kindness counter)
    const cacheKey = createCacheKey(`kindness_counter_${userId}`)
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      return createCachedResponse(cachedData, CacheStrategies.LONG_CACHE)
    }

    // Get kindness counter data
    const { data: counterData, error: counterError } = await supabase
      .from('kindness_counter')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (counterError && counterError.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({ error: counterError.message }, { status: 400 })
    }

    // For now, return empty recent entries since we're using existing schema
    // TODO: Implement proper entries tracking after database migration
    const mockRecentEntries = counterData ? [
      {
        id: '1',
        description: counterData.description || 'Recent act of kindness',
        created_at: counterData.last_updated || new Date().toISOString()
      }
    ].filter(entry => entry.description !== 'Recent act of kindness') : []

    // Return data or default values
    const responseData = {
      count: counterData?.count || 0,
      last_updated: counterData?.last_updated || new Date().toISOString(),
      recent_entries: mockRecentEntries
    }
    
    // Cache the response for 25 minutes
    apiCache.set(cacheKey, responseData, 25)
    
    return createCachedResponse(responseData, CacheStrategies.LONG_CACHE)

  } catch (error: any) {
    console.error('Kindness GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const { description } = await request.json()
    
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Get current counter or create new one
    const { data: counterData } = await supabase
      .from('kindness_counter')
      .select('count')
      .eq('user_id', userId)
      .single()

    const newCount = (counterData?.count || 0) + 1

    // Update kindness counter with description
    const { data: updatedCounter, error: counterError } = await supabase
      .from('kindness_counter')
      .upsert({
        user_id: userId,
        count: newCount,
        description: description.trim(),
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (counterError) {
      console.error('Counter update error:', counterError)
      return NextResponse.json({ error: counterError.message }, { status: 400 })
    }

    // Update profile XP and gems
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, gems')
      .eq('user_id', userId)
      .single()

    if (profile) {
      const newXp = (profile.xp || 0) + 15
      const newGems = (profile.gems || 0) + 3
      const newLevel = Math.floor(newXp / 100) + 1

      await supabase
        .from('profiles')
        .update({
          xp: newXp,
          gems: newGems,
          level: newLevel
        })
        .eq('user_id', userId)
    }

    // Invalidate cache on new kindness entry
    const cacheKey = createCacheKey(`kindness_counter_${userId}`)
    apiCache.delete(cacheKey)

    return NextResponse.json({ 
      success: true, 
      entry_id: updatedCounter?.id || Date.now().toString(),
      count: newCount,
      gemsGained: 3
    })

  } catch (error: any) {
    console.error('Kindness POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
