import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies
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

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get parent profile
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('role', 'parent')
      .single()

    if (parentError || !parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 })
    }

    // Get children through parent_child_relationships
    const { data: relationships, error: relationshipError } = await supabase
      .from('parent_child_relationships')
      .select(`
        child_id,
        profiles!parent_child_relationships_child_id_fkey (
          id,
          first_name,
          last_name,
          grade_level,
          class_name,
          school_id,
          schools!profiles_school_id_fkey (
            name,
            school_code
          )
        )
      `)
      .eq('parent_id', parentProfile.id)

    if (relationshipError) {
      console.error('Error fetching children:', relationshipError)
      return NextResponse.json({ error: 'Error fetching children' }, { status: 500 })
    }

    // Format children data
    const children = relationships?.map((rel: any) => {
      const child = rel.profiles as any
      return {
        id: child.id,
        name: `${child.first_name} ${child.last_name}`,
        grade: child.grade_level ? `Grade ${child.grade_level}` : 'Unknown Grade',
        class: child.class_name || '',
        school: child.schools?.name || 'Unknown School',
        schoolCode: child.schools?.school_code || '',
        recentMessages: 0, // TODO: Get actual message count
        lastActivity: 'Recently', // TODO: Get actual last activity
        wellbeingStatus: 'good' // TODO: Get actual wellbeing status
      }
    }) || []

    return NextResponse.json({ children })

  } catch (error: any) {
    console.error('Error in parent children API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
