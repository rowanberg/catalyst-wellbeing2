import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { questType, completed } = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Define XP and gems for different quest types
    const questRewards = {
      gratitude: { xp: 15, gems: 3 },
      kindness: { xp: 20, gems: 4 },
      courage: { xp: 25, gems: 5 },
      breathing: { xp: 10, gems: 2 },
      water: { xp: 8, gems: 2 },
      sleep: { xp: 12, gems: 3 }
    }
    
    const reward = questRewards[questType as keyof typeof questRewards] || { xp: 10, gems: 2 }
    
    // For uncompleting, we need to check what was previously earned
    let xpEarned = 0
    let gemsEarned = 0
    
    if (completed) {
      xpEarned = reward.xp
      gemsEarned = reward.gems
    } else {
      // When uncompleting, check what was previously earned to subtract correctly
      const { data: existingQuest } = await supabase
        .from('daily_quests')
        .select('xp_earned, gems_earned')
        .eq('user_id', user.id)
        .eq('quest_type', questType)
        .eq('date', today)
        .single()

      xpEarned = -(existingQuest?.xp_earned || 0) // Negative to indicate removal
      gemsEarned = -(existingQuest?.gems_earned || 0) // Negative to indicate removal
    }

    // Upsert daily quest
    const { data: questData, error: questError } = await supabase
      .from('daily_quests')
      .upsert({
        user_id: user.id,
        quest_type: questType,
        completed,
        date: today,
        xp_earned: xpEarned,
        gems_earned: gemsEarned,
        completed_at: completed ? new Date().toISOString() : null
      }, {
        onConflict: 'user_id,quest_type,date'
      })
      .select()
      .single()

    if (questError) {
      return NextResponse.json({ error: questError.message }, { status: 400 })
    }

    // Always update user stats regardless of completion status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, gems, total_quests_completed, pet_happiness')
      .eq('user_id', user.id)
      .single()

    console.log('Current profile:', profile)

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    if (profile) {
      let newXp, newGems, newTotalQuests, newPetHappiness
      
      if (completed) {
        // Adding points for completion
        newXp = (profile.xp || 0) + xpEarned
        newGems = (profile.gems || 0) + gemsEarned
        newTotalQuests = (profile.total_quests_completed || 0) + 1
        newPetHappiness = Math.min(100, (profile.pet_happiness || 85) + 5)
      } else {
        // Check if quest was previously completed today to avoid double subtraction
        const { data: existingQuest } = await supabase
          .from('daily_quests')
          .select('xp_earned, gems_earned')
          .eq('user_id', user.id)
          .eq('quest_type', questType)
          .eq('date', today)
          .single()

        const prevXpEarned = existingQuest?.xp_earned || 0
        const prevGemsEarned = existingQuest?.gems_earned || 0

        // Removing points for uncompleting
        newXp = Math.max(0, (profile.xp || 0) - prevXpEarned)
        newGems = Math.max(0, (profile.gems || 0) - prevGemsEarned)
        newTotalQuests = Math.max(0, (profile.total_quests_completed || 0) - 1)
        newPetHappiness = Math.max(0, (profile.pet_happiness || 85) - 5)
      }
      
      const newLevel = Math.floor(newXp / 100) + 1

      console.log('Updating profile with:', { newXp, newGems, newLevel, newTotalQuests, newPetHappiness })

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp: newXp,
          gems: newGems,
          level: newLevel,
          total_quests_completed: newTotalQuests,
          pet_happiness: newPetHappiness
        })
        .eq('user_id', user.id)
        
      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    console.log('Quest API returning:', { 
      success: true, 
      questType,
      completed,
      xpGained: xpEarned,
      gemsGained: gemsEarned
    })

    return NextResponse.json({ 
      success: true, 
      data: questData,
      xpGained: xpEarned,
      gemsGained: gemsEarned
    })

  } catch (error: any) {
    console.error('Quest API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
