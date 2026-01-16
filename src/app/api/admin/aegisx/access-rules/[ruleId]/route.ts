import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

// Service Role Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

interface RouteParams {
    params: Promise<{ ruleId: string }>
}

// GET - Fetch a single access rule
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile
        const { ruleId } = await params

        const { data: rule, error: fetchError } = await supabaseAdmin
            .from('access_rules')
            .select('*')
            .eq('id', ruleId)
            .eq('school_id', profile.school_id)
            .single()

        if (fetchError || !rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
        }

        return NextResponse.json({
            rule: {
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
                createdAt: rule.created_at
            }
        })

    } catch (error: any) {
        console.error('Error fetching access rule:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH - Update an access rule
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile
        const { ruleId } = await params
        const body = await request.json()

        // Get existing rule for audit
        const { data: existingRule } = await supabaseAdmin
            .from('access_rules')
            .select('*')
            .eq('id', ruleId)
            .eq('school_id', profile.school_id)
            .single()

        if (!existingRule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
        }

        // Build update object
        const updateData: any = { updated_at: new Date().toISOString() }

        if (body.name !== undefined) updateData.name = body.name
        if (body.description !== undefined) updateData.description = body.description
        if (body.ruleType !== undefined) updateData.rule_type = body.ruleType
        if (body.readerIds !== undefined) updateData.reader_ids = body.readerIds
        if (body.cardTypes !== undefined) updateData.card_types = body.cardTypes
        if (body.gradeLevels !== undefined) updateData.grade_levels = body.gradeLevels
        if (body.classIds !== undefined) updateData.class_ids = body.classIds
        if (body.conditions !== undefined) updateData.conditions = body.conditions
        if (body.action !== undefined) updateData.action = body.action
        if (body.priority !== undefined) updateData.priority = body.priority
        if (body.isActive !== undefined) updateData.is_active = body.isActive
        if (body.isEmergencyRule !== undefined) updateData.is_emergency_rule = body.isEmergencyRule
        if (body.validFrom !== undefined) updateData.valid_from = body.validFrom
        if (body.validUntil !== undefined) updateData.valid_until = body.validUntil

        const { data: rule, error: updateError } = await supabaseAdmin
            .from('access_rules')
            .update(updateData)
            .eq('id', ruleId)
            .eq('school_id', profile.school_id)
            .select()
            .single()

        if (updateError) {
            console.error('Failed to update access rule:', updateError)
            return NextResponse.json({
                error: 'Failed to update access rule',
                details: updateError.message
            }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin
            .from('aegisx_audit_log')
            .insert({
                school_id: profile.school_id,
                actor_id: profile.id,
                actor_role: profile.role,
                action: 'update_access_rule',
                entity_type: 'access_rules',
                entity_id: ruleId,
                old_values: existingRule,
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
                updatedAt: rule.updated_at
            },
            message: 'Access rule updated successfully'
        })

    } catch (error: any) {
        console.error('Error updating access rule:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete an access rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile
        const { ruleId } = await params

        // Get existing rule for audit
        const { data: existingRule } = await supabaseAdmin
            .from('access_rules')
            .select('*')
            .eq('id', ruleId)
            .eq('school_id', profile.school_id)
            .single()

        if (!existingRule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
        }

        const { error: deleteError } = await supabaseAdmin
            .from('access_rules')
            .delete()
            .eq('id', ruleId)
            .eq('school_id', profile.school_id)

        if (deleteError) {
            console.error('Failed to delete access rule:', deleteError)
            return NextResponse.json({
                error: 'Failed to delete access rule',
                details: deleteError.message
            }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin
            .from('aegisx_audit_log')
            .insert({
                school_id: profile.school_id,
                actor_id: profile.id,
                actor_role: profile.role,
                action: 'delete_access_rule',
                entity_type: 'access_rules',
                entity_id: ruleId,
                old_values: existingRule
            })

        return NextResponse.json({
            message: 'Access rule deleted successfully'
        })

    } catch (error: any) {
        console.error('Error deleting access rule:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
