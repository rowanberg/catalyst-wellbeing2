import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  // Debug endpoint disabled for security
  return NextResponse.json({ 
    error: 'Debug endpoint disabled',
    message: 'Debug endpoints removed for security reasons'
  }, { status: 403 })
}
