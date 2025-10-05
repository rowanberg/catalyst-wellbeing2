import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Super Admin Access Key (Hexadecimal) - CHANGE THIS IN PRODUCTION
const SUPER_ADMIN_ACCESS_KEY = '4C4F52454D5F495053554D5F444F4C4F525F534954'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for non-superpanel routes
  if (!pathname.startsWith('/superpanel')) {
    return NextResponse.next()
  }

  // Always allow auth page - no checks at all
  if (pathname === '/superpanel/auth') {
    return NextResponse.next()
  }

  // For dashboard and other protected routes, verify access key
  const accessKey = req.cookies.get('super_admin_key')?.value

  // Redirect to auth if no valid key
  if (!accessKey || accessKey !== SUPER_ADMIN_ACCESS_KEY) {
    return NextResponse.redirect(new URL('/superpanel/auth', req.url))
  }

  // Valid key - allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/superpanel/dashboard/:path*',
    '/superpanel/analytics/:path*',
    '/superpanel/schools/:path*',
  ],
}
