/**
 * OAuth User Info Endpoint
 * GET /api/oauth/userinfo - Get user info for authenticated token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateOAuthRequest, oauthErrorResponse, hasScope } from '@/lib/auth/oauth-api-auth'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export async function GET(request: NextRequest) {
    const auth = await authenticateOAuthRequest(request, ['profile.read'])

    if ('error' in auth) {
        return oauthErrorResponse(auth)
    }

    const supabase = getSupabaseAdmin()

    // Get full profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      role,
      grade,
      department,
      avatar_url,
      xp,
      gems,
      level,
      email,
      schools (
        id,
        name,
        logo_url
      )
    `)
        .eq('id', auth.profileId)
        .single()

    if (error || !profile) {
        return NextResponse.json({
            error: 'not_found',
            error_description: 'User not found'
        }, { status: 404 })
    }

    // Build response based on scopes
    const schools = profile.schools as unknown as { id: string; name: string; logo_url: string } | null
    const response: Record<string, any> = {
        sub: profile.user_id,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        given_name: profile.first_name,
        family_name: profile.last_name,
        picture: profile.avatar_url,
        role: profile.role,
        school_id: schools?.id,
        school_name: schools?.name
    }

    if (hasScope(auth, 'profile.email')) {
        response.email = profile.email
        response.email_verified = true
    }

    // Add role-specific info
    if (profile.role === 'student') {
        response.grade = profile.grade
        response.xp = profile.xp
        response.gems = profile.gems
        response.level = profile.level
    } else if (profile.role === 'teacher') {
        response.department = profile.department
    }

    return NextResponse.json(response)
}
