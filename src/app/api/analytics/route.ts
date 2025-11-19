import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/middleware/security'

async function handleAnalytics(request: NextRequest) {
  // Analytics processing reduced for better performance
  // Simply return success without heavy processing
  return NextResponse.json({ success: true, processed: false })
}

export const POST = withSecurity(handleAnalytics)
