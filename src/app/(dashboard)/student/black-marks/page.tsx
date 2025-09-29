'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import BlackMarksView from '@/components/student/BlackMarksView'

export default function StudentBlackMarksPage() {
  return (
    <AuthGuard requiredRole="student">
      <BlackMarksView />
    </AuthGuard>
  )
}
