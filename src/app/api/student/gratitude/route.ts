import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import { apiCache, createCacheKey } from '@/lib/utils/apiCache'
import { createCachedResponse, CacheStrategies } from '@/lib/api/cache-headers'

// export const dynamic = 'force-dynamic' // Removed for Capacitor

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth

    // Check cache first
    const cacheKey = createCacheKey(`gratitude_entries_${userId}`)
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      return createCachedResponse(cachedData, CacheStrategies.SHORT_CACHE)
    }

    // Get gratitude entries
    const { data: entries, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching gratitude entries:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    const responseData = { entries: entries || [] }
    
    // Cache the response for 5 minutes
    apiCache.set(cacheKey, responseData, 5)
    
    return createCachedResponse(responseData, CacheStrategies.SHORT_CACHE)

  } catch (error) {
    console.error('Gratitude GET API error:', error)
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
    const { content } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Insert gratitude entry
    const { data: entryData, error: entryError } = await supabase
      .from('gratitude_entries')
      .insert({
        user_id: userId,
        content: content.trim()
      })
      .select()
      .single()
    
    if (entryError) {
      console.error('Error inserting gratitude entry:', entryError)
      return NextResponse.json({ error: entryError.message }, { status: 400 })
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
    
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp: newXp,
          gems: newGems,
          level: newLevel
        })
        .eq('user_id', userId)
    
      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    // Invalidate cache on new entry
    const cacheKey = createCacheKey(`gratitude_entries_${userId}`)
    apiCache.delete(cacheKey)
    
    return NextResponse.json({ 
      success: true, 
      entry_id: entryData.id,
      xpGained: 15,
      gemsGained: 3
    })

  } catch (error) {
    console.error('Gratitude POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
