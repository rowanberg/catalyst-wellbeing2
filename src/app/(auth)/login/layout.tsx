/**
 * ============================================================================
 * Login Layout - NO AUTH CHECKS
 * ============================================================================
 * This layout prevents auth checks on login page to avoid:
 * - Unnecessary /api/auth/session calls
 * - Double loading screens
 * - Performance overhead
 * ============================================================================
 */

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // NO auth checks here - this is a public route
  return <>{children}</>
}
