'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import BlackMarksView from '@/components/student/BlackMarksView'

export default function StudentBlackMarksPage() {
  return (
    <AuthGuard requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <BlackMarksView />
        </div>
      </div>
    </AuthGuard>
  )
}
