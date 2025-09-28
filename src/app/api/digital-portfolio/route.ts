import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Return mock portfolio items for now
    const mockItems = [
      {
        id: '1',
        title: 'Science Fair Project',
        description: 'My volcano experiment documentation',
        type: 'project',
        category: 'Science',
        subject: 'Chemistry',
        dateCreated: '2025-09-20',
        isPublic: true,
        views: 45,
        likes: 12,
        tags: ['science', 'experiment', 'volcano'],
        thumbnail: '🌋',
        fileSize: '2.4 MB'
      },
      {
        id: '2',
        title: 'Math Problem Solutions',
        description: 'Collection of solved calculus problems',
        type: 'document',
        category: 'Mathematics',
        subject: 'Calculus',
        dateCreated: '2025-09-18',
        isPublic: false,
        views: 8,
        likes: 3,
        tags: ['math', 'calculus', 'homework'],
        thumbnail: '📊',
        fileSize: '1.2 MB'
      },
      {
        id: '3',
        title: 'Art Portfolio',
        description: 'Digital paintings and sketches',
        type: 'image',
        category: 'Art',
        subject: 'Visual Arts',
        dateCreated: '2025-09-15',
        isPublic: true,
        views: 67,
        likes: 23,
        tags: ['art', 'digital', 'painting'],
        thumbnail: '🎨',
        fileSize: '5.8 MB'
      }
    ]

    return NextResponse.json({ items: mockItems })
  } catch (error) {
    console.error('Digital portfolio API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
