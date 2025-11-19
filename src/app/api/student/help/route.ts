import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const { message, urgency = 'medium' } = await request.json()
    
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 })
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }
    
    const { supabase, userId } = auth

    // Create help request
    const { data, error } = await supabase
      .from('help_requests')
      .insert({
        student_id: userId,
        message: message || 'Student requested help',
        urgency,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Help request API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
