import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use admin client to run migration
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Create the RLS policy for parents
    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Parents can view wellbeing analytics for their children
        CREATE POLICY IF NOT EXISTS "Parents view children wellbeing analytics" 
          ON student_wellbeing_analytics_enhanced
          FOR SELECT 
          USING (
            student_id IN (
              SELECT pcr.child_id 
              FROM parent_child_relationships pcr
              WHERE pcr.parent_id = auth.uid()
              AND pcr.is_active = true
            )
          );
      `
    })

    if (policyError) {
      console.error('Error creating RLS policy:', policyError)
      return NextResponse.json({ error: 'Failed to create RLS policy', details: policyError }, { status: 500 })
    }

    // Verify the policy exists
    const { data: policies, error: verifyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'student_wellbeing_analytics_enhanced')
      .eq('policyname', 'Parents view children wellbeing analytics')

    if (verifyError) {
      console.error('Error verifying policy:', verifyError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RLS policy created successfully',
      policies: policies || []
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed', details: error }, { status: 500 })
  }
}
