import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const mood = searchParams.get('mood')
    const duration = parseInt(searchParams.get('duration') || '30', 10)
    const difficulty = searchParams.get('difficulty')
    const groupSize = searchParams.get('group_size')

    // Get activity templates with filters
    let query = supabase
      .from('activity_templates')
      .select(`
        id,
        name,
        description,
        instructions,
        duration_minutes,
        materials_needed,
        age_group,
        mood_targets,
        difficulty_level,
        group_size,
        benefits,
        variations,
        safety_notes,
        usage_count,
        rating,
        category:intervention_categories(
          id,
          name,
          icon,
          color
        )
      `)
      .eq('is_active', true)
      .lte('duration_minutes', duration)
      .order('rating', { ascending: false })
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category.name', category)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    if (groupSize) {
      query = query.eq('group_size', groupSize)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // Filter by mood if specified
    let filteredTemplates = templates
    if (mood) {
      const templatesData = templates?.map((template: any) => ({
        ...template,
        mood_targets: template.mood_targets?.includes(mood)
      })) || []
      filteredTemplates = templatesData.filter(template => template.mood_targets)
    }

    return NextResponse.json({ templates: filteredTemplates })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { template_id, rating, feedback } = body

    if (!template_id || !rating) {
      return NextResponse.json({ error: 'Template ID and rating required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Insert feedback
    const { error: feedbackError } = await supabase
      .from('activity_feedback')
      .insert({
        teacher_id: teacher.id,
        activity_type: 'template',
        activity_id: template_id,
        rating,
        feedback_text: feedback,
        would_recommend: rating >= 4
      })

    if (feedbackError) {
      console.error('Error inserting feedback:', feedbackError)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    // Update template rating
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('activity_templates')
      .select('rating, usage_count')
      .eq('id', template_id)
      .single()

    if (!fetchError && currentTemplate) {
      const newRating = ((currentTemplate.rating * currentTemplate.usage_count) + rating) / (currentTemplate.usage_count + 1)
      
      await supabase
        .from('activity_templates')
        .update({ rating: newRating })
        .eq('id', template_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
