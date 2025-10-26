'use client'

import React, { useState, useMemo, useRef, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Camera, Mail, MapPin, Calendar, Trophy, Star,
  Award, Target, Flame, Gift, Users, MessageCircle,
  Settings, ChevronRight, BarChart3, GraduationCap,
  Clock, Sparkles, Zap, Activity, Medal, Shield, BookOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ProfileTabProps {
  data: any
  loading: boolean
  error: string | null
  onRefresh: () => void
  profile: any
}

// Memoized Profile Info Card
const ProfileInfoCard = memo(({ profileData, imageError, setImageError, uploading, uploadProgress, fileInputRef, handleProfilePictureUpload }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <Card className="border-0 shadow-lg rounded-2xl bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#FFDAB9]/50 shadow-xl overflow-hidden bg-gradient-to-br from-[#FFDAB9] to-[#FBC4AB]">
              {(() => {
                const avatarUrl = profileData.profile.avatar_url || profileData.profile.profile_picture_url
                console.log('Avatar URL:', avatarUrl)
                console.log('Image Error State:', imageError)
                console.log('Should show image:', !!avatarUrl && !imageError)
                
                if (avatarUrl && !imageError) {
                  return (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load error:', e)
                        setImageError(true)
                      }}
                      unoptimized
                    />
                  )
                } else {
                  console.log('Showing initial:', profileData.profile.first_name?.charAt(0) || 'S')
                  return (
                    <div className="w-full h-full flex items-center justify-center text-[#F08080] text-3xl sm:text-5xl font-bold">
                      {profileData.profile.first_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                  )
                }
              })()}
            </div>
            {/* Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-[#F08080] rounded-full text-white shadow-lg hover:bg-[#F4978E] transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {uploading ? (
                <div className="relative">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {profileData.profile.first_name} {profileData.profile.last_name}
            </h2>
            <div className="text-slate-600 mt-1 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
              <Badge variant="outline" className="bg-[#FFDAB9]/20 border-[#F08080]/30 text-[#F08080] font-mono">
                ID: {profileData.profile.student_tag || 'N/A'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-4">
              {profileData.profile.grade_level && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFDAB9]/40 to-[#FBC4AB]/40 rounded-xl border border-[#F4978E]/20">
                  <GraduationCap className="h-5 w-5 text-[#F08080]" />
                  <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium">Grade</p>
                    <p className="text-sm font-bold text-[#F08080]">{profileData.profile.grade_level}</p>
                  </div>
                </div>
              )}
              {profileData.profile.class_name && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FBC4AB]/40 to-[#F8AD9D]/40 rounded-xl border border-[#F4978E]/20">
                  <Users className="h-5 w-5 text-[#F4978E]" />
                  <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium">Class</p>
                    <p className="text-sm font-bold text-[#F4978E]">{profileData.profile.class_name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
))
ProfileInfoCard.displayName = 'ProfileInfoCard'

// Memoized Quick Actions Card
const QuickActionsCard = memo(({ router }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <Card className="border-0 shadow-lg rounded-2xl bg-white">
      <CardHeader className="bg-gradient-to-r from-[#FFDAB9]/30 to-[#FBC4AB]/30 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-[#F08080] to-[#F4978E] rounded-xl shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => router.push('/student/settings')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#FFDAB9]/20 to-[#FBC4AB]/20 hover:from-[#FFDAB9]/40 hover:to-[#FBC4AB]/40 transition-all active:scale-95 border border-[#FBC4AB]/30"
          >
            <Settings className="h-6 w-6 text-[#F08080]" />
            <span className="text-xs font-medium text-slate-700">Settings</span>
          </button>
          <button
            onClick={() => router.push('/student/messaging')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#FFDAB9]/20 to-[#FBC4AB]/20 hover:from-[#FFDAB9]/40 hover:to-[#FBC4AB]/40 transition-all active:scale-95 border border-[#FBC4AB]/30"
          >
            <MessageCircle className="h-6 w-6 text-[#F4978E]" />
            <span className="text-xs font-medium text-slate-700">Messages</span>
          </button>
          <button
            onClick={() => router.push('/student/analytics')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#FFDAB9]/20 to-[#FBC4AB]/20 hover:from-[#FFDAB9]/40 hover:to-[#FBC4AB]/40 transition-all active:scale-95 border border-[#FBC4AB]/30"
          >
            <BarChart3 className="h-6 w-6 text-[#F8AD9D]" />
            <span className="text-xs font-medium text-slate-700">Analytics</span>
          </button>
          <button
            onClick={() => router.push('/student/quests')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#FFDAB9]/20 to-[#FBC4AB]/20 hover:from-[#FFDAB9]/40 hover:to-[#FBC4AB]/40 transition-all active:scale-95 border border-[#FBC4AB]/30"
          >
            <Target className="h-6 w-6 text-[#F4978E]" />
            <span className="text-xs font-medium text-slate-700">Quests</span>
          </button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
))
QuickActionsCard.displayName = 'QuickActionsCard'

export function ProfileTab({ data, loading, error, onRefresh, profile }: ProfileTabProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleVibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
  }, [])

  const compressImage = useCallback(async (image: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(image)
      
      reader.onload = () => {
        const imageDataUrl = reader.result as string
        const imageElement = document.createElement('img')
        imageElement.src = imageDataUrl

        imageElement.onload = () => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (!context) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          
          const maxWidth = 800
          const maxHeight = 800
          let { width, height } = imageElement
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }
          
          canvas.width = width
          canvas.height = height
          context.drawImage(imageElement, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          }, 'image/jpeg', 0.85)
        }
        
        imageElement.onerror = () => reject(new Error('Failed to load image'))
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }, [])

  const handleProfilePictureUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(20)

      const compressedImage = await compressImage(file)
      setUploadProgress(50)

      const formData = new FormData()
      formData.append('file', compressedImage, 'profile-picture.jpg')
      setUploadProgress(70)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      // Success - reload page to show new picture
      setUploadProgress(100)
      handleVibrate()
      window.location.reload()
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      alert(error.message || 'Failed to upload profile picture. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [compressImage, handleVibrate])

  // Profile data with fallbacks - MUST be before early returns to maintain hook order
  const profileData = useMemo(() => {
    const profileObj = data?.profile || profile || {
      first_name: 'Student',
      last_name: 'Name',
      email: 'student@school.edu',
      avatar_url: null,
      profile_picture_url: null,
      grade_level: null,
      school: { name: null },
      bio: null,
    }
    
    return {
      profile: profileObj,
      stats: data?.stats || {
        level: 1,
        xp: 0,
        nextLevelXP: 100,
        streakDays: 0,
        gems: 0,
        badges: 0,
        rank: 0,
      },
    }
  }, [profile, data])

  const xpProgress = useMemo(() => 
    (profileData.stats.xp / profileData.stats.nextLevelXP) * 100,
    [profileData.stats.xp, profileData.stats.nextLevelXP]
  )

  // Loading state
  if (loading && !data) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-32 bg-gradient-to-r from-[#F08080] to-[#F4978E] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <Shield className="h-16 w-16 mb-4 text-[#F08080]" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error loading profile</h2>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={onRefresh} className="bg-[#F08080] hover:bg-[#F4978E]">
          Try Again
        </Button>
      </div>
    )
  }


  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#F08080] to-[#F4978E] rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {profileData.profile.school?.name && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                      {profileData.profile.school.name}
                    </h1>
                    {profileData.profile.school.city && profileData.profile.school.country && (
                      <p className="text-white/80 text-xs sm:text-sm">
                        {profileData.profile.school.city}, {profileData.profile.school.country}
                      </p>
                    )}
                  </div>
                </div>
                {profileData.profile.school.vision && (
                  <p className="text-white/90 text-sm sm:text-base italic border-l-4 border-white/30 pl-4 mt-3">
                    "{profileData.profile.school.vision}"
                  </p>
                )}
              </div>
            )}
            {!profileData.profile.school?.name && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage your account and view your progress</p>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/student/settings')}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-[#F08080]" />
                <span className="text-2xl font-bold text-[#F08080]">{profileData.stats.xp}</span>
              </div>
              <p className="text-xs text-slate-600">Total XP</p>
              <Progress value={xpProgress} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-[#F4978E]" />
                <span className="text-2xl font-bold text-[#F4978E]">#{profileData.stats.rank}</span>
              </div>
              <p className="text-xs text-slate-600">Class Rank</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-[#F8AD9D]" />
                <span className="text-2xl font-bold text-[#F8AD9D]">{profileData.stats.streakDays}</span>
              </div>
              <p className="text-xs text-slate-600">Day Streak</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-5 h-5 text-[#F4978E]" />
                <span className="text-2xl font-bold text-[#F4978E]">{profileData.stats.gems}</span>
              </div>
              <p className="text-xs text-slate-600">Gems</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Profile Info */}
      <ProfileInfoCard
        profileData={profileData}
        imageError={imageError}
        setImageError={setImageError}
        uploading={uploading}
        uploadProgress={uploadProgress}
        fileInputRef={fileInputRef}
        handleProfilePictureUpload={handleProfilePictureUpload}
      />

      {/* Quick Actions */}
      <QuickActionsCard router={router} />
    </div>
  )
}
