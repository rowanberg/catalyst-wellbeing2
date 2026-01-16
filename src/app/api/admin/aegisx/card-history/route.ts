import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const profile = profiles[0]

        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('studentId')

        // Students can only view their own history, admins can view any
        if (profile?.role === 'student' && studentId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
        }

        // Fetch card history
        const { data: history, error } = await supabaseAdmin
            .from('student_card_history')
            .select(`
                id,
                event_type,
                event_details,
                previous_status,
                new_status,
                changed_by_role,
                created_at,
                card_id
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error('Error fetching card history:', error)
            return NextResponse.json({
                history: [],
                message: 'Card history table not found. Please run the aegisx_settings_analytics.sql migration.'
            })
        }

        // Get card info if there are histories
        const cardIds = [...new Set(history?.map((h: any) => h.card_id).filter(Boolean))]
        let cardMap: Record<string, { uid: string, number: string }> = {}

        if (cardIds.length > 0) {
            const { data: cards } = await supabaseAdmin
                .from('nfc_cards')
                .select('id, card_uid, card_number')
                .in('id', cardIds)

            if (cards) {
                cardMap = cards.reduce((acc: Record<string, { uid: string, number: string }>, c: any) => {
                    acc[c.id] = { uid: c.card_uid, number: c.card_number }
                    return acc
                }, {})
            }
        }

        // Transform data
        const transformedHistory = history?.map((entry: any) => ({
            id: entry.id,
            eventType: entry.event_type,
            eventDetails: entry.event_details,
            previousStatus: entry.previous_status,
            newStatus: entry.new_status,
            changedByRole: entry.changed_by_role,
            createdAt: entry.created_at,
            cardUid: cardMap[entry.card_id]?.uid,
            cardNumber: cardMap[entry.card_id]?.number
        })) || []

        return NextResponse.json({ history: transformedHistory })

    } catch (error: any) {
        console.error('Error in GET /api/admin/aegisx/card-history:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
