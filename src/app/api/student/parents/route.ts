import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { profileId, profile } = auth

    // Fetch parents linked to this student
    const { data: relationships, error: relationshipsError } = await supabaseAdmin
      .from('parent_child_relationships')
      .select(`
        id,
        parent_profile:parent_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          user_id
        )
      `)
      .eq('child_id', profileId)

    if (relationshipsError) {
      console.error('Error fetching parent relationships:', relationshipsError)
      return NextResponse.json({ error: 'Failed to fetch parent relationships' }, { status: 500 })
    }

    // Transform the data for frontend consumption
    const parents = relationships?.map((rel: any) => ({
      id: rel.parent_profile?.id,
      name: `${rel.parent_profile?.first_name || ''} ${rel.parent_profile?.last_name || ''}`.trim(),
      email: rel.parent_profile?.email,
      phone: rel.parent_profile?.phone || '',
      user_id: rel.parent_profile?.user_id,
      relationship_id: rel.id
    })) || []

    return NextResponse.json({ 
      parents,
      student: {
        id: profileId,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      }
    })

  } catch (error: any) {
    console.error('Error in student parents API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
