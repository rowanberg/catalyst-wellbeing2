import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAuthenticatedDeveloper() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = getSupabaseAdmin()
    const { data: account } = await admin
        .from('developer_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    return account
}

// GET /api/team - List team members
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = getSupabaseAdmin()

        // Get team members
        const { data: members, error } = await admin
            .from('team_members')
            .select(`
                id,
                role,
                permissions,
                joined_at,
                last_active_at,
                member:developer_accounts!member_id(id, full_name, email, avatar_url)
            `)
            .eq('organization_id', developer.organization_id || developer.id)
            .eq('is_active', true)
            .order('joined_at')

        if (error) throw error

        // Get pending invitations
        const { data: invitations } = await admin
            .from('team_invitations')
            .select('*')
            .eq('organization_id', developer.organization_id || developer.id)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())

        return NextResponse.json({
            organization_id: developer.organization_id || developer.id,
            total_members: members?.length || 0,
            pending_invitations: invitations?.length || 0,
            members: members?.map(m => {
                const member = Array.isArray(m.member) ? m.member[0] : m.member
                return {
                    id: m.id,
                    role: m.role,
                    permissions: m.permissions,
                    joined_at: m.joined_at,
                    last_active_at: m.last_active_at,
                    user: {
                        id: member?.id,
                        name: member?.full_name,
                        email: member?.email,
                        avatar_url: member?.avatar_url
                    }
                }
            }) || [],
            invitations: invitations?.map(inv => ({
                id: inv.id,
                email: inv.email,
                role: inv.role,
                invited_at: inv.created_at,
                expires_at: inv.expires_at
            })) || []
        })
    } catch (error: any) {
        console.error('Team list API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/team/invite - Invite team member
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { email, role, permissions } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const validRoles = ['owner', 'admin', 'developer', 'analyst']
        if (role && !validRoles.includes(role)) {
            return NextResponse.json({
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Check if already a member
        const { data: existingMember } = await admin
            .from('developer_accounts')
            .select('id')
            .eq('email', email)
            .single()

        if (existingMember) {
            const { data: isMember } = await admin
                .from('team_members')
                .select('id')
                .eq('organization_id', developer.organization_id || developer.id)
                .eq('member_id', existingMember.id)
                .eq('is_active', true)
                .single()

            if (isMember) {
                return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })
            }
        }

        // Check for existing pending invitation
        const { data: existingInvite } = await admin
            .from('team_invitations')
            .select('id')
            .eq('organization_id', developer.organization_id || developer.id)
            .eq('email', email)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single()

        if (existingInvite) {
            return NextResponse.json({ error: 'Invitation already pending for this email' }, { status: 409 })
        }

        // Create invitation
        const inviteToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        const { data: invitation, error } = await admin
            .from('team_invitations')
            .insert({
                organization_id: developer.organization_id || developer.id,
                email,
                role: role || 'developer',
                permissions: permissions || [],
                invite_token: inviteToken,
                invited_by: developer.id,
                expires_at: expiresAt.toISOString(),
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // In production, send invitation email here
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/invite?token=${inviteToken}`

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            action: 'team_invite_sent',
            resource_type: 'team_invitation',
            resource_id: invitation.id,
            details: { email, role },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            invitation_id: invitation.id,
            email,
            role: invitation.role,
            expires_at: invitation.expires_at,
            invite_url: inviteUrl,
            message: 'Invitation sent successfully'
        }, { status: 201 })
    } catch (error: any) {
        console.error('Team invite API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/team - Remove team member or cancel invitation
export async function DELETE(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('member_id')
        const invitationId = searchParams.get('invitation_id')

        if (!memberId && !invitationId) {
            return NextResponse.json({ error: 'member_id or invitation_id required' }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        if (memberId) {
            // Remove team member
            const { error } = await admin
                .from('team_members')
                .update({ is_active: false, removed_at: new Date().toISOString() })
                .eq('id', memberId)
                .eq('organization_id', developer.organization_id || developer.id)

            if (error) throw error

            return NextResponse.json({ message: 'Team member removed successfully' })
        }

        if (invitationId) {
            // Cancel invitation
            const { error } = await admin
                .from('team_invitations')
                .update({ status: 'cancelled' })
                .eq('id', invitationId)
                .eq('organization_id', developer.organization_id || developer.id)

            if (error) throw error

            return NextResponse.json({ message: 'Invitation cancelled successfully' })
        }
    } catch (error: any) {
        console.error('Team delete API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
