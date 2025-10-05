'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, School, Users, Trophy, TrendingUp, Activity,
  Calendar, Clock, Mail, Phone, MapPin, Globe, Shield,
  Star, Award, Target, BookOpen, Heart, Zap, Download,
  Filter, Search, ChevronDown, Eye, MoreVertical, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SchoolDetailsView } from '@/components/superpanel/SchoolDetailsView'

export default function SchoolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [schoolData, setSchoolData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    fetchSchoolDetails()
  }, [params.id])

  const fetchSchoolDetails = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/superpanel/schools/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSchoolData(data)
      } else {
        throw new Error('Failed to fetch school details')
      }
    } catch (error: any) {
      console.error('Error fetching school details:', error)
      setError(error.message || 'Failed to load school details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-purple-50'
      }`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  if (error || !schoolData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-purple-50'
      }`}>
        <div className="text-center">
          <p className={`text-xl ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <Button onClick={() => router.push('/superpanel/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return <SchoolDetailsView schoolData={schoolData} darkMode={darkMode} setDarkMode={setDarkMode} />
}
