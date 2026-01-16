import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import * as crypto from 'crypto'

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

        // Check if user is admin
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)

        if (profileError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const profile = profiles[0]

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Try to fetch real readers from database
        const { data: readers, error } = await supabaseAdmin
            .from('nfc_readers')
            .select('*')
            .eq('school_id', profile.school_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching readers:', error)
            // If table doesn't exist yet, return empty array with helpful message
            return NextResponse.json({
                readers: [],
                message: 'NFC readers table not found. Please run the aegisx_nfc_system.sql migration.'
            })
        }

        // Transform data to match frontend interface
        const transformedReaders = readers?.map((reader: any) => ({
            id: reader.id,
            name: reader.name,
            location: reader.location,
            locationType: reader.location_type,
            status: reader.status,
            lastSync: reader.last_sync,
            totalScans: reader.total_scans || 0,
            todayScans: reader.today_scans || 0,
            serialNumber: reader.serial_number,
            enabled: reader.enabled
        })) || []

        return NextResponse.json({ readers: transformedReaders })
    } catch (error: any) {
        console.error('Error in GET /api/admin/aegisx/readers:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

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

        const body = await request.json()
        const { name, location, type, serialNumber } = body

        if (!name || !type || !serialNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if serial number already exists
        const { data: existingReader } = await supabaseAdmin
            .from('nfc_readers')
            .select('id')
            .eq('serial_number', serialNumber)
            .single()

        if (existingReader) {
            return NextResponse.json({
                error: 'Serial number already exists'
            }, { status: 409 })
        }

        // Generate secure device secret
        const deviceSecret = crypto.randomBytes(32).toString('hex')

        // Insert new reader into database
        const { data: newReader, error } = await supabaseAdmin
            .from('nfc_readers')
            .insert({
                school_id: profile.school_id,
                name,
                location: location || 'Campus',
                location_type: type,
                serial_number: serialNumber,
                device_secret: deviceSecret, // Store secret
                status: 'online',
                enabled: true,
                total_scans: 0,
                today_scans: 0,
                created_by: user.id
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating reader:', error)
            return NextResponse.json({
                error: 'Failed to create reader. Please ensure the nfc_readers table exists.',
                details: error.message
            }, { status: 500 })
        }

        // Transform to match frontend interface
        const transformedReader = {
            id: newReader.id,
            name: newReader.name,
            location: newReader.location,
            locationType: newReader.location_type,
            status: newReader.status,
            lastSync: newReader.last_sync,
            totalScans: newReader.total_scans || 0,
            todayScans: newReader.today_scans || 0,
            serialNumber: newReader.serial_number,
            enabled: newReader.enabled
        }

        // Return the secret ONLY ONCE here
        return NextResponse.json({
            success: true,
            reader: transformedReader,
            deviceSecret: deviceSecret // IMPORTANT: Frontend should display this to user
        })

    } catch (error: any) {
        console.error('Error in POST /api/admin/aegisx/readers:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

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

        const { searchParams } = new URL(request.url)
        const readerId = searchParams.get('id')

        if (!readerId) {
            return NextResponse.json({ error: 'Reader ID required' }, { status: 400 })
        }

        // Delete reader (will also cascade delete access logs)
        const { error } = await supabaseAdmin
            .from('nfc_readers')
            .delete()
            .eq('id', readerId)
            .eq('school_id', profile.school_id) // Ensure admin can only delete from their school

        if (error) {
            console.error('Error deleting reader:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error in DELETE /api/admin/aegisx/readers:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
