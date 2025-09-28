'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, User, Camera, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/toast'

interface ProfilePictureUploadProps {
  currentImage?: string
  onImageUpdate: (imageUrl: string) => void
  className?: string
}

export const ProfilePictureUpload = ({ 
  currentImage, 
  onImageUpdate, 
  className = "" 
}: ProfilePictureUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        type: "error"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        type: "error"
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setShowUploadModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!previewUrl) return

    setIsUploading(true)
    try {
      // Convert data URL to blob
      const response = await fetch(previewUrl)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append('profilePicture', blob, 'profile-picture.jpg')

      // Upload to API
      const uploadResponse = await fetch('/api/student/profile-picture', {
        method: 'POST',
        body: formData
      })

      if (uploadResponse.ok) {
        const data = await uploadResponse.json()
        onImageUpdate(data.imageUrl)
        setShowUploadModal(false)
        setPreviewUrl(null)
        addToast({
          title: "Profile Picture Updated!",
          description: "Your new profile picture has been saved successfully.",
          type: "success"
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      addToast({
        title: "Upload Failed",
        description: "There was an error uploading your profile picture. Please try again.",
        type: "error"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setShowUploadModal(false)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload button overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-10"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Update Profile Picture</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200 shadow-lg">
                <Image
                  src={previewUrl || ''}
                  alt="Profile preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm">
                This will be your new profile picture. It will be visible to your teachers and classmates.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Save Picture</span>
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
