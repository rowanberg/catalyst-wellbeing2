import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function verifyAccessToken(request: NextRequest): { valid: boolean; payload?: any; error?: string } {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing or invalid authorization header' }
    }
    const token = authHeader.substring(7)
    try {
        const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
        const payload = jwt.verify(token, secret)
        return { valid: true, payload }
    } catch {
        return { valid: false, error: 'Invalid or expired access token' }
    }
}

// POST /api/v1/privacy/data/delete - Request data deletion (GDPR/DPDP compliance)
export async function POST(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { user_id, data_types, reason, delete_from_third_parties } = body

        // Only user can request deletion of their own data, or parent for minor
        const requesterId = auth.payload.sub

        if (!user_id) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'user_id is required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Verify requester has authority to delete this user's data
        let authorized = requesterId === user_id

        if (!authorized) {
            // Check if requester is parent of the user
            const { data: parentLink } = await admin
                .from('student_parent_links')
                .select('id')
                .eq('parent_id', admin
                    .from('parents')
                    .select('id')
                    .eq('user_id', requesterId)
                )
                .eq('student_id', admin
                    .from('students')
                    .select('id')
                    .eq('user_id', user_id)
                )
                .eq('is_active', true)
                .single()

            if (parentLink) {
                authorized = true
            }
        }

        if (!authorized) {
            return NextResponse.json({
                error: 'forbidden',
                error_description: 'You are not authorized to request deletion of this user\'s data'
            }, { status: 403 })
        }

        // Create deletion request
        const { data: deletionRequest, error } = await admin
            .from('data_deletion_requests')
            .insert({
                user_id,
                requested_by: requesterId,
                data_types: data_types || ['all'],
                reason,
                delete_from_third_parties: delete_from_third_parties || false,
                status: 'pending',
                grace_period_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            })
            .select()
            .single()

        if (error) throw error

        // Revoke all third-party access immediately if requested
        if (delete_from_third_parties) {
            await admin
                .from('oauth_access_tokens')
                .update({ is_revoked: true, revoked_at: new Date().toISOString() })
                .eq('user_id', user_id)

            await admin
                .from('oauth_refresh_tokens')
                .update({ is_revoked: true, revoked_at: new Date().toISOString() })
                .eq('user_id', user_id)

            await admin
                .from('user_authorizations')
                .update({ is_active: false, revoked_at: new Date().toISOString() })
                .eq('user_id', user_id)
        }

        // Create notification
        await admin.from('notifications').insert({
            user_id,
            title: 'Data Deletion Request Submitted',
            message: `Your data deletion request has been submitted. Your data will be permanently deleted after the 30-day grace period unless you cancel.`,
            type: 'warning',
            priority: 'high',
            action_url: '/settings/privacy/deletion',
            action_label: 'View Request'
        })

        // Log the deletion request
        await admin.from('data_access_logs').insert({
            user_id,
            action: 'deletion_request',
            resource_type: 'user_data',
            data_accessed: data_types || ['all'],
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            request_id: deletionRequest.id,
            status: 'pending',
            grace_period_ends_at: deletionRequest.grace_period_ends_at,
            third_party_access_revoked: delete_from_third_parties || false,
            message: 'Data deletion request submitted successfully.',
            instructions: [
                'Your request has been logged and will be processed.',
                'You have a 30-day grace period to cancel this request.',
                'After the grace period, your data will be permanently deleted.',
                'All third-party applications will lose access to your data immediately if requested.',
                'To cancel this request, visit your privacy settings.'
            ],
            cancel_url: `/api/v1/privacy/data/delete/${deletionRequest.id}/cancel`,
            compliance: {
                gdpr: 'Article 17 - Right to Erasure',
                dpdp: 'Section 12 - Right to Correction and Erasure',
                ferpa: 'FERPA Deletion Rights'
            }
        }, { status: 201 })
    } catch (error: any) {
        console.error('Data deletion request error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}

// GET /api/v1/privacy/data/delete - Get deletion request status
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id') || auth.payload.sub

        const admin = getSupabaseAdmin()

        const { data: requests, error } = await admin
            .from('data_deletion_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            user_id: userId,
            pending_requests: requests?.filter(r => r.status === 'pending') || [],
            completed_requests: requests?.filter(r => r.status === 'completed') || [],
            cancelled_requests: requests?.filter(r => r.status === 'cancelled') || [],
            total_requests: requests?.length || 0
        })
    } catch (error: any) {
        console.error('Data deletion status error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
