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

    // Get admin profile to verify role and get school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!profile.school_id) {
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    // Get school's Gemini configuration
    const { data: config, error } = await supabase
      .from('school_gemini_config')
      .select('api_key, selected_model, is_active, created_at, configured_by')
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching school Gemini config:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    if (!config) {
      return NextResponse.json({
        apiKey: '',
        selectedModel: 'gemini-1.5-flash',
        isConfigured: false
      })
    }

    // Mask API key for display (show first 8 and last 4 characters)
    const maskedApiKey = config.api_key.length > 12 
      ? config.api_key.substring(0, 8) + '...' + config.api_key.substring(config.api_key.length - 4)
      : config.api_key

    return NextResponse.json({
      apiKey: maskedApiKey,
      selectedModel: config.selected_model || 'gemini-1.5-flash',
      isConfigured: !!config.api_key,
      configuredAt: config.created_at
    })

  } catch (error) {
    console.error('Error in GET /api/admin/gemini-config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // Get admin profile to verify role and get school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!profile.school_id) {
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    const { apiKey, selectedModel } = await request.json()

    if (!apiKey || !selectedModel) {
      return NextResponse.json({ error: 'API key and model selection are required' }, { status: 400 })
    }

    // Validate API key format (basic validation)
    if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
      return NextResponse.json({ error: 'Invalid API key format. Gemini API keys start with "AIza"' }, { status: 400 })
    }

    // Upsert the school's Gemini configuration
    const { error } = await supabase
      .from('school_gemini_config')
      .upsert({
        school_id: profile.school_id,
        api_key: apiKey, // Store in plain text as requested
        selected_model: selectedModel,
        configured_by: user.id,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'school_id'
      })

    if (error) {
      console.error('Error saving school Gemini config:', error)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'School Gemini configuration saved successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/gemini-config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
