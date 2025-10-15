'use client'

import { useState, useRef } from 'react'
import { X, Image, Video, Mic, FileText, Upload, Loader, Check } from 'lucide-react'

interface CreatePostComposerProps {
  onClose: () => void
  teacherId: string
}

interface Attachment {
  id: string
  type: 'photo' | 'video' | 'voice' | 'document'
  file?: File
  url?: string
  name?: string
  recording?: boolean
  duration?: number
}

export default function CreatePostComposer({ onClose, teacherId }: CreatePostComposerProps) {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock classes - replace with actual data fetch
  const availableClasses = [
    { id: '1', name: 'Mrs. Smith\'s English - Grade 9' },
    { id: '2', name: 'Mrs. Smith\'s Literature - Grade 10' },
    { id: '3', name: 'Mr. Davis\'s Algebra - Grade 8' }
  ]

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map(file => ({
      id: Math.random().toString(),
      type: 'photo' as const,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map(file => ({
      id: Math.random().toString(),
      type: 'video' as const,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map(file => ({
      id: Math.random().toString(),
      type: 'document' as const,
      file,
      name: file.name
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' })
        
        setAttachments(prev => [...prev, {
          id: Math.random().toString(),
          type: 'voice',
          file,
          url: audioUrl,
          duration: recordingTime
        }])
        
        setRecordingTime(0)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      alert('Please add some content or attachments')
      return
    }

    if (selectedClasses.length === 0) {
      alert('Please select at least one class')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('teacherId', teacherId)
      formData.append('classes', JSON.stringify(selectedClasses))

      attachments.forEach((att, index) => {
        if (att.file) {
          formData.append(`attachment_${index}`, att.file)
          formData.append(`attachment_${index}_type`, att.type)
        }
      })

      const response = await fetch('/api/teacher/create-post', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        onClose()
      } else {
        throw new Error('Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Classes <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {availableClasses.map(cls => (
                <label
                  key={cls.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedClasses.includes(cls.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => handleClassToggle(cls.id)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{cls.name}</span>
                  {selectedClasses.includes(cls.id) && (
                    <Check className="h-4 w-4 text-blue-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Message
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update with your class..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-2">
              {content.length} characters
            </p>
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Attachments ({attachments.length})
              </label>
              <div className="grid grid-cols-2 gap-3">
                {attachments.map(att => (
                  <div key={att.id} className="relative group">
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {att.type === 'photo' && att.url && (
                        <img src={att.url} alt="" className="w-full h-32 object-cover rounded" />
                      )}
                      {att.type === 'video' && (
                        <div className="flex items-center gap-2">
                          <Video className="h-8 w-8 text-blue-600" />
                          <span className="text-sm text-gray-700 truncate">{att.name}</span>
                        </div>
                      )}
                      {att.type === 'voice' && (
                        <div className="flex items-center gap-2">
                          <Mic className="h-8 w-8 text-blue-600" />
                          <span className="text-sm text-gray-700">{formatTime(att.duration || 0)}</span>
                        </div>
                      )}
                      {att.type === 'document' && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <span className="text-sm text-gray-700 truncate">{att.name}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {/* Attachment Bar */}
          <div className="flex items-center gap-2 mb-4">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              multiple
              onChange={handleDocumentUpload}
              className="hidden"
            />

            <button
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Photo</span>
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </button>

            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isRecording
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {isRecording ? formatTime(recordingTime) : 'Voice'}
              </span>
            </button>

            <button
              onClick={() => documentInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Document</span>
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
