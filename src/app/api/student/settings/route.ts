import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student settings (can be stored in profiles or a separate settings table)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Settings fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return default settings structure
    const settings = {
      theme: profile.theme || 'system',
      notifications: profile.notifications ?? true,
      soundEffects: profile.sound_effects ?? true,
      privateProfile: profile.private_profile ?? false,
      autoSave: profile.auto_save ?? true,
      animations: profile.animations ?? true,
      hapticFeedback: profile.haptic_feedback ?? true,
      dataSync: profile.data_sync ?? true,
      fontSize: profile.font_size || 16,
      language: profile.language || 'English'
    }

    return NextResponse.json({ 
      settings,
      success: true 
    })

  } catch (error) {
    console.error('Student settings error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 })
    }

    // Update profile with new settings
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        theme: settings.theme,
        notifications: settings.notifications,
        sound_effects: settings.soundEffects,
        private_profile: settings.privateProfile,
        auto_save: settings.autoSave,
        animations: settings.animations,
        haptic_feedback: settings.hapticFeedback,
        data_sync: settings.dataSync,
        font_size: settings.fontSize,
        language: settings.language,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Settings update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update settings',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
