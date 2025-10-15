'use client'

import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { DigitalPortfolio } from '@/components/student/tools/digital-portfolio'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

function DigitalPortfolioContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-shrink-0 bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/student/messaging')}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold text-white truncate mx-4">
            Digital Portfolio
          </h2>
          <div className="w-9 h-9" />
        </div>
      </div>
      
      <div className="p-4">
        <DigitalPortfolio onBack={() => router.push('/student/messaging')} />
      </div>
    </div>
  )
}

export default function DigitalPortfolioPage() {
  return (
    <UnifiedAuthGuard requiredRole="student">
      <DigitalPortfolioContent />
    </UnifiedAuthGuard>
  )
}
