import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const parentEmail = url.searchParams.get('parentEmail')
    const childEmail = url.searchParams.get('childEmail')

    if (!parentEmail || !childEmail) {
      return NextResponse.json({ error: 'parentEmail and childEmail query params required' }, { status: 400 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Testing parent-child relationship for:', { parentEmail, childEmail })

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: 'Error fetching auth users', details: authError }, { status: 500 })
    }

    const parentUser = authUsers.users.find(u => u.email === parentEmail)
    const childUser = authUsers.users.find(u => u.email === childEmail)

    console.log('Found users:', {
      parentUser: parentUser ? { id: parentUser.id, email: parentUser.email } : null,
      childUser: childUser ? { id: childUser.id, email: childUser.email } : null
    })

    // Get profiles
    const { data: parentProfile, error: parentError } = parentUser ? await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', parentUser.id)
      .single() : { data: null, error: { message: 'Parent user not found' } }

    const { data: childProfile, error: childError } = childUser ? await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', childUser.id)
      .single() : { data: null, error: { message: 'Child user not found' } }

    console.log('Found profiles:', {
      parentProfile: parentProfile ? { id: parentProfile.id, role: parentProfile.role, user_id: parentProfile.user_id } : null,
      childProfile: childProfile ? { id: childProfile.id, role: childProfile.role, user_id: childProfile.user_id } : null,
      parentError,
      childError
    })

    // Check existing relationships
    const { data: existingRelationships, error: relationshipError } = parentProfile?.id ? await supabaseAdmin
      .from('parent_child_relationships')
      .select('*')
      .eq('parent_id', parentProfile.id) : { data: null, error: { message: 'No parent profile to check relationships for' } }

    console.log('Existing relationships:', { existingRelationships, relationshipError })

    return NextResponse.json({
      success: true,
      data: {
        parentUser: parentUser ? { id: parentUser.id, email: parentUser.email } : null,
        childUser: childUser ? { id: childUser.id, email: childUser.email } : null,
        parentProfile,
        childProfile,
        existingRelationships,
        errors: {
          parentError,
          childError,
          relationshipError
        }
      }
    })

  } catch (error) {
    console.error('Error in test API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { parentEmail, childEmail } = await request.json()

    if (!parentEmail || !childEmail) {
      return NextResponse.json({ error: 'parentEmail and childEmail required' }, { status: 400 })
    }

    // Test the actual parent-child API
    const response = await fetch(`${request.nextUrl.origin}/api/parent-child-relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parentEmail,
        childrenEmails: [childEmail]
      })
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      apiResponse: {
        status: response.status,
        data
      }
    })

  } catch (error) {
    console.error('Error testing parent-child API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
