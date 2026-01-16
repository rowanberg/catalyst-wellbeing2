import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        // Fetch specific reader
        const { data: reader, error } = await supabaseAdmin
            .from('nfc_readers')
            .select('*')
            .eq('id', id)
            .eq('school_id', profile.school_id)
            .single()

        if (error || !reader) {
            return NextResponse.json({ error: 'Reader not found' }, { status: 404 })
        }

        return NextResponse.json({ reader })

    } catch (error: any) {
        console.error('Error in GET /api/admin/aegisx/readers/[id]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updates = await request.json()
        const { id } = await params

        // Update reader configuration
        const { data: updatedReader, error } = await supabaseAdmin
            .from('nfc_readers')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('school_id', profile.school_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating reader:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, reader: updatedReader })

    } catch (error: any) {
        console.error('Error in PATCH /api/admin/aegisx/readers/[id]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        // Delete reader
        const { error } = await supabaseAdmin
            .from('nfc_readers')
            .delete()
            .eq('id', id)
            .eq('school_id', profile.school_id)

        if (error) {
            console.error('Error deleting reader:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error in DELETE /api/admin/aegisx/readers/[id]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
