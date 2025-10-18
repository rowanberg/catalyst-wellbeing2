'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon, Crop, Sparkles, ZoomIn, ZoomOut, RotateCw, Camera, Palette, Scissors, Check } from 'lucide-react'
import { Button } from './button'
import NextImage from 'next/image'

interface AdvancedProfilePictureUploadProps {
  currentImage?: string
  onImageUpdate: (imageUrl: string) => void
  className?: string
}

export const AdvancedProfilePictureUpload = ({ 
  currentImage, 
  onImageUpdate, 
  className = "" 
}: AdvancedProfilePictureUploadProps) => {
  console.log('🎨 [Component] AdvancedProfilePictureUpload mounted')

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<'idle' | 'processing' | 'uploading' | 'success' | 'error'>('idle')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editMode, setEditMode] = useState<'crop' | 'filter' | null>(null)
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 100, height: 100, zoom: 1 })
  const [selectedFilter, setSelectedFilter] = useState('none')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug: Log when modal visibility changes
  useEffect(() => {
    console.log('🚪 [Modal] showUploadModal changed to:', showUploadModal)
    console.log('🚪 [Modal] previewImage exists:', !!previewImage)
    console.log('🚪 [Modal] editMode:', editMode)
  }, [showUploadModal, previewImage, editMode])

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`)
    if (type === 'error') {
      setErrorMessage(message)
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  const filters = [
    { name: 'none', label: 'Original', style: 'filter: none' },
    { name: 'vintage', label: 'Vintage', style: 'filter: sepia(0.5) contrast(1.2) brightness(1.1)' },
    { name: 'cool', label: 'Cool', style: 'filter: hue-rotate(180deg) saturate(1.2)' },
    { name: 'warm', label: 'Warm', style: 'filter: hue-rotate(25deg) saturate(1.1) brightness(1.05)' },
    { name: 'bw', label: 'B&W', style: 'filter: grayscale(1) contrast(1.1)' },
    { name: 'bright', label: 'Bright', style: 'filter: brightness(1.3) saturate(1.2)' },
    { name: 'dramatic', label: 'Dramatic', style: 'filter: contrast(1.5) saturate(0.8) brightness(0.9)' }
  ]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      processFile(imageFile)
    }
  }, [])

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPG, PNG, GIF, etc.)', 'error')
      return
    }

    // Validate file size (max 10MB for advanced features)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Error uploading image. Please try again.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log(' [Process] File loaded, length:', result?.length)
      setPreviewImage(result)
      setShowUploadModal(true)
      console.log(' [Process] Modal should now be visible')
      setSelectedFilter('none')
      setCropData({ x: 0, y: 0, width: 100, height: 100, zoom: 1 })
    }
    reader.onerror = (e) => {
      console.error(' [Process] File read error:', e)
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(' [File] File input changed')
    console.log('📁 [File] File input changed')
    const file = event.target.files?.[0]
    console.log('📁 [File] Selected file:', file?.name, file?.size, file?.type)
    if (file) {
      processFile(file)
    } else {
      console.log('❌ [File] No file selected')
    }
  }

  const applyFilter = (filterName: string) => {
    setSelectedFilter(filterName)
  }

  const handleCropChange = (property: string, value: number) => {
    setCropData(prev => ({ ...prev, [property]: value }))
  }

  const processImageWithEdits = async (): Promise<string> => {
    if (!previewImage) return previewImage || ''

    const canvas = canvasRef.current
    if (!canvas) return previewImage

    const ctx = canvas.getContext('2d')
    if (!ctx) return previewImage

    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        // Set canvas size for profile picture (400x400)
        canvas.width = 400
        canvas.height = 400

        // Apply crop and zoom
        const { x, y, width, height, zoom } = cropData
        const sourceX = (img.width * x) / 100
        const sourceY = (img.height * y) / 100
        const sourceWidth = (img.width * width) / 100
        const sourceHeight = (img.height * height) / 100

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Apply filter
        const filter = filters.find(f => f.name === selectedFilter)
        if (filter && filter.name !== 'none') {
          ctx.filter = filter.style.replace('filter: ', '')
        }

        // Draw cropped and zoomed image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        )

        // Convert to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = previewImage
    })
  }

  const simulateProgress = (stage: string, duration: number) => {
    return new Promise<void>((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5
        if (progress >= 100) {
          progress = 100
          setUploadProgress(100)
          clearInterval(interval)
          setTimeout(resolve, 200)
        } else {
          setUploadProgress(progress)
        }
      }, duration / 10)
    })
  }

  const handleUpload = async () => {
    console.log('🚀 [Upload] Button clicked, starting upload...')
    console.log('🖼️ [Upload] Preview image exists:', !!previewImage)
    
    if (!previewImage) {
      console.error('❌ [Upload] No preview image, aborting')
      return
    }

    console.log('✅ [Upload] Starting upload process')
    setIsUploading(true)
    setUploadStage('processing')
    setUploadProgress(0)
    
    try {
      // Stage 1: Processing image
      await simulateProgress('processing', 1000)
      const processedImage = await processImageWithEdits()
      
      // Stage 2: Preparing upload
      setUploadStage('uploading')
      setUploadProgress(0)
      await simulateProgress('uploading', 1500)
      
      // Convert data URL to blob
      const response = await fetch(processedImage)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append('profilePicture', blob, 'profile-picture.jpg')

      // Upload to API
      console.log('📤 [Upload] Sending to API...')
      const uploadResponse = await fetch('/api/student/profile-picture', {
        method: 'POST',
        body: formData
      })
      console.log('📥 [Upload] Response status:', uploadResponse.status)

      if (uploadResponse.ok) {
        const data = await uploadResponse.json()
        setUploadStage('success')
        setUploadProgress(100)
        
        // Show success animation
        setTimeout(() => {
          onImageUpdate(data.imageUrl)
          setShowUploadModal(false)
          setShowSuccessDialog(true)
          setPreviewImage(null)
          setEditMode(null)
          
          // Hide success dialog after 3 seconds
          setTimeout(() => {
            setShowSuccessDialog(false)
            setUploadStage('idle')
            setUploadProgress(0)
          }, 3000)
        }, 1000)
      } else {
        const errorData = await uploadResponse.json().catch(() => ({}))
        let errorMessage = 'Failed to upload profile picture. '
        
        if (uploadResponse.status === 401) {
          errorMessage += 'Please log in again and try.'
        } else if (uploadResponse.status === 400) {
          errorMessage += errorData.error || 'Invalid file format or size.'
        } else if (uploadResponse.status === 500) {
          errorMessage += 'Server error. Please contact support if this persists.'
        } else if (errorData.code === 'UPLOAD_FAILED') {
          errorMessage += 'Storage configuration issue. Please contact your administrator.'
        } else {
          errorMessage += 'Please try again or contact support.'
        }
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ [Upload] Error uploading profile picture:', error)
      console.error('❌ [Upload] Error details:', error.message)
      setUploadStage('error')
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Error uploading image. Please try again.'
      showToast(errorMessage, 'error')
      
      // Keep error state visible longer for user to read
      setTimeout(() => {
        setUploadStage('idle')
        setUploadProgress(0)
      }, 4000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setShowUploadModal(false)
    setPreviewImage(null)
    setEditMode(null)
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

        {/* Upload trigger button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 text-white rounded-xl p-4 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Change Profile Picture</div>
              <div className="text-sm opacity-90">Upload, crop & add filters</div>
            </div>
            <Sparkles className="w-5 h-5 opacity-70" />
          </div>
        </motion.button>
      </div>

      {/* Advanced Upload Modal */}
      <AnimatePresence>
        {showUploadModal && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden my-8 mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Profile Picture Studio</h3>
                      <p className="text-white/80 text-sm">Upload, edit and perfect your photo</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="text-white hover:bg-white/20 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col max-h-[calc(90vh-120px)]">
                <div className="flex-1 overflow-y-auto p-6 pb-2">
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative mb-6 border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                    isDragging 
                      ? 'border-purple-400 bg-purple-50 scale-105' 
                      : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="text-center">
                    <motion.div
                      animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: isDragging ? Infinity : 0, duration: 1 }}
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center"
                    >
                      <Upload className="w-8 h-8 text-white" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {isDragging ? 'Drop your image here!' : 'Drag & drop your image'}
                    </h4>
                    <p className="text-gray-600 mb-4">or click to browse files</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Photo
                    </Button>
                  </div>
                </div>

                {/* Image Preview and Editing */}
                {previewImage && (
                  <div className="space-y-6">
                    {/* Edit Tools */}
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant={editMode === 'crop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditMode(editMode === 'crop' ? null : 'crop')}
                        className="rounded-xl"
                      >
                        <Crop className="w-4 h-4 mr-2" />
                        Crop
                      </Button>
                      <Button
                        variant={editMode === 'filter' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditMode(editMode === 'filter' ? null : 'filter')}
                        className="rounded-xl"
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </div>

                    {/* Image Preview */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-purple-200 shadow-xl">
                          <NextImage
                            src={previewImage}
                            alt="Profile preview"
                            width={256}
                            height={256}
                            className="w-full h-full object-cover"
                            style={{
                              filter: filters.find(f => f.name === selectedFilter)?.style.replace('filter: ', '') || 'none',
                              transform: `scale(${cropData.zoom})`
                            }}
                          />
                        </div>
                        {editMode === 'crop' && (
                          <div className="absolute inset-0 border-2 border-dashed border-white rounded-2xl pointer-events-none" />
                        )}
                      </div>
                    </div>

                    {/* Crop Controls */}
                    {editMode === 'crop' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-2xl p-4 space-y-4"
                      >
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <Scissors className="w-4 h-4 mr-2" />
                          Crop & Zoom
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="0.1"
                              value={cropData.zoom}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCropChange('zoom', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="p-2">
                                <RotateCw className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="p-2">
                                <ZoomIn className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="p-2">
                                <ZoomOut className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Filter Selection */}
                    {editMode === 'filter' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-2xl p-4"
                      >
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <Palette className="w-4 h-4 mr-2" />
                          Choose Filter
                        </h4>
                        <div className="grid grid-cols-4 gap-3">
                          {filters.map((filter) => (
                            <motion.button
                              key={filter.name}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => applyFilter(filter.name)}
                              className={`relative p-2 rounded-xl border-2 transition-all ${
                                selectedFilter === filter.name
                                  ? 'border-purple-400 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden mx-auto mb-2">
                                <NextImage
                                  src={previewImage}
                                  alt={filter.label}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  style={{ filter: filter.style.replace('filter: ', '') }}
                                />
                              </div>
                              <div className="text-xs font-medium text-gray-700">{filter.label}</div>
                              {selectedFilter === filter.name && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <X className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-800 mb-1">Upload Failed</h4>
                            <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
                          </div>
                          <button
                            onClick={() => setErrorMessage(null)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6"
                      >
                        <div className="text-center mb-4">
                          <motion.div
                            animate={uploadStage === 'error' ? {} : { rotate: 360 }}
                            transition={{ duration: 2, repeat: uploadStage === 'error' ? 0 : Infinity, ease: "linear" }}
                            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                              uploadStage === 'error' 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`}
                          >
                            {uploadStage === 'processing' && <Scissors className="w-8 h-8 text-white" />}
                            {uploadStage === 'uploading' && <Upload className="w-8 h-8 text-white" />}
                            {uploadStage === 'success' && <Check className="w-8 h-8 text-white" />}
                            {uploadStage === 'error' && <X className="w-8 h-8 text-white" />}
                          </motion.div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {uploadStage === 'processing' && 'Processing your image...'}
                            {uploadStage === 'uploading' && 'Uploading to cloud...'}
                            {uploadStage === 'success' && 'Upload complete!'}
                            {uploadStage === 'error' && 'Upload failed'}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {uploadStage === 'processing' && 'Applying filters and optimizing quality'}
                            {uploadStage === 'uploading' && 'Securely saving your profile picture'}
                            {uploadStage === 'success' && 'Your new profile picture looks amazing!'}
                            {uploadStage === 'error' && 'Please check the error above and try again'}
                          </p>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>{Math.round(uploadProgress)}%</span>
                            <span>
                              {uploadStage === 'processing' && 'Step 1 of 2'}
                              {uploadStage === 'uploading' && 'Step 2 of 2'}
                              {uploadStage === 'success' && 'Complete!'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                </div>
                
                {/* Action Buttons - Always visible at bottom */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                  <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1 rounded-xl"
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('🖱️ [Button] Upload button clicked!')
                          console.log('🖱️ [Button] isUploading:', isUploading)
                          console.log('🖱️ [Button] uploadStage:', uploadStage)
                          console.log('🖱️ [Button] Button disabled?:', isUploading || uploadStage === 'success')
                          handleUpload()
                        }}
                        disabled={isUploading || uploadStage === 'success'}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl disabled:opacity-50"
                      >
                        {uploadStage === 'success' ? (
                          <div className="flex items-center space-x-2">
                            <Check className="w-4 h-4" />
                            <span>Uploaded!</span>
                          </div>
                        ) : isUploading ? (
                          <div className="flex items-center space-x-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>
                              {uploadStage === 'processing' && 'Processing...'}
                              {uploadStage === 'uploading' && 'Uploading...'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Save Picture</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* Success Dialog */}
      <AnimatePresence>
        {showSuccessDialog && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  Perfect! 🎉
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90"
                >
                  Your new profile picture has been uploaded successfully!
                </motion.p>
              </div>

              {/* Success Content */}
              <div className="p-6 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">Your profile looks amazing!</span>
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-800">Profile Updated</div>
                        <div className="text-sm text-gray-600">Ready to show off your new look!</div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center space-x-1"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7 + i * 0.1, type: "spring", stiffness: 200 }}
                        className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                      />
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  )
}
