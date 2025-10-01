import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  console.log('=== Parent-Child API Called ===')
  try {
    const body = await request.text()
    console.log('Raw request body:', body)
    
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    const { parentEmail, childrenEmails } = parsedBody

    console.log('Parent-child API called with:', { parentEmail, childrenEmails })

    if (!parentEmail || !childrenEmails || !Array.isArray(childrenEmails)) {
      console.log('Invalid request data:', { parentEmail, childrenEmails })
      return NextResponse.json({ error: 'Parent email and children emails are required' }, { status: 400 })
    }

    if (childrenEmails.length === 0) {
      console.log('No children emails provided')
      return NextResponse.json({ error: 'At least one child email is required' }, { status: 400 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)
    })

    // First, get parent user from auth by email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }

    const parentUser = authUsers.users.find(u => u.email === parentEmail)
    if (!parentUser) {
      console.log('Parent user not found in auth:', parentEmail)
      return NextResponse.json({ error: 'Parent user not found' }, { status: 404 })
    }

    // Get parent profile using user_id
    const { data: parentProfile, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, user_id, school_id')
      .eq('user_id', parentUser.id)
      .eq('role', 'parent')
      .single()

    console.log('Parent profile query result:', { parentProfile, parentError })

    if (parentError || !parentProfile) {
      console.log('Parent profile not found for user_id:', parentUser.id)
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 })
    }

    // Get children users from auth first, then their profiles
    const childrenUsers = authUsers.users.filter(u => childrenEmails.includes(u.email || ''))
    console.log('Found children users:', childrenUsers.map(u => ({ id: u.id, email: u.email })))

    if (childrenUsers.length === 0) {
      console.log('No children users found in auth for emails:', childrenEmails)
      return NextResponse.json({ error: 'No children users found' }, { status: 404 })
    }

    // Get children profiles using user_ids
    const childrenUserIds = childrenUsers.map(u => u.id)
    const { data: childrenProfiles, error: childrenError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, role, first_name, last_name, school_id')
      .in('user_id', childrenUserIds)
      .eq('role', 'student')

    console.log('Children profiles query result:', { childrenProfiles, childrenError })

    if (childrenError) {
      console.error('Error fetching children profiles:', childrenError)
      return NextResponse.json({ error: 'Error fetching children profiles' }, { status: 500 })
    }

    if (!childrenProfiles || childrenProfiles.length === 0) {
      console.log('No valid student profiles found for user_ids:', childrenUserIds)
      return NextResponse.json({ error: 'No valid student profiles found' }, { status: 404 })
    }

    // Create parent-child relationships using user_ids (not profile ids)
    const relationships = childrenProfiles.map(child => ({
      parent_id: parentProfile.user_id,  // Use user_id instead of profile id
      child_id: child.user_id,           // Use user_id instead of profile id
      school_id: parentProfile.school_id || null,  // Add school_id if available
      is_approved: true
    }))

    console.log('Creating relationships:', relationships)

    // First, let's verify the parent profile exists in the profiles table
    const { data: verifyParent, error: verifyParentError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, role')
      .eq('id', parentProfile.id)
      .single()
    
    console.log('Parent verification:', { verifyParent, verifyParentError })

    // Verify child profiles exist
    for (const child of childrenProfiles) {
      const { data: verifyChild, error: verifyChildError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, role')
        .eq('id', child.id)
        .single()
      
      console.log(`Child verification for ${child.id}:`, { verifyChild, verifyChildError })
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('parent_child_relationships')
      .insert(relationships)
      .select()

    console.log('Insert result:', { insertData, insertError })

    if (insertError) {
      console.error('Error creating parent-child relationships:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create parent-child relationships',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully linked parent to ${childrenProfiles.length} children`,
      relationships: insertData
    })

  } catch (error: any) {
    console.error('=== CRITICAL ERROR in parent-child relationships API ===')
    console.error('Error type:', typeof error)
    console.error('Error object:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error),
      type: typeof error
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Parent-child relationships API is working' })
}
