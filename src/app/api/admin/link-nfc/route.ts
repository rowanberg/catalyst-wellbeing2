import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * POST /api/admin/link-nfc
 * Admin endpoint to link an NFC card to any user's profile
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

        // Get current admin user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user is an admin
        const { data: adminProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)
            .single()

        if (profileError || !adminProfile || adminProfile.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // Parse request body
        const body = await request.json()
        const { userId, cardId } = body

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        if (!cardId || typeof cardId !== 'string') {
            return NextResponse.json(
                { error: 'Card ID is required' },
                { status: 400 }
            )
        }

        // Sanitize card ID (NFC serial numbers are typically hex strings)
        const sanitizedCardId = cardId.trim().toUpperCase().replace(/[^A-F0-9:-]/g, '')

        if (sanitizedCardId.length < 8) {
            return NextResponse.json(
                { error: 'Invalid card ID format. Card ID must be at least 8 characters.' },
                { status: 400 }
            )
        }

        // Verify the target user belongs to the admin's school
        const { data: targetUser, error: targetUserError } = await supabase
            .from('profiles')
            .select('id, user_id, first_name, last_name, school_id, nfc_card_id')
            .eq('user_id', userId)
            .single()

        if (targetUserError || !targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (targetUser.school_id !== adminProfile.school_id) {
            return NextResponse.json(
                { error: 'You can only manage users in your own school' },
                { status: 403 }
            )
        }

        // Check if this card is already linked to another user
        const { data: existingLink, error: checkError } = await supabase
            .from('profiles')
            .select('id, user_id, first_name, last_name')
            .eq('nfc_card_id', sanitizedCardId)
            .maybeSingle()

        if (existingLink && existingLink.user_id !== userId) {
            return NextResponse.json(
                {
                    error: `This NFC card is already linked to ${existingLink.first_name} ${existingLink.last_name}. Please unlink it first or use a different card.`
                },
                { status: 409 }
            )
        }

        // Link the NFC card to the user's profile
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
                nfc_card_id: sanitizedCardId,
                nfc_linked_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select('id, nfc_card_id, nfc_linked_at, first_name, last_name')
            .single()

        if (updateError) {
            console.error('Error linking NFC card:', updateError)

            // Check if it's a column not found error
            if (updateError.code === '42703') {
                return NextResponse.json(
                    { error: 'NFC linking is not yet configured. Please add nfc_card_id and nfc_linked_at columns to the profiles table.' },
                    { status: 501 }
                )
            }

            return NextResponse.json(
                { error: 'Failed to link NFC card' },
                { status: 500 }
            )
        }

        // Log the linking event for audit purposes (non-critical)
        try {
            await supabase.from('student_activity').insert({
                student_id: updatedProfile.id,
                title: 'NFC Card Linked by Admin',
                activity_type: 'security',
                description: `NFC card linked by admin (ID: ${sanitizedCardId.slice(0, 4)}...${sanitizedCardId.slice(-4)})`,
                timestamp: new Date().toISOString()
            })
        } catch { /* Non-critical, don't fail if this errors */ }

        return NextResponse.json({
            success: true,
            isLinked: true,
            cardId: sanitizedCardId,
            linkedAt: updatedProfile.nfc_linked_at,
            user: {
                id: updatedProfile.id,
                firstName: updatedProfile.first_name,
                lastName: updatedProfile.last_name
            }
        })

    } catch (error: any) {
        console.error('Error in POST /api/admin/link-nfc:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/link-nfc
 * Admin endpoint to unlink an NFC card from any user's profile
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

        // Get current admin user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user is an admin
        const { data: adminProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)
            .single()

        if (profileError || !adminProfile || adminProfile.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // Parse request body
        const body = await request.json()
        const { userId } = body

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Verify the target user belongs to the admin's school
        const { data: targetUser, error: targetUserError } = await supabase
            .from('profiles')
            .select('id, user_id, first_name, last_name, school_id, nfc_card_id')
            .eq('user_id', userId)
            .single()

        if (targetUserError || !targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (targetUser.school_id !== adminProfile.school_id) {
            return NextResponse.json(
                { error: 'You can only manage users in your own school' },
                { status: 403 }
            )
        }

        const previousCardId = targetUser.nfc_card_id

        // Unlink the NFC card
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                nfc_card_id: null,
                nfc_linked_at: null
            })
            .eq('user_id', userId)

        if (updateError) {
            console.error('Error unlinking NFC card:', updateError)
            return NextResponse.json(
                { error: 'Failed to unlink NFC card' },
                { status: 500 }
            )
        }

        // Log the unlinking event for audit purposes (non-critical)
        if (previousCardId) {
            try {
                await supabase.from('student_activity').insert({
                    student_id: targetUser.id,
                    title: 'NFC Card Unlinked by Admin',
                    activity_type: 'security',
                    description: `NFC card unlinked by admin (previous ID: ${previousCardId.slice(0, 4)}...${previousCardId.slice(-4)})`,
                    timestamp: new Date().toISOString()
                })
            } catch { /* Non-critical */ }
        }

        return NextResponse.json({
            success: true,
            isLinked: false,
            cardId: null,
            linkedAt: null,
            user: {
                id: targetUser.id,
                firstName: targetUser.first_name,
                lastName: targetUser.last_name
            }
        })

    } catch (error: any) {
        console.error('Error in DELETE /api/admin/link-nfc:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
