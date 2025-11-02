/**
 * ============================================================================
 * Register Wizard Layout - NO AUTH CHECKS
 * ============================================================================
 * This layout prevents auth checks on register wizard to avoid:
 * - Unnecessary API calls
 * - Multiple re-renders
 * - Performance overhead on public registration flow
 * ============================================================================
 */

export default function RegisterWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // NO auth checks here - this is a public route
  return <>{children}</>
}
