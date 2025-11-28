import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications/check-token
 * Check if the current user has an active FCM token
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Check for active FCM tokens
        const { data: tokens, error: tokensError } = await supabase
            .from('fcm_tokens')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)

        if (tokensError) {
            return NextResponse.json(
                { error: 'Failed to fetch tokens', details: tokensError.message },
                { status: 500 }
            )
        }

        // Get user profile info
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, role')
            .eq('user_id', user.id)
            .single()

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                profile: profile
            },
            hasTokens: tokens && tokens.length > 0,
            tokenCount: tokens?.length || 0,
            tokens: tokens?.map(t => ({
                device_type: t.device_type,
                device_name: t.device_name,
                created_at: t.created_at,
                last_used_at: t.last_used_at
            }))
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
