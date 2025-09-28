import { ProfessionalLoader } from '@/components/ui/professional-loader'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <ProfessionalLoader />
    </div>
  )
}
