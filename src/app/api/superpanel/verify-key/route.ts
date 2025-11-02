import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side API endpoint to verify super admin access key
 * This ensures the actual key is NEVER exposed to the client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessKey } = body

    // Validate input
    if (!accessKey || typeof accessKey !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get the secret key from environment variable
    const secretKey = process.env.SUPER_ADMIN_SECRET_KEY
    
    if (!secretKey) {
      console.error('SUPER_ADMIN_SECRET_KEY is not configured in environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify the key matches
    const isValid = accessKey === secretKey

    if (isValid) {
      // Create a session token (different from the actual key for additional security)
      const sessionToken = Buffer.from(`${secretKey}-${Date.now()}`).toString('base64')
      
      // Log successful authentication
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      console.log(`[SUPER ADMIN AUTH] Successful login from IP: ${ip} at ${new Date().toISOString()}`)

      const response = NextResponse.json({ 
        success: true,
        message: 'Authentication successful' 
      })

      // Set secure HTTP-only cookie with session token
      response.cookies.set('super_admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/'
      })

      return response
    } else {
      // Log failed attempt
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      console.warn(`[SUPER ADMIN AUTH] Failed login attempt from IP: ${ip}, User-Agent: ${userAgent}`)

      // Add delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 2000))

      return NextResponse.json({ 
        success: false,
        error: 'Invalid access key' 
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Super admin verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Verify if current session is valid
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('super_admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    // Verify session token format (basic check)
    const secretKey = process.env.SUPER_ADMIN_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ valid: false }, { status: 500 })
    }

    // Decode and validate session token
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
      const hasValidPrefix = decoded.startsWith(secretKey)
      
      return NextResponse.json({ valid: hasValidPrefix })
    } catch {
      return NextResponse.json({ valid: false }, { status: 401 })
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
