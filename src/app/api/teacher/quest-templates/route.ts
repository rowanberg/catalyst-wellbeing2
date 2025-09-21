import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public')

    let query = supabase
      .from('quest_templates')
      .select('*')
      .order('created_at', { ascending: false })

    // Show public templates or user's own templates
    if (isPublic === 'true') {
      query = query.eq('is_public', true)
    } else {
      query = query.eq('created_by', user.id)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching quest templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Error in GET /api/teacher/quest-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.name || !body.description || !body.templateData) {
      return NextResponse.json({ error: 'Name, description, and template data are required' }, { status: 400 })
    }

    const templateData = {
      name: body.name,
      description: body.description,
      category: body.category || 'general',
      estimated_duration: body.estimatedDuration || '1 week',
      target_age: body.targetAge || 'All ages',
      learning_objectives: body.learningObjectives || [],
      template_data: body.templateData,
      is_public: body.isPublic || false,
      created_by: user.id
    }

    const { data: template, error } = await supabase
      .from('quest_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating quest template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/teacher/quest-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
