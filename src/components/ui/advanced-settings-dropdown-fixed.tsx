'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  X,
  Search,
  Palette,
  Shield, 
  Bell, 
  Eye, 
  Accessibility, 
  Sparkles, 
  RotateCw,
  Globe,
  Lock,
  Heart,
  Star,
  ChevronDown,
  ChevronRight,
  User,
  Moon,
  Sun,
  Zap,
  Volume2,
  VolumeX,
  EyeOff
} from 'lucide-react'
import { Button } from './button'
import { AdvancedProfilePictureUpload } from './advanced-profile-picture-upload'

interface Profile {
  profile_picture_url?: string
  [key: string]: any
}

interface AdvancedSettingsDropdownProps {
  profile: Profile
  onProfileUpdate: (updates: Partial<Profile>) => void
  className?: string
}

// Advanced Toggle Switch Component
const AdvancedToggle = ({ 
  enabled, 
  onChange, 
  color = 'purple',
  size = 'md' 
}: { 
  enabled: boolean
  onChange: () => void
  color?: 'purple' | 'blue' | 'green' | 'pink'
  size?: 'sm' | 'md' | 'lg'
}) => {
  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500', 
    green: 'bg-green-500',
    pink: 'bg-pink-500'
  }

  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5', 
    lg: 'w-12 h-6'
  }

  const thumbSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      data-toggle-switch="true"
      className={`relative ${sizeClasses[size]} rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 ${
        enabled ? colorClasses[color] : 'bg-gray-300'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={`${thumbSizes[size]} bg-white rounded-full shadow-lg absolute top-0.5 transition-all duration-300 ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
        animate={{
          x: enabled ? (size === 'sm' ? 16 : size === 'md' ? 20 : 24) : 2,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {enabled && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-full h-full flex items-center justify-center"
          >
            <Sparkles className="w-2 h-2 text-yellow-400" />
          </motion.div>
        )}
      </motion.div>
    </motion.button>
  )
}

export const AdvancedSettingsDropdown = ({ 
  profile, 
  onProfileUpdate, 
  className 
}: AdvancedSettingsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark',
    notifications: true,
    soundEffects: true,
    privateProfile: false,
    autoSave: true,
    animations: true,
    hapticFeedback: true,
    dataSync: true
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Create a toast notification element
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-[10000] transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`
    toast.textContent = message
    toast.style.transform = 'translateX(100%)'
    
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
    }, 100)
    
    // Animate out and remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  const handleSettingToggle = (setting: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    
    setSettings(prev => {
      const newValue = !prev[setting as keyof typeof prev]
      const newSettings = {
        ...prev,
        [setting]: newValue
      }
      
      // Apply theme changes immediately
      if (setting === 'theme') {
        const isDark = newSettings.theme === 'dark'
        document.documentElement.classList.toggle('dark', isDark)
      }
      
      // Simulate haptic feedback
      if (newSettings.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      return newSettings
    })
    
    showToast(`${setting.charAt(0).toUpperCase() + setting.slice(1).replace(/([A-Z])/g, ' $1')} ${settings[setting as keyof typeof settings] ? 'disabled' : 'enabled'}!`, 'success')
  }

  // Close dropdown when clicking outside (but not inside the modal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Don't close if clicking inside the modal or on toggle switches
      if (target.closest('[data-modal-content]') || target.closest('[data-toggle-switch]')) {
        return
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const categories = [
    { id: 'all', label: 'All', icon: <Globe className="w-4 h-4" />, color: 'text-gray-600' },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, color: 'text-purple-600' },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" />, color: 'text-blue-600' },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, color: 'text-green-600' },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility className="w-4 h-4" />, color: 'text-pink-600' }
  ]

  const settingsOptions: Array<{
    id: string
    title: string
    description: string
    category: string
    icon: React.ReactNode
    type: 'component' | 'select' | 'slider' | 'toggle'
    component?: React.ReactNode
    value?: string | number
    options?: string[]
    onChange?: (value?: any, event?: React.MouseEvent) => void
    enabled?: boolean
    color?: 'purple' | 'blue' | 'green' | 'pink'
    min?: number
    max?: number
  }> = [
    {
      id: 'profile-picture',
      title: 'Profile Picture',
      description: 'Upload and customize your profile photo',
      category: 'appearance',
      icon: <User className="w-5 h-5" />,
      type: 'component',
      component: (
        <AdvancedProfilePictureUpload
          currentImage={profile?.profile_picture_url}
          onImageUpdate={(imageUrl) => {
            onProfileUpdate({ profile_picture_url: imageUrl })
          }}
        />
      )
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Choose your preferred language',
      category: 'appearance',
      icon: <Globe className="w-5 h-5" />,
      type: 'select',
      value: 'English',
      options: ['English', 'Spanish', 'French', 'German', 'Chinese'],
      onChange: (value: string) => showToast(`Language changed to ${value}!`, 'success')
    },
    {
      id: 'fontSize',
      title: 'Font Size',
      description: 'Adjust text size for better readability',
      category: 'accessibility',
      icon: <Star className="w-5 h-5" />,
      type: 'slider',
      value: 16,
      min: 12,
      max: 24,
      onChange: (value: number) => {
        document.documentElement.style.fontSize = `${value}px`
        showToast(`Font size set to ${value}px!`, 'success')
      }
    },
    {
      id: 'theme',
      title: 'Dark Mode',
      description: 'Switch between light and dark themes',
      category: 'appearance',
      icon: settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.theme === 'dark',
      onChange: (e?: React.MouseEvent) => handleSettingToggle('theme', e),
      color: 'purple' as const
    },
    {
      id: 'animations',
      title: 'Animations',
      description: 'Enable smooth transitions and effects',
      category: 'appearance',
      icon: <Zap className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.animations,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('animations', e),
      color: 'purple' as const
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Receive updates and reminders',
      category: 'notifications',
      icon: <Bell className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.notifications,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('notifications', e),
      color: 'green' as const
    },
    {
      id: 'soundEffects',
      title: 'Sound Effects',
      description: 'Play sounds for interactions',
      category: 'notifications',
      icon: settings.soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.soundEffects,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('soundEffects', e),
      color: 'green' as const
    },
    {
      id: 'privateProfile',
      title: 'Private Profile',
      description: 'Hide your profile from other users',
      category: 'privacy',
      icon: settings.privateProfile ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.privateProfile,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('privateProfile', e),
      color: 'blue' as const
    },
    {
      id: 'dataSync',
      title: 'Data Sync',
      description: 'Sync your data across devices',
      category: 'privacy',
      icon: <RotateCw className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.dataSync,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('dataSync', e),
      color: 'blue' as const
    },
    {
      id: 'hapticFeedback',
      title: 'Haptic Feedback',
      description: 'Feel vibrations for interactions',
      category: 'accessibility',
      icon: <Heart className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.hapticFeedback,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('hapticFeedback', e),
      color: 'pink' as const
    },
    {
      id: 'autoSave',
      title: 'Auto Save',
      description: 'Automatically save your progress',
      category: 'accessibility',
      icon: <Star className="w-5 h-5" />,
      type: 'toggle',
      enabled: settings.autoSave,
      onChange: (e?: React.MouseEvent) => handleSettingToggle('autoSave', e),
      color: 'pink' as const
    }
  ]

  const filteredSettings = settingsOptions.filter(option => {
    const matchesSearch = option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         option.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'all' || option.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        {/* Settings Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/30 transition-all duration-300 group"
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-white/90 transition-colors" />
        </motion.button>

        {/* Notification Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-2 border-white"
        >
          <div className="w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse" />
        </motion.div>

        {/* Settings Modal */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
              />
              
              {/* Dropdown */}
              {createPortal(
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                  className="fixed right-4 top-20 w-96 max-w-[95vw] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 z-[9999] overflow-hidden max-h-[80vh]"
                  data-modal-content="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with Search */}
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">Settings Studio</h3>
                        <p className="text-white/80 text-sm">Customize your experience</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:bg-white/20 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search settings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex space-x-2 overflow-x-auto">
                      {categories.map((category) => (
                        <motion.button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                            activeCategory === category.id
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {category.icon}
                          <span>{category.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Settings Options */}
                  <div className="max-h-[50vh] overflow-y-auto">
                    <div className="p-4 space-y-3">
                      <AnimatePresence>
                        {filteredSettings.map((option, index) => (
                          <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="group"
                          >
                            {option.type === 'component' ? (
                              <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                    {option.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{option.title}</h4>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                  </div>
                                </div>
                                {option.component}
                              </div>
                            ) : option.type === 'select' ? (
                              <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                    {option.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{option.title}</h4>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                  </div>
                                </div>
                                <select 
                                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                                  defaultValue={option.value as string}
                                  onChange={(e) => option.onChange && option.onChange(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {option.options?.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            ) : option.type === 'slider' ? (
                              <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="p-2 bg-pink-100 rounded-xl text-pink-600">
                                    {option.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{option.title}</h4>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{option.value}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={option.min}
                                  max={option.max}
                                  defaultValue={option.value as number}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                  onChange={(e) => option.onChange && option.onChange(parseInt(e.target.value))}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group-hover:scale-[1.02]">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-xl ${
                                    option.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                    option.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                    option.color === 'green' ? 'bg-green-100 text-green-600' :
                                    'bg-pink-100 text-pink-600'
                                  }`}>
                                    {option.icon}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{option.title}</h4>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                  </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <AdvancedToggle
                                    enabled={option.enabled || false}
                                    onChange={() => option.onChange && option.onChange()}
                                    color={option.color}
                                  />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {filteredSettings.length} settings available
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">All synced</span>
                      </div>
                    </div>
                  </div>
                </motion.div>,
                document.body
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
