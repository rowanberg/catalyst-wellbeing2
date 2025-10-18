import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and school
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch existing promotion mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from('promotion_mappings')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('from_grade', { ascending: true })
      .order('from_section', { ascending: true })

    if (mappingsError) {
      // Table might not exist yet, return empty array
      console.log('Promotion mappings table might not exist:', mappingsError)
      return NextResponse.json({ mappings: [], success: true })
    }

    return NextResponse.json({ 
      mappings: mappings || [],
      success: true 
    })

  } catch (error) {
    console.error('Fetch promotion mappings error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and school
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { mappings } = body

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ error: 'Invalid mappings data' }, { status: 400 })
    }

    // Delete existing mappings for this school (table should exist from migration)
    const { error: deleteError } = await supabase
      .from('promotion_mappings')
      .delete()
      .eq('school_id', profile.school_id)

    // Insert new mappings
    const mappingsToInsert = mappings.map((mapping: any) => ({
      school_id: profile.school_id,
      from_class_id: mapping.fromClassId,
      from_class_name: mapping.fromClassName,
      from_grade: mapping.fromGrade,
      from_section: mapping.fromSection,
      to_class_id: mapping.toClassId,
      to_class_name: mapping.toClassName,
      to_grade: mapping.toGrade,
      to_section: mapping.toSection,
      is_locked: mapping.isLocked || false,
      academic_year: new Date().getFullYear().toString(),
      created_by: profile.id,
      updated_at: new Date().toISOString()
    }))

    const { data: insertedMappings, error: insertError } = await supabase
      .from('promotion_mappings')
      .insert(mappingsToInsert)
      .select()

    if (insertError) {
      console.error('Insert promotion mappings error:', insertError)
      
      // If table doesn't exist, try creating it with a simpler approach
      if (insertError.code === '42P01') {
        // Table doesn't exist, create it
        const { error: createError } = await supabase
          .from('promotion_mappings')
          .insert([{
            school_id: profile.school_id,
            from_class_id: mappings[0]?.fromClassId,
            from_class_name: 'Test',
            from_grade: 1,
            from_section: 'A',
            created_by: profile.id
          }])
          .single()
        
        if (createError) {
          return NextResponse.json({ 
            error: 'Failed to create promotion mappings table. Please contact support.',
            details: createError.message 
          }, { status: 500 })
        }
        
        // Delete the test record and try again
        await supabase
          .from('promotion_mappings')
          .delete()
          .eq('from_class_name', 'Test')
        
        // Try inserting again
        const { error: retryError } = await supabase
          .from('promotion_mappings')
          .insert(mappingsToInsert)
        
        if (retryError) {
          return NextResponse.json({ 
            error: 'Failed to save promotion mappings',
            details: retryError.message 
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ 
          error: 'Failed to save promotion mappings',
          details: insertError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Promotion mappings saved successfully',
      count: mappingsToInsert.length
    })

  } catch (error) {
    console.error('Save promotion mappings error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
