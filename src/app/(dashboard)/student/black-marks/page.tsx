'use client'

import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import BlackMarksView from '@/components/student/BlackMarksView'

export default function StudentBlackMarksPage() {
  return (
    <UnifiedAuthGuard requiredRole="student">
      <BlackMarksView />
    </UnifiedAuthGuard>
  )
}
