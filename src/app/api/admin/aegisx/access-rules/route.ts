import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

// Service Role Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch all access rules for the school
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { data: rules, error: fetchError } = await supabaseAdmin
            .from('access_rules')
            .select('*')
            .eq('school_id', profile.school_id)
            .order('priority', { ascending: false })

        if (fetchError) {
            console.error('Failed to fetch access rules:', fetchError)
            return NextResponse.json({
                error: 'Failed to fetch access rules',
                details: fetchError.message
            }, { status: 500 })
        }

        // Transform to camelCase
        const transformedRules = (rules || []).map(rule => ({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            ruleType: rule.rule_type,
            readerIds: rule.reader_ids,
            cardTypes: rule.card_types,
            gradeLevels: rule.grade_levels,
            classIds: rule.class_ids,
            conditions: rule.conditions,
            action: rule.action,
            priority: rule.priority,
            isActive: rule.is_active,
            isEmergencyRule: rule.is_emergency_rule,
            validFrom: rule.valid_from,
            validUntil: rule.valid_until,
            createdBy: rule.created_by,
            createdAt: rule.created_at,
            updatedAt: rule.updated_at
        }))

        return NextResponse.json({ rules: transformedRules })

    } catch (error: any) {
        console.error('Error fetching access rules:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new access rule
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const body = await request.json()
        const {
            name,
            description,
            ruleType,
            readerIds,
            cardTypes,
            gradeLevels,
            classIds,
            conditions,
            action,
            priority,
            isActive,
            isEmergencyRule,
            validFrom,
            validUntil
        } = body

        if (!name || !ruleType) {
            return NextResponse.json({
                error: 'Name and rule type are required'
            }, { status: 400 })
        }

        const { data: rule, error: insertError } = await supabaseAdmin
            .from('access_rules')
            .insert({
                school_id: profile.school_id,
                name,
                description: description || null,
                rule_type: ruleType,
                reader_ids: readerIds || null,
                card_types: cardTypes || null,
                grade_levels: gradeLevels || null,
                class_ids: classIds || null,
                conditions: conditions || {},
                action: action || 'allow',
                priority: priority || 10,
                is_active: isActive !== false,
                is_emergency_rule: isEmergencyRule || false,
                valid_from: validFrom || new Date().toISOString(),
                valid_until: validUntil || null,
                created_by: profile.id
            })
            .select()
            .single()

        if (insertError) {
            console.error('Failed to create access rule:', insertError)
            return NextResponse.json({
                error: 'Failed to create access rule',
                details: insertError.message
            }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin
            .from('aegisx_audit_log')
            .insert({
                school_id: profile.school_id,
                actor_id: profile.id,
                actor_role: profile.role,
                action: 'create_access_rule',
                entity_type: 'access_rules',
                entity_id: rule.id,
                new_values: rule
            })

        return NextResponse.json({
            rule: {
                id: rule.id,
                name: rule.name,
                description: rule.description,
                ruleType: rule.rule_type,
                conditions: rule.conditions,
                action: rule.action,
                priority: rule.priority,
                isActive: rule.is_active,
                isEmergencyRule: rule.is_emergency_rule,
                createdAt: rule.created_at
            },
            message: 'Access rule created successfully'
        })

    } catch (error: any) {
        console.error('Error creating access rule:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
