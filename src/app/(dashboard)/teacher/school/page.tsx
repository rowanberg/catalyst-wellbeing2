'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
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
      console.log('🏫 Fetching school information...')
      
      const response = await fetch('/api/teacher/school-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ School data received:', data.school)
        setSchoolInfo(data.school)
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to fetch school info:', errorData)
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
      console.error('❌ Error fetching school info:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-blue-400"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-6">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl shadow-lg">
                      <School className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-white">{schoolInfo?.name}</h1>
                      <p className="text-white/80 text-sm">School Information & Details</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* School Overview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-1 space-y-6"
              >
                {/* Basic Info */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Building className="h-5 w-5 text-emerald-400" />
                      School Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-white/60 text-sm">Principal</p>
                      <p className="text-white font-medium">{schoolInfo?.principal_name}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">School Type</p>
                      <p className="text-white font-medium">{schoolInfo?.school_type}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Established</p>
                      <p className="text-white font-medium">{schoolInfo?.established_year}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Grade Levels</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {schoolInfo?.grade_levels?.map((grade) => (
                          <span key={grade} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg">
                            {grade}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-white/80 text-sm">Students</span>
                      </div>
                      <span className="text-white font-bold text-lg">{schoolInfo?.total_students}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-green-400" />
                        <span className="text-white/80 text-sm">Teachers</span>
                      </div>
                      <span className="text-white font-bold text-lg">{schoolInfo?.total_teachers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-purple-400" />
                        <span className="text-white/80 text-sm">Student-Teacher Ratio</span>
                      </div>
                      <span className="text-white font-bold text-lg">
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
                className="lg:col-span-2 space-y-6"
              >
                
                {/* Contact Information */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Phone className="h-5 w-5 text-blue-400" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Address</p>
                          <p className="text-white">
                            {schoolInfo?.address}<br />
                            {schoolInfo?.city}, {schoolInfo?.state} {schoolInfo?.postal_code}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Phone</p>
                          <p className="text-white">{schoolInfo?.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Email</p>
                          <p className="text-white">{schoolInfo?.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Website</p>
                          <p className="text-blue-300">{schoolInfo?.website}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* School Hours */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Clock className="h-5 w-5 text-orange-400" />
                      Operating Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white/60 text-sm">School Hours</p>
                        <p className="text-white font-medium">{schoolInfo?.school_hours}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-white/60 text-sm">Office Hours</p>
                        <p className="text-white font-medium">{schoolInfo?.office_hours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mission & Vision */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Target className="h-5 w-5 text-purple-400" />
                      Mission & Vision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Mission Statement</h4>
                      <p className="text-white/80 leading-relaxed">{schoolInfo?.mission_statement}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Vision Statement</h4>
                      <p className="text-white/80 leading-relaxed">{schoolInfo?.vision_statement}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Core Values</h4>
                      <div className="flex flex-wrap gap-2">
                        {schoolInfo?.core_values?.map((value) => (
                          <span key={value} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements & Facilities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-white">
                        <Award className="h-5 w-5 text-yellow-400" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {schoolInfo?.achievements?.map((achievement, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Star className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-white/80 text-sm">{achievement}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-white">
                        <Building className="h-5 w-5 text-cyan-400" />
                        Facilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {schoolInfo?.facilities?.map((facility, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Heart className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <p className="text-white/80 text-sm">{facility}</p>
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
    </AuthGuard>
  )
}

export default TeacherSchoolPage
