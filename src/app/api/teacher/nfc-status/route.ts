import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
    // Authenticate the request
    const authResult = await authenticateRequest(req, {
        allowedRoles: ['teacher', 'admin']
    })

    if ('error' in authResult) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        )
    }

    const { profile, supabase } = authResult

    try {
        // Check if teacher has an NFC card linked
        // Teachers use the same nfc_cards table but with teacher_id reference
        const { data: nfcCard, error: cardError } = await supabase
            .from('nfc_cards')
            .select('id, card_uid, status, linked_at, expires_at')
            .eq('student_id', profile.user_id) // Same column, different role
            .eq('status', 'active')
            .single()

        if (cardError && cardError.code !== 'PGRST116') { // Not found is okay
            console.error('Error checking NFC status:', cardError)
        }

        if (!nfcCard) {
            return NextResponse.json({
                isLinked: false,
                cardId: null,
                linkedAt: null
            })
        }

        // Get total scans for this card
        const { count: totalScans } = await supabase
            .from('nfc_access_logs')
            .select('*', { count: 'exact', head: true })
            .eq('card_id', nfcCard.id)

        // Get last scan timestamp
        const { data: lastScan } = await supabase
            .from('nfc_access_logs')
            .select('created_at')
            .eq('card_id', nfcCard.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        return NextResponse.json({
            isLinked: true,
            cardId: nfcCard.card_uid,
            linkedAt: nfcCard.linked_at,
            expiresAt: nfcCard.expires_at,
            totalScans: totalScans || 0,
            lastUsed: lastScan?.created_at || null
        })

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
