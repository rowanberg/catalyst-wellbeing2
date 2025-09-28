'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Note: Separator component not available, using manual dividers
import Image from 'next/image'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronDown,
  Edit3,
  Camera,
  Save,
  X,
  Crown,
  Star,
  Trophy,
  Target,
  Zap,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ProfilePictureUpload } from '@/components/ui/profile-picture-upload'
import { useToast } from '@/components/ui/toast'

interface ProfileSettingsDropdownProps {
  profile: any
  onProfileUpdate: (updates: any) => void
  className?: string
}

export const ProfileSettingsDropdown = ({ 
  profile, 
  onProfileUpdate, 
  className = "" 
}: ProfileSettingsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    soundEffects: true,
    privateProfile: false
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const handleSettingToggle = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }))
    
    addToast({
      title: "Settings Updated",
      description: `${setting.charAt(0).toUpperCase() + setting.slice(1)} ${settings[setting as keyof typeof settings] ? 'disabled' : 'enabled'}`,
      type: "success"
    })
  }

  const settingsOptions = [
    {
      id: 'profile-picture',
      label: 'Change Profile Picture',
      icon: <Camera className="w-4 h-4" />,
      action: () => setShowProfilePictureModal(true),
      type: 'action'
    },
    {
      id: 'theme',
      label: 'Dark Mode',
      icon: settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
      action: () => handleSettingToggle('theme'),
      type: 'toggle',
      enabled: settings.theme === 'dark'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: settings.notifications ? <Bell className="w-4 h-4" /> : <Bell className="w-4 h-4 opacity-50" />,
      action: () => handleSettingToggle('notifications'),
      type: 'toggle',
      enabled: settings.notifications
    },
    {
      id: 'soundEffects',
      label: 'Sound Effects',
      icon: settings.soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />,
      action: () => handleSettingToggle('soundEffects'),
      type: 'toggle',
      enabled: settings.soundEffects
    },
    {
      id: 'privateProfile',
      label: 'Private Profile',
      icon: settings.privateProfile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
      action: () => handleSettingToggle('privateProfile'),
      type: 'toggle',
      enabled: settings.privateProfile
    },
    {
      id: 'divider',
      type: 'divider'
    },
    {
      id: 'edit-profile',
      label: 'Edit Profile Info',
      icon: <User className="w-4 h-4" />,
      action: () => {
        addToast({
          title: "Coming Soon",
          description: "Profile editing will be available soon!",
          type: "info"
        })
        setIsOpen(false)
      },
      type: 'action'
    },
    {
      id: 'privacy-settings',
      label: 'Privacy & Safety',
      icon: <Shield className="w-4 h-4" />,
      action: () => {
        addToast({
          title: "Coming Soon",
          description: "Privacy settings will be available soon!",
          type: "info"
        })
        setIsOpen(false)
      },
      type: 'action'
    }
  ]

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-white/20 p-2"
        >
          <Settings className="w-5 h-5" />
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Profile Settings</h3>
                  <p className="text-xs text-gray-600">Customize your experience</p>
                </div>

                {/* Settings Options */}
                <div className="py-2">
                  {settingsOptions.map((option: any, index: number) => {
                    if (option.type === 'divider') {
                      return <div key={option.id} className="border-t border-gray-100 my-2" />
                    }

                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                        onClick={option.action}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-indigo-50/50 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-lg ${
                            option.type === 'toggle' && option.enabled 
                              ? 'bg-indigo-100 text-indigo-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {option.icon}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {option.label}
                          </span>
                        </div>
                        
                        {option.type === 'toggle' && (
                          <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                            option.enabled ? 'bg-indigo-500' : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform duration-200 ${
                              option.enabled ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Need help? Contact your teacher
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Picture Upload Modal */}
      {showProfilePictureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Change Profile Picture</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfilePictureModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            {/* Current Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 shadow-lg">
                {profile?.profile_picture_url ? (
                  <Image
                    src={profile?.profile_picture_url}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Options */}
            <div className="space-y-3">
              <ProfilePictureUpload
                currentImage={profile?.profile_picture_url}
                onImageUpdate={(imageUrl: string) => {
                  onProfileUpdate({ profile_picture_url: imageUrl })
                  setShowProfilePictureModal(false)
                  setIsOpen(false)
                }}
                className="w-full"
              />
              
              <Button
                variant="outline"
                onClick={() => setShowProfilePictureModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
