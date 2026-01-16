import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/student/nfc-status
 * Returns the NFC card linking status for the current student
 */
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
                    }
                }
            }
        )

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Check if student has linked NFC card in profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nfc_card_id, nfc_linked_at')
            .eq('user_id', user.id)
            .single()

        if (profileError) {
            // If column doesn't exist or other error, return not linked
            return NextResponse.json({
                isLinked: false,
                cardId: null,
                linkedAt: null
            })
        }

        return NextResponse.json({
            isLinked: !!profile.nfc_card_id,
            cardId: profile.nfc_card_id || null,
            linkedAt: profile.nfc_linked_at || null
        })

    } catch (error: any) {
        console.error('Error in /api/student/nfc-status:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}
