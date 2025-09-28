import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: 'Error fetching auth users', details: authError }, { status: 500 })
    }

    // Get all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (profileError) {
      return NextResponse.json({ error: 'Error fetching profiles', details: profileError }, { status: 500 })
    }

    // Get all parent-child relationships
    const { data: relationships, error: relationshipError } = await supabaseAdmin
      .from('parent_child_relationships')
      .select('*')

    return NextResponse.json({
      success: true,
      data: {
        authUsers: authUsers.users.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        })),
        profiles: profiles?.map(p => ({
          id: p.id,
          user_id: p.user_id,
          email: p.email,
          role: p.role,
          first_name: p.first_name,
          last_name: p.last_name
        })),
        relationships: relationships || [],
        counts: {
          authUsers: authUsers.users.length,
          profiles: profiles?.length || 0,
          relationships: relationships?.length || 0
        },
        errors: {
          profileError,
          relationshipError
        }
      }
    })

  } catch (error) {
    console.error('Error in list-users API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
