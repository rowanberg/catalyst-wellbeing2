import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch all transport routes
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        // Fetch routes with student count
        const { data: routes, error: fetchError } = await supabaseAdmin
            .from('transport_routes')
            .select(`
                *,
                student_assignments:student_transport_assignments(count)
            `)
            .eq('school_id', profile.school_id)
            .order('route_name', { ascending: true })

        if (fetchError) {
            // Table might not exist
            if (fetchError.code === '42P01') {
                return NextResponse.json({
                    routes: [],
                    message: 'Transport tables not configured. Please run migrations.'
                })
            }
            console.error('Failed to fetch routes:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
        }

        // Transform to camelCase
        const transformedRoutes = (routes || []).map(r => ({
            id: r.id,
            routeName: r.route_name,
            routeCode: r.route_code,
            vehicleNumber: r.vehicle_number,
            driverName: r.driver_name,
            driverPhone: r.driver_phone,
            stops: r.stops || [],
            morningStartTime: r.morning_start_time,
            morningEndTime: r.morning_end_time,
            afternoonStartTime: r.afternoon_start_time,
            afternoonEndTime: r.afternoon_end_time,
            isActive: r.is_active,
            studentCount: r.student_assignments?.[0]?.count || 0,
            createdAt: r.created_at
        }))

        return NextResponse.json({ routes: transformedRoutes })

    } catch (error: any) {
        console.error('Error fetching routes:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new transport route
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const body = await request.json()
        const {
            routeName, routeCode, vehicleNumber, driverName, driverPhone,
            stops, morningStartTime, morningEndTime, afternoonStartTime, afternoonEndTime
        } = body

        if (!routeName || !vehicleNumber) {
            return NextResponse.json({
                error: 'Route name and vehicle number are required'
            }, { status: 400 })
        }

        const { data: route, error: insertError } = await supabaseAdmin
            .from('transport_routes')
            .insert({
                school_id: profile.school_id,
                route_name: routeName,
                route_code: routeCode || null,
                vehicle_number: vehicleNumber,
                driver_name: driverName || null,
                driver_phone: driverPhone || null,
                stops: stops || [],
                morning_start_time: morningStartTime || null,
                morning_end_time: morningEndTime || null,
                afternoon_start_time: afternoonStartTime || null,
                afternoon_end_time: afternoonEndTime || null,
                is_active: true
            })
            .select()
            .single()

        if (insertError) {
            console.error('Failed to create route:', insertError)
            return NextResponse.json({
                error: 'Failed to create route',
                details: insertError.message
            }, { status: 500 })
        }

        return NextResponse.json({
            route: {
                id: route.id,
                routeName: route.route_name,
                routeCode: route.route_code,
                vehicleNumber: route.vehicle_number,
                driverName: route.driver_name,
                driverPhone: route.driver_phone,
                stops: route.stops,
                morningStartTime: route.morning_start_time,
                morningEndTime: route.morning_end_time,
                afternoonStartTime: route.afternoon_start_time,
                afternoonEndTime: route.afternoon_end_time,
                isActive: route.is_active,
                studentCount: 0
            },
            message: 'Route created successfully'
        })

    } catch (error: any) {
        console.error('Error creating route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
