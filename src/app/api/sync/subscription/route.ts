/**
 * Subscription Sync API Endpoint
 * Receives encrypted subscription data from landing page after payment
 * 7-Layer Security Validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSecureRequest, decrypt, hashPayload } from '@/lib/security'

// Supabase Admin Client (uses service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ============================================
// TYPES
// ============================================

interface SubscriptionData {
  id: string // UUID from landing page
  user_email: string
  school_name: string
  phone: string
  plan_name: string
  plan_price: number
  student_count: number
  billing_cycle: 'monthly' | 'yearly'
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'pending'
  trial_end_date?: string
  subscription_start_date?: string
  subscription_end_date?: string
  next_billing_date?: string
  razorpay_subscription_id?: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
  amount_paid?: number
  metadata?: any
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  ip: string,
  userAgent: string | null,
  description: string,
  details?: any
) {
  try {
    await supabaseAdmin.from('security_logs').insert({
      event_type: eventType,
      severity,
      ip_address: ip,
      user_agent: userAgent,
      service: 'landing-page',
      description,
      details: details || {},
      resolved: false
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

async function logAuditTrail(
  service: string,
  action: string,
  schoolId: string | null,
  ip: string,
  requestId: string,
  payloadHash: string,
  success: boolean,
  error?: string,
  changes?: any
) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      service,
      action,
      school_id: schoolId,
      ip_address: ip,
      request_id: requestId,
      payload_hash: payloadHash,
      success,
      error: error || null,
      changes: changes || null
    })
  } catch (error) {
    console.error('Failed to log audit trail:', error)
  }
}

function validateSubscriptionData(data: any): { valid: boolean; error?: string } {
  const required = [
    'id',
    'user_email',
    'school_name',
    'phone',
    'plan_name',
    'plan_price',
    'student_count',
    'billing_cycle',
    'status'
  ]

  for (const field of required) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.user_email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Validate status
  const validStatuses = ['trial', 'active', 'cancelled', 'expired', 'pending']
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'Invalid subscription status' }
  }

  // Validate billing cycle
  if (!['monthly', 'yearly'].includes(data.billing_cycle)) {
    return { valid: false, error: 'Invalid billing cycle' }
  }

  // Validate numbers
  if (typeof data.plan_price !== 'number' || data.plan_price < 0) {
    return { valid: false, error: 'Invalid plan price' }
  }

  if (typeof data.student_count !== 'number' || data.student_count < 1) {
    return { valid: false, error: 'Invalid student count' }
  }

  return { valid: true }
}

// ============================================
// POST /api/sync/subscription
// ============================================

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = request.headers.get('user-agent')

  try {
    // ============================================
    // LAYER 1-6: Validate all security layers
    // ============================================
    const securityCheck = await validateSecureRequest(request)

    if (!securityCheck.valid) {
      // Log security failure
      await logSecurityEvent(
        'sync_security_failure',
        'high',
        ip,
        userAgent,
        `Security validation failed: ${securityCheck.error}`,
        { error: securityCheck.error }
      )

      await logAuditTrail(
        'landing-page',
        'subscription_sync',
        null,
        ip,
        requestId,
        '',
        false,
        securityCheck.error
      )

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ============================================
    // Parse request body
    // ============================================
    const body = await request.json()

    if (!body.data) {
      await logSecurityEvent(
        'sync_invalid_payload',
        'medium',
        ip,
        userAgent,
        'Missing encrypted data in request body',
        {}
      )

      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      )
    }

    // ============================================
    // LAYER 5: Decrypt subscription data
    // ============================================
    const decryptResult = decrypt(body.data)

    if (decryptResult.error || !decryptResult.decrypted) {
      await logSecurityEvent(
        'sync_decryption_failure',
        'critical',
        ip,
        userAgent,
        `Decryption failed: ${decryptResult.error}`,
        {}
      )

      await logAuditTrail(
        'landing-page',
        'subscription_sync',
        null,
        ip,
        requestId,
        hashPayload(body.data),
        false,
        'Decryption failed - possible data tampering'
      )

      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Parse decrypted JSON
    let subscriptionData: SubscriptionData
    try {
      subscriptionData = JSON.parse(decryptResult.decrypted)
    } catch (error) {
      await logSecurityEvent(
        'sync_invalid_json',
        'high',
        ip,
        userAgent,
        'Failed to parse decrypted data as JSON',
        {}
      )

      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // ============================================
    // Validate subscription data schema
    // ============================================
    const validation = validateSubscriptionData(subscriptionData)

    if (!validation.valid) {
      await logSecurityEvent(
        'sync_schema_validation_failure',
        'medium',
        ip,
        userAgent,
        `Schema validation failed: ${validation.error}`,
        { data: subscriptionData }
      )

      await logAuditTrail(
        'landing-page',
        'subscription_sync',
        null,
        ip,
        requestId,
        hashPayload(JSON.stringify(subscriptionData)),
        false,
        validation.error
      )

      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // ============================================
    // Create or update school record
    // ============================================
    
    // Check if school exists
    const { data: existingSchool } = await supabaseAdmin
      .from('schools')
      .select('id, email, name, subscription_status')
      .eq('email', subscriptionData.user_email)
      .single()

    let schoolId: string
    let isNewSchool = false

    if (existingSchool) {
      // Update existing school
      const { data: updatedSchool, error: updateError } = await supabaseAdmin
        .from('schools')
        .update({
          name: subscriptionData.school_name,
          phone: subscriptionData.phone,
          subscription_status: subscriptionData.status,
          subscription_plan: subscriptionData.plan_name,
          student_limit: subscriptionData.student_count,
          trial_end_date: subscriptionData.trial_end_date || null,
          subscription_start_date: subscriptionData.subscription_start_date || null,
          subscription_end_date: subscriptionData.subscription_end_date || null,
          next_billing_date: subscriptionData.next_billing_date || null,
          razorpay_subscription_id: subscriptionData.razorpay_subscription_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSchool.id)
        .select('id')
        .single()

      if (updateError || !updatedSchool) {
        await logAuditTrail(
          'landing-page',
          'subscription_sync',
          existingSchool.id,
          ip,
          requestId,
          hashPayload(JSON.stringify(subscriptionData)),
          false,
          `Failed to update school: ${updateError?.message}`
        )

        return NextResponse.json(
          { error: 'Failed to update school record' },
          { status: 500 }
        )
      }

      schoolId = existingSchool.id
    } else {
      // Create new school
      const { data: newSchool, error: createError } = await supabaseAdmin
        .from('schools')
        .insert({
          email: subscriptionData.user_email,
          name: subscriptionData.school_name,
          phone: subscriptionData.phone,
          subscription_status: subscriptionData.status,
          subscription_plan: subscriptionData.plan_name,
          student_limit: subscriptionData.student_count,
          trial_end_date: subscriptionData.trial_end_date || null,
          subscription_start_date: subscriptionData.subscription_start_date || null,
          subscription_end_date: subscriptionData.subscription_end_date || null,
          next_billing_date: subscriptionData.next_billing_date || null,
          razorpay_subscription_id: subscriptionData.razorpay_subscription_id || null,
          created_from: 'landing_page',
          is_verified: false,
          is_active: true
        })
        .select('id')
        .single()

      if (createError || !newSchool) {
        await logAuditTrail(
          'landing-page',
          'subscription_sync',
          null,
          ip,
          requestId,
          hashPayload(JSON.stringify(subscriptionData)),
          false,
          `Failed to create school: ${createError?.message}`
        )

        return NextResponse.json(
          { error: 'Failed to create school record' },
          { status: 500 }
        )
      }

      schoolId = newSchool.id
      isNewSchool = true
    }

    // ============================================
    // Create subscription sync record
    // ============================================
    const { error: syncError } = await supabaseAdmin
      .from('subscription_sync')
      .upsert({
        school_id: schoolId,
        landing_page_subscription_id: subscriptionData.id,
        data: subscriptionData,
        sync_timestamp: new Date().toISOString(),
        sync_source: 'landing_page',
        sync_status: 'completed',
        razorpay_order_id: subscriptionData.razorpay_order_id || null,
        razorpay_payment_id: subscriptionData.razorpay_payment_id || null,
        amount_paid: subscriptionData.amount_paid || null
      }, {
        onConflict: 'landing_page_subscription_id'
      })

    if (syncError) {
      console.error('Failed to create subscription sync record:', syncError)
      // Don't fail the request, just log the error
    }

    // ============================================
    // Create audit log for successful sync
    // ============================================
    await logAuditTrail(
      'landing-page',
      'subscription_sync',
      schoolId,
      ip,
      requestId,
      hashPayload(JSON.stringify(subscriptionData)),
      true,
      undefined,
      {
        action: isNewSchool ? 'created' : 'updated',
        subscription_id: subscriptionData.id,
        plan: subscriptionData.plan_name,
        status: subscriptionData.status
      }
    )

    // ============================================
    // Return success response
    // ============================================
    return NextResponse.json({
      success: true,
      school_id: schoolId
    }, { status: 200 })

  } catch (error: any) {
    // Log unexpected errors
    console.error('Subscription sync error:', error)

    await logSecurityEvent(
      'sync_unexpected_error',
      'critical',
      ip,
      userAgent,
      `Unexpected error during sync: ${error.message}`,
      { error: error.stack }
    )

    await logAuditTrail(
      'landing-page',
      'subscription_sync',
      null,
      ip,
      requestId,
      '',
      false,
      `Unexpected error: ${error.message}`
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// GET - Health check
// ============================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'subscription-sync',
    timestamp: new Date().toISOString()
  })
}
