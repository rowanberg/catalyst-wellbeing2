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

        if (!profile || !['admin', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '24h' // 24h, 7d, 30d
        const readerId = searchParams.get('readerId')

        // Calculate date range
        let startDate = new Date()
        let endDate = new Date()

        switch (period) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24)
                break
            case '7d':
                startDate.setDate(startDate.getDate() - 7)
                break
            case '30d':
                startDate.setDate(startDate.getDate() - 30)
                break
            default:
                startDate.setHours(startDate.getHours() - 24)
        }

        // Fetch hourly traffic data
        let query = supabaseAdmin
            .from('aegisx_hourly_traffic')
            .select(`
                hour_start,
                total_scans,
                successful_scans,
                denied_scans,
                unique_students,
                unique_staff,
                is_peak_hour,
                reader_id
            `)
            .eq('school_id', profile.school_id)
            .gte('hour_start', startDate.toISOString())
            .lte('hour_start', endDate.toISOString())
            .order('hour_start', { ascending: true })

        if (readerId) {
            query = query.eq('reader_id', readerId)
        }

        const { data: trafficData, error } = await query

        if (error) {
            console.error('Error fetching traffic data:', error)
            return NextResponse.json({
                traffic: [],
                summary: {
                    totalScans: 0,
                    successfulScans: 0,
                    deniedScans: 0,
                    uniqueStudents: 0,
                    averageScansPerHour: 0,
                    peakHour: null
                },
                message: 'Traffic analytics table not found. Please run the aegisx_settings_analytics.sql migration.'
            })
        }

        // Get reader names
        const readerIds = [...new Set(trafficData?.map((t: any) => t.reader_id).filter(Boolean))]
        let readerMap: Record<string, { name: string, type: string }> = {}

        if (readerIds.length > 0) {
            const { data: readers } = await supabaseAdmin
                .from('nfc_readers')
                .select('id, name, location_type')
                .in('id', readerIds)

            if (readers) {
                readerMap = readers.reduce((acc: Record<string, { name: string, type: string }>, r: any) => {
                    acc[r.id] = { name: r.name, type: r.location_type }
                    return acc
                }, {})
            }
        }

        // Transform and aggregate data
        const hourlyData = trafficData?.map((entry: any) => ({
            hour: entry.hour_start,
            totalScans: entry.total_scans || 0,
            successfulScans: entry.successful_scans || 0,
            deniedScans: entry.denied_scans || 0,
            uniqueStudents: entry.unique_students || 0,
            uniqueStaff: entry.unique_staff || 0,
            isPeakHour: entry.is_peak_hour || false,
            readerName: readerMap[entry.reader_id]?.name || 'Unknown',
            readerType: readerMap[entry.reader_id]?.type || 'other'
        })) || []

        // Calculate summary statistics
        const summary = {
            totalScans: hourlyData.reduce((sum: number, h: any) => sum + h.totalScans, 0),
            successfulScans: hourlyData.reduce((sum: number, h: any) => sum + h.successfulScans, 0),
            deniedScans: hourlyData.reduce((sum: number, h: any) => sum + h.deniedScans, 0),
            uniqueStudents: Math.max(...hourlyData.map((h: any) => h.uniqueStudents), 0),
            averageScansPerHour: hourlyData.length > 0 ?
                Math.round(hourlyData.reduce((sum: number, h: any) => sum + h.totalScans, 0) / hourlyData.length) : 0,
            peakHour: hourlyData.length > 0 ?
                hourlyData.reduce((max: any, h: any) => h.totalScans > (max?.totalScans || 0) ? h : max, hourlyData[0]) : null
        }

        return NextResponse.json({
            traffic: hourlyData,
            summary,
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        })

    } catch (error: any) {
        console.error('Error in GET /api/admin/aegisx/analytics:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
