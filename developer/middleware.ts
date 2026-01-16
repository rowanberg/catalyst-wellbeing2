import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    // Simple middleware - can be enhanced later
    return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
