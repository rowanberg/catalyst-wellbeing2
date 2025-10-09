import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/teacher/settings - Fetch teacher settings
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      )
    }

    // Get or create teacher settings using the database function
    const { data: settings, error: settingsError } = await supabase
      .rpc('get_or_create_teacher_settings', { teacher_user_id: user.id })

    if (settingsError) {
      console.error('Error fetching teacher settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Transform database format to frontend format
    const transformedSettings = {
      emailNotifications: settings.email_notifications,
      pushNotifications: settings.push_notifications,
      classUpdates: settings.class_updates,
      parentMessages: settings.parent_messages,
      systemAlerts: settings.system_alerts,
      weeklyReports: settings.weekly_reports,
      
      profileVisibility: settings.profile_visibility,
      showEmail: settings.show_email,
      showPhone: settings.show_phone,
      twoFactorAuth: settings.two_factor_auth,
      sessionTimeout: settings.session_timeout,
      
      autoSaveGrades: settings.auto_save_grades,
      soundEffects: settings.sound_effects,
      animations: settings.animations,
      hapticFeedback: settings.haptic_feedback,
      classroomMode: settings.classroom_mode,
      
      whatsappEnabled: settings.whatsapp_enabled,
      whatsappPhoneNumber: settings.whatsapp_phone_number || '',
      whatsappAutoReply: settings.whatsapp_auto_reply,
      whatsappParentNotifications: settings.whatsapp_parent_notifications,
      whatsappStudentUpdates: settings.whatsapp_student_updates,
      whatsappBusinessAccount: settings.whatsapp_business_account,
      
      geminiEnabled: settings.gemini_enabled,
      geminiApiKey: settings.gemini_api_key || '',
      geminiModel: settings.gemini_model,
      geminiAutoGrading: settings.gemini_auto_grading,
      geminiContentGeneration: settings.gemini_content_generation,
      geminiStudentSupport: settings.gemini_student_support
    }

    return NextResponse.json({
      success: true,
      settings: transformedSettings
    })

  } catch (error) {
    console.error('Teacher settings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/teacher/settings - Update teacher settings
export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      )
    }

    // Update teacher settings using the database function
    const { data: updatedSettings, error: updateError } = await supabase
      .rpc('update_teacher_settings', {
        teacher_user_id: user.id,
        settings_json: settings
      })

    if (updateError) {
      console.error('Error updating teacher settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Transform database format to frontend format
    const transformedSettings = {
      emailNotifications: updatedSettings.email_notifications,
      pushNotifications: updatedSettings.push_notifications,
      classUpdates: updatedSettings.class_updates,
      parentMessages: updatedSettings.parent_messages,
      systemAlerts: updatedSettings.system_alerts,
      weeklyReports: updatedSettings.weekly_reports,
      
      profileVisibility: updatedSettings.profile_visibility,
      showEmail: updatedSettings.show_email,
      showPhone: updatedSettings.show_phone,
      twoFactorAuth: updatedSettings.two_factor_auth,
      sessionTimeout: updatedSettings.session_timeout,
      
      autoSaveGrades: updatedSettings.auto_save_grades,
      soundEffects: updatedSettings.sound_effects,
      animations: updatedSettings.animations,
      hapticFeedback: updatedSettings.haptic_feedback,
      classroomMode: updatedSettings.classroom_mode,
      
      whatsappEnabled: updatedSettings.whatsapp_enabled,
      whatsappPhoneNumber: updatedSettings.whatsapp_phone_number || '',
      whatsappAutoReply: updatedSettings.whatsapp_auto_reply,
      whatsappParentNotifications: updatedSettings.whatsapp_parent_notifications,
      whatsappStudentUpdates: updatedSettings.whatsapp_student_updates,
      whatsappBusinessAccount: updatedSettings.whatsapp_business_account,
      
      geminiEnabled: updatedSettings.gemini_enabled,
      geminiApiKey: updatedSettings.gemini_api_key || '',
      geminiModel: updatedSettings.gemini_model,
      geminiAutoGrading: updatedSettings.gemini_auto_grading,
      geminiContentGeneration: updatedSettings.gemini_content_generation,
      geminiStudentSupport: updatedSettings.gemini_student_support
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: transformedSettings
    })

  } catch (error) {
    console.error('Teacher settings PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/teacher/settings - Create default teacher settings
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      )
    }

    // Create default settings using the database function
    const { data: settings, error: settingsError } = await supabase
      .rpc('get_or_create_teacher_settings', { teacher_user_id: user.id })

    if (settingsError) {
      console.error('Error creating teacher settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to create settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Default settings created successfully',
      settings
    })

  } catch (error) {
    console.error('Teacher settings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
