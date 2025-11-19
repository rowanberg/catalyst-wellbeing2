import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/middleware/security'

async function handlePerformance(request: NextRequest) {
  // Performance monitoring disabled for better performance
  // Simply return success without processing to avoid overhead
  return NextResponse.json({ success: true, disabled: true })
}

export const POST = withSecurity(handlePerformance)
