'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import { 
  ArrowLeft, Users, BookOpen, Image as ImageIcon, 
  Heart, MessageCircle, Send, MoreVertical, Pin,
  Plus, Search, Filter, Sparkles, TrendingUp, X, AlertCircle
} from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'

interface ClassData {
  id: string
  class_name: string
  class_code: string
  subject: string
  grade_level: string
  total_students: number
  room_number: string
}

interface Post {
  id: string
  content: string
  image_url?: string
  created_at: string
  teacher_name: string
  teacher_avatar?: string
  reactions_count: number
  has_reacted: boolean
  is_pinned: boolean
}

function TeacherCommunityContent() {
  const { user, profile } = useAppSelector((state) => state.auth)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchClasses()
    }
  }, [user])

  useEffect(() => {
    if (selectedClass) {
      fetchPosts(selectedClass.id)
    }
  }, [selectedClass])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/assigned-classes?teacher_id=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async (classId: string) => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setPostsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/teacher/community/posts?class_id=${classId}&teacher_id=${user.id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load posts')
      }
      
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load posts. Please try again.')
      setPosts([])
    } finally {
      setPostsLoading(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB')
      return
    }

    try {
      setUploadingImage(true)
      setError(null)

      // Compress image for quality and performance
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: false, // Avoid CSP issues
        quality: 0.85
      }

      const compressedFile = await imageCompression(file, options)
      setImageFile(compressedFile)

      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        setUploadingImage(false)
      }
      reader.onerror = () => {
        setError('Failed to read image file')
        setUploadingImage(false)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Image compression error:', error)
      setError('Failed to process image. Please try another file.')
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImageFile(null)
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedClass || !user?.id) return
    
    try {
      setCreating(true)
      setError(null)

      const response = await fetch('/api/teacher/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass.id,
          content: newPostContent,
          imageData: selectedImage,
          teacherId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const data = await response.json()
      
      // Refresh posts to show the new one
      await fetchPosts(selectedClass.id)
      
      // Reset form
      setNewPostContent('')
      setSelectedImage(null)
      setImageFile(null)
      setShowNewPost(false)
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create post. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading classes...</p>
        </div>
      </div>
    )
  }

  // Class Selection View
  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Community
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Select a class to view and share updates with students
            </p>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {classes.map((classItem) => (
              <motion.div
                key={classItem.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedClass(classItem)}
                className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-semibold">{classItem.total_students}</span>
                  </div>
                </div>
                
                <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {classItem.class_name}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                  {classItem.subject} • {classItem.grade_level}
                </p>
                
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Room {classItem.room_number}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    View Feed →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No classes assigned yet</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Instagram-like Feed View
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
          <div className="p-3 lg:p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
              <button
                onClick={() => setSelectedClass(null)}
                className="p-1.5 lg:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="min-w-0">
                <h2 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedClass.class_name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedClass.total_students} students
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowNewPost(true)}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs lg:text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-1.5 lg:space-x-2 shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>

        {/* New Post Modal */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:p-4"
              onClick={() => {
                setShowNewPost(false)
                setSelectedImage(null)
                setImageFile(null)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl p-4 lg:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Create Post
                </h3>
                
                {/* Error Display */}
                {error && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}
                
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share an update with your class..."
                  className="w-full h-28 lg:h-32 p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm lg:text-base"
                />
                
                {/* Image Preview */}
                {selectedImage && (
                  <div className="mt-3 relative">
                    <div className="relative w-full" style={{ maxHeight: '20rem' }}>
                      <Image
                        src={selectedImage}
                        alt="Preview"
                        width={800}
                        height={400}
                        className="w-full h-auto max-h-80 object-cover rounded-lg"
                        style={{ width: '100%', height: 'auto', maxHeight: '20rem', objectFit: 'cover' }}
                      />
                    </div>
                    <button
                      onClick={removeImage}
                      disabled={creating}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Uploading Indicator */}
                {uploadingImage && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-blue-800 dark:text-blue-300">Compressing image...</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  {/* Image Upload Button */}
                  <label className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage || creating}
                      className="hidden"
                    />
                  </label>
                  
                  <div className="flex space-x-2 lg:space-x-3">
                    <button
                      onClick={() => {
                        setShowNewPost(false)
                        setSelectedImage(null)
                        setImageFile(null)
                        setNewPostContent('')
                      }}
                      className="px-3 lg:px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || creating || uploadingImage}
                      className="px-4 lg:px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center space-x-2"
                    >
                      {creating && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>{creating ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Feed */}
        <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
          {/* Error Display for Feed */}
          {error && !showNewPost && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Error Loading Posts</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  <button
                    onClick={() => selectedClass && fetchPosts(selectedClass.id)}
                    className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {postsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                >
                  {/* Post Header */}
                  <div className="p-3 lg:p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 lg:space-x-3 min-w-0">
                      <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {post.teacher_name[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base truncate">
                          {post.teacher_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
                      {post.is_pinned && (
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Pin className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <button className="p-1.5 lg:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-3 lg:px-4 pb-3">
                    <p className="text-sm lg:text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Image */}
                  {post.image_url && (
                    <div className="bg-gray-100 dark:bg-gray-900">
                      <div className="relative w-full" style={{ maxHeight: '24rem' }}>
                        <Image
                          src={post.image_url}
                          alt="Post"
                          width={800}
                          height={600}
                          className="w-full h-auto max-h-96 object-contain"
                          style={{ width: '100%', height: 'auto', maxHeight: '24rem', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="px-3 lg:px-4 py-2.5 lg:py-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <button
                        className={`flex items-center space-x-1.5 lg:space-x-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-all ${
                          post.has_reacted
                            ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${post.has_reacted ? 'fill-current' : ''}`} />
                        <span className="text-xs lg:text-sm font-semibold">{post.reactions_count}</span>
                      </button>
                      
                      <div className="flex items-center space-x-0.5 lg:space-x-1">
                        <button className="p-1.5 lg:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                        <button className="p-1.5 lg:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {posts.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No posts yet for this class
                  </p>
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Create First Post
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeacherCommunity() {
  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <TeacherCommunityContent />
    </UnifiedAuthGuard>
  )
}
