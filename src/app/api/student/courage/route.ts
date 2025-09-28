import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get courage entries
    const { data: entries, error } = await supabase
      .from('courage_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courage entries:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json({ entries: entries || [] })

  } catch (error) {
    console.error('Courage GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { content } = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Insert courage entry
    const { data: entryData, error: entryError } = await supabase
      .from('courage_log')
      .insert({
        user_id: user.id,
        content: content.trim()
      })
      .select()
      .single()

    if (entryError) {
      console.error('Error inserting courage entry:', entryError)
      return NextResponse.json({ error: entryError.message }, { status: 400 })
    }

    // Update profile XP and gems
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, gems')
      .eq('user_id', user.id)
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
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      entry_id: entryData.id,
      xpGained: 15,
      gemsGained: 3
    })

  } catch (error) {
    console.error('Courage POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
