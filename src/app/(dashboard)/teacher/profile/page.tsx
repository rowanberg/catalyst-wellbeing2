'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
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
  Star
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-blue-400"></div>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2 flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Teacher Profile</h1>
                        <p className="text-white/80 text-xs sm:text-sm hidden sm:block">Manage your professional information</p>
                        <p className="text-white/80 text-xs sm:hidden">Manage your info</p>
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
                          className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl flex-1 sm:flex-none"
                        >
                          <X className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl flex-1 sm:flex-none"
                        >
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white sm:mr-1" />
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
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl w-full sm:w-auto"
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
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
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
                              <img
                                src={profile.profile_picture_url}
                                alt="Profile"
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg mx-auto"
                              />
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center border-4 border-white/20 shadow-lg mx-auto">
                                <span className="text-xl sm:text-2xl font-bold text-white">
                                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1 truncate px-2">
                        {profile?.first_name} {profile?.last_name}
                      </h2>
                      <p className="text-blue-300 font-medium mb-2 text-sm sm:text-base truncate px-2">{profile?.department || 'Teacher'}</p>
                      <p className="text-white/60 text-xs sm:text-sm truncate px-2">{profile?.subject_specialization}</p>
                      
                      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-white/80 px-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">{profile?.email || user?.email || 'No email provided'}</span>
                        </div>
                        {profile?.phone && (
                          <div className="flex items-center justify-center space-x-2 text-white/80 px-2">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl mt-4 sm:mt-6">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-white text-sm sm:text-base">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Professional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Experience</span>
                      <span className="text-white font-medium text-xs sm:text-sm">{profile?.years_experience || 0} years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Education</span>
                      <span className="text-white font-medium text-xs truncate max-w-[120px] sm:max-w-none">{profile?.education_level || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Hire Date</span>
                      <span className="text-white font-medium text-xs">
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
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-white text-base sm:text-lg">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div>
                      <label className="text-white/80 text-xs sm:text-sm font-medium block mb-1.5 sm:mb-2">First Name</label>
                      {editing ? (
                        <Input
                          value={editedProfile.first_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, first_name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">{profile?.first_name || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-white/80 text-xs sm:text-sm font-medium block mb-1.5 sm:mb-2">Last Name</label>
                      {editing ? (
                        <Input
                          value={editedProfile.last_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, last_name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">{profile?.last_name || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-xs sm:text-sm font-medium block mb-1.5 sm:mb-2">Email Address</label>
                      {editing ? (
                        <Input
                          type="email"
                          value={editedProfile.email || user?.email || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                          placeholder="Enter your email address"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base truncate">{profile?.email || user?.email || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-xs sm:text-sm font-medium block mb-1.5 sm:mb-2">Phone Number</label>
                      {editing ? (
                        <Input
                          value={editedProfile.phone || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">{profile?.phone || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-xs sm:text-sm font-medium block mb-1.5 sm:mb-2">Date of Birth</label>
                      {editing ? (
                        <Input
                          type="date"
                          value={editedProfile.date_of_birth || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">
                          {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not specified'}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-white/80 text-xs sm:text-sm font-medium block mb-1.5 sm:mb-2">Address</label>
                      {editing ? (
                        <Input
                          value={editedProfile.address || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg text-sm sm:text-base h-10 sm:h-auto"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">{profile?.address || 'Not specified'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-white text-base sm:text-lg">
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div>
                      <label className="text-white/80 text-sm font-medium block mb-2">Department</label>
                      {editing ? (
                        <Input
                          value={editedProfile.department || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, department: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg">{profile?.department || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium block mb-2">Subject Specialization</label>
                      {editing ? (
                        <Input
                          value={editedProfile.subject_specialization || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, subject_specialization: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg">{profile?.subject_specialization || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium block mb-2">Education Level</label>
                      {editing ? (
                        <select
                          value={editedProfile.education_level || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, education_level: e.target.value }))}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        >
                          <option value="">Select Education Level</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="Doctorate">Doctorate</option>
                          <option value="Teaching Certificate">Teaching Certificate</option>
                        </select>
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg">{profile?.education_level || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium block mb-2">Years of Experience</label>
                      {editing ? (
                        <Input
                          type="number"
                          value={editedProfile.years_experience || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg">{profile?.years_experience || 0} years</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-white/80 text-sm font-medium block mb-2">Bio</label>
                      {editing ? (
                        <textarea
                          value={editedProfile.bio || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg min-h-[80px]">
                          {profile?.bio || 'No bio provided'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 text-white text-base sm:text-lg">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0">
                    <div>
                      <label className="text-white/80 text-sm font-medium block mb-2">Contact Name</label>
                      {editing ? (
                        <Input
                          value={editedProfile.emergency_contact_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg">{profile?.emergency_contact_name || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium block mb-2">Contact Phone</label>
                      {editing ? (
                        <Input
                          value={editedProfile.emergency_contact_phone || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white rounded-lg"
                        />
                      ) : (
                        <p className="text-white bg-white/5 p-3 rounded-lg">{profile?.emergency_contact_phone || 'Not specified'}</p>
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
