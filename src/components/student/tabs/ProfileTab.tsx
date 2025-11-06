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
  Settings, ChevronRight, Wallet, GraduationCap,
  Clock, Sparkles, Zap, Activity, Medal, Shield, BookOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RankCard, RankCardSkeleton } from '@/components/student/RankCard'
import { useStudentRank } from '@/hooks/useStudentRank'

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
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg overflow-hidden" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)', background: 'linear-gradient(to bottom right, var(--theme-highlight), var(--theme-tertiary))' }}>
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
                      width={96}
                      height={96}
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
                    <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
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
              className="absolute bottom-0 right-0 p-1.5 rounded-full text-white shadow-md transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{ backgroundColor: 'var(--theme-primary)' }}
              onMouseEnter={(e) => !uploading && (e.currentTarget.style.backgroundColor = 'var(--theme-secondary)')}
              onMouseLeave={(e) => !uploading && (e.currentTarget.style.backgroundColor = 'var(--theme-primary)')}
            >
              {uploading ? (
                <div className="relative">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <Camera className="h-3.5 w-3.5" />
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
          <div className="flex-1 text-center sm:text-left min-w-0">
            {/* Name and ID */}
            <div className="mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {profileData.profile.first_name} {profileData.profile.last_name}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <p className="text-xs sm:text-sm text-slate-600">
                  {profileData.profile.school?.name || 'Catalyst Wells Student'}
                </p>
                <span className="text-slate-400">•</span>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 20%, transparent)', color: 'var(--theme-primary)' }}>
                  {profileData.profile.student_tag || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Grade and Class Badges */}
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              {profileData.profile.grade_level && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 30%, transparent), color-mix(in srgb, var(--theme-tertiary) 30%, transparent))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)' }}>
                  <GraduationCap className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Grade</p>
                    <p className="text-sm font-bold leading-tight" style={{ color: 'var(--theme-primary)' }}>{profileData.profile.grade_level}</p>
                  </div>
                </div>
              )}
              {profileData.profile.class_name && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-tertiary) 30%, transparent), color-mix(in srgb, var(--theme-accent) 30%, transparent))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)' }}>
                  <Users className="h-4 w-4" style={{ color: 'var(--theme-secondary)' }} />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Class</p>
                    <p className="text-sm font-bold leading-tight" style={{ color: 'var(--theme-secondary)' }}>{profileData.profile.class_name}</p>
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
      <CardHeader className="rounded-t-2xl" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 30%, transparent), color-mix(in srgb, var(--theme-tertiary) 30%, transparent))' }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl shadow-sm" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => router.push('/student/settings')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 40%, transparent), color-mix(in srgb, var(--theme-tertiary) 40%, transparent))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))'}
          >
            <Settings className="h-6 w-6" style={{ color: 'var(--theme-primary)' }} />
            <span className="text-xs font-medium text-slate-700">Settings</span>
          </button>
          <button
            onClick={() => router.push('/student/messaging')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 40%, transparent), color-mix(in srgb, var(--theme-tertiary) 40%, transparent))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))'}
          >
            <MessageCircle className="h-6 w-6" style={{ color: 'var(--theme-secondary)' }} />
            <span className="text-xs font-medium text-slate-700">Messages</span>
          </button>
          <button
            onClick={() => router.push('/student/wallet')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 40%, transparent), color-mix(in srgb, var(--theme-tertiary) 40%, transparent))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))'}
          >
            <Wallet className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
            <span className="text-xs font-medium text-slate-700">Wallet</span>
          </button>
          <button
            onClick={() => router.push('/student/quests')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 40%, transparent), color-mix(in srgb, var(--theme-tertiary) 40%, transparent))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))'}
          >
            <Target className="h-6 w-6" style={{ color: 'var(--theme-secondary)' }} />
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
  
  // Fetch student rank data for grade rank display
  const { rankData, loading: rankLoading } = useStudentRank(profile?.id)

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
        <div className="h-32 rounded-3xl animate-pulse" style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }} />
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
        <Shield className="h-16 w-16 mb-4" style={{ color: 'var(--theme-primary)' }} />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error loading profile</h2>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={onRefresh} style={{ backgroundColor: 'var(--theme-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-primary)'}>
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
        className="rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
        style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
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
                <Zap className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>{profileData.stats.xp}</span>
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
                <Trophy className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>#{profileData.stats.rank}</span>
              </div>
              <p className="text-xs text-slate-600">Class Rank</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>{profileData.stats.streakDays}</span>
              </div>
              <p className="text-xs text-slate-600">Day Streak</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-5 h-5" style={{ color: 'var(--theme-tertiary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--theme-tertiary)' }}>{profileData.stats.gems}</span>
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

      {/* Grade Rank Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {rankLoading ? (
          <RankCardSkeleton type="grade" />
        ) : rankData ? (
          <RankCard rankData={rankData} type="grade" />
        ) : (
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rank Data Yet</h3>
              <p className="text-sm text-gray-600">Complete assessments to see your grade rank and performance</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
