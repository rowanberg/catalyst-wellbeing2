import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const accessKey = request.cookies.get('super_admin_key')?.value
    if (!accessKey || accessKey !== '4C4F52454D5F495053554D5F444F4C4F525F534954') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch all API keys
    const { data: keys, error } = await supabase
      .from('gemini_api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    // Calculate statistics
    const now = new Date()
    const stats = {
      total_keys: keys?.length || 0,
      active_keys: keys?.filter(k => !k.is_disabled).length || 0,
      disabled_keys: keys?.filter(k => k.is_disabled).length || 0,
      total_daily_requests: keys?.reduce((sum, k) => sum + (k.daily_request_count || 0), 0) || 0,
      keys_near_limit: keys?.filter(k => !k.is_disabled && k.daily_request_count >= 800).length || 0,
      keys_at_limit: keys?.filter(k => !k.is_disabled && k.daily_request_count >= 1000).length || 0,
      average_usage: keys && keys.length > 0 
        ? Math.round(keys.reduce((sum, k) => sum + (k.daily_request_count || 0), 0) / keys.length)
        : 0
    }

    // Process keys for display (mask the actual keys)
    const processedKeys = keys?.map(key => {
      const lastUsed = new Date(key.last_used_timestamp)
      const hoursSinceUsed = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60))
      
      const lastReset = new Date(key.last_reset_timestamp_daily)
      const hoursUntilReset = 24 - Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60))
      
      return {
        id: key.id,
        key_preview: key.encrypted_api_key.substring(0, 20) + '...' + key.encrypted_api_key.substring(key.encrypted_api_key.length - 10),
        daily_request_count: key.daily_request_count,
        daily_limit: 1000,
        usage_percentage: Math.round((key.daily_request_count / 1000) * 100),
        current_minute_request_count: key.current_minute_request_count,
        minute_limit: 15,
        is_disabled: key.is_disabled,
        last_used_timestamp: key.last_used_timestamp,
        hours_since_used: hoursSinceUsed,
        hours_until_reset: Math.max(0, hoursUntilReset),
        created_at: key.created_at,
        status: key.is_disabled 
          ? 'disabled' 
          : key.daily_request_count >= 1000 
            ? 'at_limit' 
            : key.daily_request_count >= 800 
              ? 'near_limit' 
              : 'active'
      }
    }) || []

    return NextResponse.json({
      success: true,
      stats,
      keys: processedKeys
    })
  } catch (error: any) {
    console.error('API Keys endpoint error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Toggle key enabled/disabled status
export async function PATCH(request: NextRequest) {
  try {
    // Verify super admin authentication
    const accessKey = request.cookies.get('super_admin_key')?.value
    if (!accessKey || accessKey !== '4C4F52454D5F495053554D5F444F4C4F525F534954') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { keyId, isDisabled } = await request.json()

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error } = await supabase
      .from('gemini_api_keys')
      .update({ is_disabled: isDisabled })
      .eq('id', keyId)

    if (error) {
      console.error('Error updating API key:', error)
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PATCH API Keys endpoint error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
