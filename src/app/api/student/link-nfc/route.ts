import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * POST /api/student/link-nfc
 * Links an NFC card to the current student's profile
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    }
                }
            }
        )

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Parse request body
        const body = await request.json()
        const { cardId } = body

        if (!cardId || typeof cardId !== 'string') {
            return NextResponse.json(
                { message: 'Card ID is required' },
                { status: 400 }
            )
        }

        // Sanitize card ID (NFC serial numbers are typically hex strings)
        const sanitizedCardId = cardId.trim().toUpperCase().replace(/[^A-F0-9:]/g, '')

        if (sanitizedCardId.length < 8) {
            return NextResponse.json(
                { message: 'Invalid card ID format' },
                { status: 400 }
            )
        }

        // Check if this card is already linked to another student
        const { data: existingLink, error: checkError } = await supabase
            .from('profiles')
            .select('id, user_id, first_name, last_name')
            .eq('nfc_card_id', sanitizedCardId)
            .maybeSingle()

        if (existingLink && existingLink.user_id !== user.id) {
            return NextResponse.json(
                { message: 'This NFC card is already linked to another student' },
                { status: 409 }
            )
        }

        // Link the NFC card to the student's profile
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
                nfc_card_id: sanitizedCardId,
                nfc_linked_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select('id, nfc_card_id, nfc_linked_at')
            .single()

        if (updateError) {
            console.error('Error linking NFC card:', updateError)

            // Check if it's a column not found error
            if (updateError.code === '42703') {
                return NextResponse.json(
                    { message: 'NFC linking is not yet configured for your school. Please contact your administrator.' },
                    { status: 501 }
                )
            }

            return NextResponse.json(
                { message: 'Failed to link NFC card' },
                { status: 500 }
            )
        }

        // Log the linking event for audit purposes
        try {
            await supabase.from('student_activity').insert({
                student_id: updatedProfile.id,
                title: 'NFC Card Linked',
                activity_type: 'security',
                description: `NFC card linked (ID: ${sanitizedCardId.slice(0, 4)}...${sanitizedCardId.slice(-4)})`,
                timestamp: new Date().toISOString()
            })
        } catch (e) {
            // Non-critical, ignore error
        }

        return NextResponse.json({
            success: true,
            isLinked: true,
            cardId: sanitizedCardId,
            linkedAt: updatedProfile.nfc_linked_at
        })

    } catch (error: any) {
        console.error('Error in /api/student/link-nfc:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/student/link-nfc
 * Unlinks the NFC card from the current student's profile
 */
export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    }
                }
            }
        )

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Unlink the NFC card
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                nfc_card_id: null,
                nfc_linked_at: null
            })
            .eq('user_id', user.id)

        if (updateError) {
            console.error('Error unlinking NFC card:', updateError)
            return NextResponse.json(
                { message: 'Failed to unlink NFC card' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            isLinked: false,
            cardId: null,
            linkedAt: null
        })

    } catch (error: any) {
        console.error('Error in DELETE /api/student/link-nfc:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}
