'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  Shield,
  Building,
  Award,
  BookOpen,
  Target,
  Heart,
  Star,
  TrendingUp
} from 'lucide-react'

interface SchoolInfo {
  id?: string
  name?: string
  principal_name?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  phone?: string
  email?: string
  website?: string
  school_type?: string
  established_year?: number
  total_students?: number
  total_teachers?: number
  grade_levels?: string[]
  school_hours?: string
  office_hours?: string
  mission_statement?: string
  vision_statement?: string
  core_values?: string[]
  achievements?: string[]
  facilities?: string[]
  student_teacher_ratio?: number
  emergency_contact?: string
  nurse_extension?: string
  security_extension?: string
}

const TeacherSchoolPage = () => {
  const router = useRouter()
  const { user, profile } = useAppSelector((state) => state.auth)
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchoolInfo()
  }, [])

  const fetchSchoolInfo = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/teacher/school-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSchoolInfo(data.school)
      } else {
        await response.json()
        setSchoolInfo({
          name: "School Information Unavailable",
          principal_name: "Not Available",
          address: "Address not configured",
          city: "City",
          state: "State",
          postal_code: "00000",
          phone: "Phone not available",
          email: "Email not configured",
          website: "Website not available",
          school_type: "Not specified",
          established_year: new Date().getFullYear(),
          total_students: 0,
          total_teachers: 0,
          grade_levels: [],
          school_hours: "Not configured",
          office_hours: "Not configured",
          mission_statement: "School mission statement not configured. Please contact your administrator to set up school information.",
          vision_statement: "School vision statement not configured.",
          core_values: ["Please configure school information"],
          achievements: ["School information needs to be configured"],
          facilities: ["Please contact administrator to configure school details"]
        })
      }
    } catch (error) {
      setSchoolInfo({
        name: "Error Loading School Information",
        principal_name: "Unable to load",
        address: "Unable to load address",
        city: "Unknown",
        state: "Unknown",
        postal_code: "00000",
        phone: "Unable to load",
        email: "Unable to load",
        website: "Unable to load",
        school_type: "Unknown",
        established_year: new Date().getFullYear(),
        total_students: 0,
        total_teachers: 0,
        grade_levels: [],
        school_hours: "Unable to load",
        office_hours: "Unable to load",
        mission_statement: "Unable to load school information. Please check your connection and try again.",
        vision_statement: "Unable to load vision statement.",
        core_values: ["Unable to load"],
        achievements: ["Unable to load achievements"],
        facilities: ["Unable to load facilities"]
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.03)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.08)_1px,transparent_0)] bg-[length:32px_32px]" />
        
        <div className="relative z-10 p-3 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="mb-4 sm:mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-3 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl p-2 flex-shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md flex-shrink-0">
                      <School className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>{schoolInfo?.name}</h1>
                      <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm hidden sm:block" style={{ fontFamily: 'var(--font-dm-sans)' }}>School Information & Details</p>
                      <p className="text-gray-600 dark:text-slate-400 text-xs sm:hidden" style={{ fontFamily: 'var(--font-dm-sans)' }}>School Info</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* School Overview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-1 space-y-4 sm:space-y-6"
              >
                {/* Basic Info */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-base sm:text-lg" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Building className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                      School Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div>
                      <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Principal</p>
                      <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm sm:text-base truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.principal_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>School Type</p>
                      <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm sm:text-base" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.school_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Established</p>
                      <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm sm:text-base" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.established_year}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-slate-400 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Grade Levels</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {schoolInfo?.grade_levels?.map((grade) => (
                          <span key={grade} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {grade}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-base sm:text-lg" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Students</span>
                      </div>
                      <span className="text-gray-900 dark:text-slate-100 font-bold text-base sm:text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.total_students}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg">
                          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Teachers</span>
                      </div>
                      <span className="text-gray-900 dark:text-slate-100 font-bold text-base sm:text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.total_teachers}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg">
                          <Target className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Student-Teacher Ratio</span>
                      </div>
                      <span className="text-gray-900 dark:text-slate-100 font-bold text-base sm:text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {schoolInfo?.student_teacher_ratio || Math.round((schoolInfo?.total_students || 0) / (schoolInfo?.total_teachers || 1))}:1
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-2 space-y-4 sm:space-y-6"
              >
                
                {/* Contact Information */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-base sm:text-lg" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="p-1.5 bg-gradient-to-br from-red-400 to-rose-600 rounded-lg mt-0.5 flex-shrink-0">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Address</p>
                          <p className="text-gray-900 dark:text-slate-100 text-sm sm:text-base font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {schoolInfo?.address}<br />
                            {schoolInfo?.city}, {schoolInfo?.state} {schoolInfo?.postal_code}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex-shrink-0">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Phone</p>
                          <p className="text-gray-900 dark:text-slate-100 text-sm sm:text-base font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex-shrink-0">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Email</p>
                          <p className="text-gray-900 dark:text-slate-100 text-sm sm:text-base truncate font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 bg-gradient-to-br from-purple-400 to-violet-600 rounded-lg flex-shrink-0">
                          <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Website</p>
                          <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base truncate font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.website}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* School Hours */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Clock className="h-5 w-5 text-orange-500" />
                      Operating Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>School Hours</p>
                        <p className="text-gray-900 dark:text-slate-100 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.school_hours}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                      <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Office Hours</p>
                        <p className="text-gray-900 dark:text-slate-100 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.office_hours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mission & Vision */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Target className="h-5 w-5 text-purple-500" />
                      Mission & Vision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-gray-900 dark:text-slate-100 font-bold mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Mission Statement</h4>
                      <p className="text-gray-700 dark:text-slate-300 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.mission_statement}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-gray-900 dark:text-slate-100 font-bold mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Vision Statement</h4>
                      <p className="text-gray-700 dark:text-slate-300 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>{schoolInfo?.vision_statement}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-gray-900 dark:text-slate-100 font-bold mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Core Values</h4>
                      <div className="flex flex-wrap gap-2">
                        {schoolInfo?.core_values?.map((value) => (
                          <span key={value} className="px-3 py-1 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-sm rounded-full border border-purple-200 dark:border-purple-800 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements & Facilities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                        <Award className="h-5 w-5 text-amber-500" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {schoolInfo?.achievements?.map((achievement, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <div className="p-1 bg-gradient-to-br from-amber-400 to-yellow-600 rounded flex-shrink-0">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                            <p className="text-gray-700 dark:text-slate-300 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{achievement}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                        <Building className="h-5 w-5 text-cyan-500" />
                        Facilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {schoolInfo?.facilities?.map((facility, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
                            <div className="p-1 bg-gradient-to-br from-cyan-400 to-blue-600 rounded flex-shrink-0">
                              <Heart className="h-3 w-3 text-white" />
                            </div>
                            <p className="text-gray-700 dark:text-slate-300 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{facility}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}

export default TeacherSchoolPage
