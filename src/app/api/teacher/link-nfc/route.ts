import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/api-auth'

export async function POST(req: NextRequest) {
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
        const body = await req.json()
        const { cardId } = body

        if (!cardId) {
            return NextResponse.json(
                { error: 'Card ID is required' },
                { status: 400 }
            )
        }

        // Check if card is already linked to someone else
        const { data: existingCard, error: checkError } = await supabase
            .from('nfc_cards')
            .select('id, student_id')
            .eq('card_uid', cardId)
            .eq('status', 'active')
            .single()

        if (existingCard && existingCard.student_id !== profile.user_id) {
            return NextResponse.json(
                { error: 'This card is already linked to another user' },
                { status: 409 }
            )
        }

        // Deactivate any existing cards for this teacher
        await supabase
            .from('nfc_cards')
            .update({ status: 'inactive' })
            .eq('student_id', profile.user_id)

        // Calculate expiry date (1 year from now)
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        // Link the new card
        const { data: newCard, error: insertError } = await supabase
            .from('nfc_cards')
            .upsert({
                card_uid: cardId,
                student_id: profile.user_id,
                school_id: profile.school_id,
                status: 'active',
                linked_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            }, {
                onConflict: 'card_uid'
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error linking NFC card:', insertError)
            return NextResponse.json(
                { error: 'Failed to link NFC card' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'NFC card linked successfully',
            card: {
                id: newCard.id,
                cardId: newCard.card_uid,
                linkedAt: newCard.linked_at,
                expiresAt: newCard.expires_at
            }
        })

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
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
        // Deactivate all cards for this teacher
        const { error: updateError } = await supabase
            .from('nfc_cards')
            .update({ status: 'inactive' })
            .eq('student_id', profile.user_id)

        if (updateError) {
            console.error('Error unlinking NFC card:', updateError)
            return NextResponse.json(
                { error: 'Failed to unlink NFC card' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'NFC card unlinked successfully'
        })

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
