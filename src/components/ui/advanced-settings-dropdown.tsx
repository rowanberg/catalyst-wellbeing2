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

interface AdvancedSettingsDropdownProps {
  profile: any
  onProfileUpdate: (updates: any) => void
  className?: string
}

// Advanced Toggle Switch Component
const AdvancedToggle = ({ 
  enabled, 
  onChange, 
  size = 'md',
  color = 'purple',
  animated = true 
}: {
  enabled: boolean
  onChange: () => void
  size?: 'sm' | 'md' | 'lg'
  color?: 'purple' | 'blue' | 'green' | 'pink'
  animated?: boolean
}) => {
  const sizes = {
    sm: { width: 'w-8', height: 'h-5', thumb: 'w-3 h-3', translate: 'translate-x-3' },
    md: { width: 'w-11', height: 'h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { width: 'w-14', height: 'h-7', thumb: 'w-5 h-5', translate: 'translate-x-7' }
  }
  
  const colors = {
    purple: enabled ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300',
    blue: enabled ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300',
    green: enabled ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300',
    pink: enabled ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gray-300'
  }

  return (
    <motion.button
      onClick={onChange}
      className={`${sizes[size].width} ${sizes[size].height} rounded-full transition-all duration-300 ${colors[color]} shadow-lg hover:shadow-xl relative overflow-hidden`}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background glow effect */}
      {enabled && animated && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-30"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Thumb */}
      <motion.div
        className={`${sizes[size].thumb} bg-white rounded-full shadow-md absolute top-0.5 left-0.5 flex items-center justify-center`}
        animate={{ x: enabled ? sizes[size].translate.split('-')[1] : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {animated && enabled && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-2 h-2 text-purple-500" />
          </motion.div>
        )}
      </motion.div>
    </motion.button>
  )
}

export const AdvancedSettingsDropdown = ({ 
  profile, 
  onProfileUpdate, 
  className = "" 
}: AdvancedSettingsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [settings, setSettings] = useState({
    theme: 'light',
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
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const handleSettingToggle = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }))
    
    // Simulate haptic feedback
    if (settings.hapticFeedback && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    showToast('Setting updated successfully!', 'success')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    { id: 'all', label: 'All Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Heart className="w-4 h-4" /> }
  ]

  const settingsOptions = [
    {
      id: 'profile-picture',
      label: 'Profile Picture Studio',
      description: 'Upload, crop, and add filters',
      icon: <User className="w-5 h-5" />,
      category: 'appearance',
      type: 'component',
      component: (
        <AdvancedProfilePictureUpload
          currentImage={profile?.profile_picture_url}
          onImageUpdate={(imageUrl: string) => {
            onProfileUpdate({ profile_picture_url: imageUrl })
          }}
        />
      )
    },
    {
      id: 'theme',
      label: 'Dark Mode',
      description: 'Switch between light and dark themes',
      icon: settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      action: () => handleSettingToggle('theme'),
      category: 'appearance',
      type: 'toggle',
      enabled: settings.theme === 'dark',
      color: 'blue' as const
    },
    {
      id: 'animations',
      label: 'Animations',
      description: 'Enable smooth animations and transitions',
      icon: <Zap className="w-5 h-5" />,
      action: () => handleSettingToggle('animations'),
      category: 'appearance',
      type: 'toggle',
      enabled: settings.animations,
      color: 'purple' as const
    },
    {
      id: 'notifications',
      label: 'Push Notifications',
      description: 'Receive updates and reminders',
      icon: <Bell className="w-5 h-5" />,
      action: () => handleSettingToggle('notifications'),
      category: 'notifications',
      type: 'toggle',
      enabled: settings.notifications,
      color: 'green' as const
    },
    {
      id: 'soundEffects',
      label: 'Sound Effects',
      description: 'Play sounds for interactions',
      icon: settings.soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />,
      action: () => handleSettingToggle('soundEffects'),
      category: 'accessibility',
      type: 'toggle',
      enabled: settings.soundEffects,
      color: 'pink' as const
    },
    {
      id: 'hapticFeedback',
      label: 'Haptic Feedback',
      description: 'Feel vibrations on interactions',
      icon: <Sparkles className="w-5 h-5" />,
      action: () => handleSettingToggle('hapticFeedback'),
      category: 'accessibility',
      type: 'toggle',
      enabled: settings.hapticFeedback,
      color: 'purple' as const
    },
    {
      id: 'privateProfile',
      label: 'Private Profile',
      description: 'Control who can see your profile',
      icon: settings.privateProfile ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />,
      action: () => handleSettingToggle('privateProfile'),
      category: 'privacy',
      type: 'toggle',
      enabled: settings.privateProfile,
      color: 'blue' as const
    },
    {
      id: 'autoSave',
      label: 'Auto Save',
      description: 'Automatically save your progress',
      icon: <Star className="w-5 h-5" />,
      action: () => handleSettingToggle('autoSave'),
      category: 'all',
      type: 'toggle',
      enabled: settings.autoSave,
      color: 'green' as const
    },
    {
      id: 'dataSync',
      label: 'Data Sync',
      description: 'Sync data across devices',
      icon: <Globe className="w-5 h-5" />,
      action: () => handleSettingToggle('dataSync'),
      category: 'privacy',
      type: 'toggle',
      enabled: settings.dataSync,
      color: 'blue' as const
    }
  ]

  const filteredSettings = settingsOptions.filter(option => {
    const matchesSearch = option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         option.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'all' || option.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20 transition-all duration-300 group"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Settings className="w-5 h-5 text-white group-hover:text-white/90" />
        </motion.div>
        
        {/* Notification dot */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Advanced Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            {createPortal(
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                className="fixed right-4 top-20 w-96 max-w-[95vw] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 z-[9999] overflow-hidden max-h-[80vh]"
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
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/20 rounded-xl text-white placeholder-white/60 border border-white/30 focus:border-white/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex space-x-2 overflow-x-auto">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
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
                    {filteredSettings.map((option: any, index: number) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        {option.type === 'component' ? (
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl text-purple-600">
                                {option.icon}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{option.label}</h4>
                                <p className="text-sm text-gray-600">{option.description}</p>
                              </div>
                            </div>
                            {option.component}
                          </div>
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                            onClick={option.action}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-xl transition-all ${
                                option.type === 'toggle' && option.enabled 
                                  ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600' 
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-purple-50 group-hover:text-purple-600'
                              }`}>
                                {option.icon}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                                  {option.label}
                                </h4>
                                <p className="text-sm text-gray-600">{option.description}</p>
                              </div>
                            </div>
                            
                            {option.type === 'toggle' && (
                              <AdvancedToggle
                                enabled={option.enabled || false}
                                onChange={option.action || (() => {})}
                                color={option.color}
                                animated={settings.animations}
                              />
                            )}
                            
                            {option.type === 'action' && (
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
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
  )
}
