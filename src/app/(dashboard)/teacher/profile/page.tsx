'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Users,
  BookOpen,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Clock,
  Star,
  Briefcase,
  Building2,
  FileText,
  Target,
  TrendingUp,
  Heart,
  AlertCircle,
  UserCircle,
  Trophy,
  Sparkles,
  Contact
} from 'lucide-react'
import { AdvancedProfilePictureUpload } from '@/components/ui/advanced-profile-picture-upload'

interface TeacherProfile {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  bio?: string
  profile_picture_url?: string
  date_of_birth?: string
  hire_date?: string
  department?: string
  subject_specialization?: string
  education_level?: string
  years_experience?: number
  certifications?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

const TeacherProfilePage = () => {
  const router = useRouter()
  const { user, profile: reduxProfile } = useAppSelector((state) => state.auth)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<TeacherProfile>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/profile')
      if (response.ok) {
        const data = await response.json()
        const profileData = data.profile || reduxProfile
        setProfile(profileData)
        setEditedProfile({
          ...profileData,
          email: profileData?.email || user?.email || ''
        })
      } else {
        setProfile(reduxProfile)
        setEditedProfile({
          ...reduxProfile,
          email: (reduxProfile as any)?.email || user?.email || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(reduxProfile)
      setEditedProfile({
        ...reduxProfile,
        email: (reduxProfile as any)?.email || user?.email || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile)
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setEditing(false)
        showToast('Profile updated successfully!', 'success')
      } else {
        showToast('Failed to update profile', 'error')
      }
    } catch (error) {
      showToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-2xl shadow-2xl z-[10000] transform transition-all duration-500 backdrop-blur-xl border ${
      type === 'success' 
        ? 'bg-green-500/90 text-white border-green-400/50' 
        : 'bg-red-500/90 text-white border-red-400/50'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => document.body.removeChild(toast), 500)
    }, 3000)
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
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl p-2 flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md flex-shrink-0">
                        <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Teacher Profile</h1>
                        <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm hidden sm:block" style={{ fontFamily: 'var(--font-dm-sans)' }}>Manage your professional information</p>
                        <p className="text-gray-600 dark:text-slate-400 text-xs sm:hidden" style={{ fontFamily: 'var(--font-dm-sans)' }}>Manage your info</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {editing ? (
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <Button
                          onClick={() => setEditing(false)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl flex-1 sm:flex-none"
                        >
                          <X className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl flex-1 sm:flex-none shadow-sm"
                        >
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white sm:mr-1" />
                          ) : (
                            <Save className="h-4 w-4 sm:mr-1" />
                          )}
                          <span className="hidden sm:inline">Save</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setEditing(true)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl w-full sm:w-auto shadow-sm"
                      >
                        <Edit3 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Profile Picture & Basic Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-1"
              >
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl h-fit">
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center">
                      <div className="mb-4 sm:mb-6">
                        {editing ? (
                          <AdvancedProfilePictureUpload
                            currentImage={editedProfile?.profile_picture_url}
                            onImageUpdate={(imageUrl) => {
                              setEditedProfile(prev => ({ ...prev, profile_picture_url: imageUrl }))
                            }}
                          />
                        ) : (
                          <div className="relative inline-block">
                            {profile?.profile_picture_url ? (
                              <Image
                                src={profile.profile_picture_url}
                                alt="Profile"
                                width={96}
                                height={96}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg mx-auto"
                              />
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center border-4 border-white/20 shadow-lg mx-auto">
                                <span className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
                                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-1 truncate px-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                        {profile?.first_name} {profile?.last_name}
                      </h2>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2 text-sm sm:text-base truncate px-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.department || 'Teacher'}</p>
                      <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm truncate px-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.subject_specialization}</p>
                      
                      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-center space-x-2 px-2">
                          <div className="p-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-white" />
                          </div>
                          <span className="text-xs sm:text-sm truncate text-gray-700 dark:text-slate-300 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.email || user?.email || 'No email provided'}</span>
                        </div>
                        {profile?.phone && (
                          <div className="flex items-center justify-center space-x-2 px-2">
                            <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-white" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl mt-4 sm:mt-6">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-sm sm:text-base" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      Professional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Experience</span>
                      </div>
                      <span className="text-gray-900 dark:text-slate-100 font-bold text-xs sm:text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.years_experience || 0} years</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg">
                          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Education</span>
                      </div>
                      <span className="text-gray-900 dark:text-slate-100 font-bold text-xs truncate max-w-[120px] sm:max-w-none" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.education_level || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Hire Date</span>
                      </div>
                      <span className="text-gray-900 dark:text-slate-100 font-bold text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'Not specified'}
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
                
                {/* Personal Information */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-base sm:text-lg" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Contact className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold block mb-1.5 sm:mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>First Name</label>
                      {editing ? (
                        <Input
                          value={editedProfile.first_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, first_name: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.first_name || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold block mb-1.5 sm:mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Last Name</label>
                      {editing ? (
                        <Input
                          value={editedProfile.last_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, last_name: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.last_name || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold block mb-1.5 sm:mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Email Address</label>
                      {editing ? (
                        <Input
                          type="email"
                          value={editedProfile.email || user?.email || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                          placeholder="Enter your email address"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base truncate border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.email || user?.email || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold block mb-1.5 sm:mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Phone Number</label>
                      {editing ? (
                        <Input
                          value={editedProfile.phone || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.phone || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold block mb-1.5 sm:mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Date of Birth</label>
                      {editing ? (
                        <Input
                          type="date"
                          value={editedProfile.date_of_birth || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not specified'}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm font-semibold block mb-1.5 sm:mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Address</label>
                      {editing ? (
                        <Input
                          value={editedProfile.address || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.address || 'Not specified'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-base sm:text-lg" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Department</label>
                      {editing ? (
                        <Input
                          value={editedProfile.department || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, department: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.department || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Subject Specialization</label>
                      {editing ? (
                        <Input
                          value={editedProfile.subject_specialization || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, subject_specialization: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.subject_specialization || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Education Level</label>
                      {editing ? (
                        <select
                          value={editedProfile.education_level || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, education_level: e.target.value }))}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        >
                          <option value="">Select Education Level</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="Doctorate">Doctorate</option>
                          <option value="Teaching Certificate">Teaching Certificate</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.education_level || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Years of Experience</label>
                      {editing ? (
                        <Input
                          type="number"
                          value={editedProfile.years_experience || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.years_experience || 0} years</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Bio</label>
                      {editing ? (
                        <textarea
                          value={editedProfile.bio || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 resize-none"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg min-h-[80px] border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {profile?.bio || 'No bio provided'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100 text-base sm:text-lg" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Contact Name</label>
                      {editing ? (
                        <Input
                          value={editedProfile.emergency_contact_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.emergency_contact_name || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-gray-700 dark:text-slate-300 text-sm font-semibold block mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Contact Phone</label>
                      {editing ? (
                        <Input
                          value={editedProfile.emergency_contact_phone || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-lg"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700" style={{ fontFamily: 'var(--font-dm-sans)' }}>{profile?.emergency_contact_phone || 'Not specified'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}

export default TeacherProfilePage
