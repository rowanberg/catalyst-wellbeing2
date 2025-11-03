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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      fetchClasses()
    }
  }, [user])

  useEffect(() => {
    if (selectedClass) {
      // Reset pagination when class changes
      setPage(1)
      setHasMore(true)
      setPosts([])
      fetchPosts(selectedClass.id, 1, true)
    }
  }, [selectedClass])

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !selectedClass || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(selectedClass.id, nextPage, false)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerTarget.current)

    return () => observer.disconnect()
  }, [observerTarget.current, hasMore, loadingMore, page, selectedClass])

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

  const fetchPosts = async (classId: string, pageNum: number = 1, reset: boolean = false) => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    // Prevent duplicate requests
    if (loadingMore && !reset) return

    try {
      if (reset) {
        setPostsLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      
      // Initial load: 5 posts (< 7), subsequent loads: 10 posts
      const limit = reset ? 5 : 10
      const offset = reset ? 0 : (pageNum === 2 ? 5 : 5 + (pageNum - 2) * 10)
      
      const response = await fetch(
        `/api/teacher/community/posts?class_id=${classId}&teacher_id=${user.id}&limit=${limit}&offset=${offset}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load posts')
      }
      
      const data = await response.json()
      const newPosts = data.posts || []
      
      if (reset) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      
      // Check if there are more posts
      setHasMore(newPosts.length === limit)
      
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load posts. Please try again.')
      if (reset) {
        setPosts([])
      }
    } finally {
      setPostsLoading(false)
      setLoadingMore(false)
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

  // Simplified Feed View
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Simplified Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedClass.class_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedClass.total_students} students • {selectedClass.subject}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Create Post Button - Fixed at bottom */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowNewPost(true)}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        {/* Simplified Post Modal */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
              onClick={() => {
                if (!creating) {
                  setShowNewPost(false)
                  setSelectedImage(null)
                  setImageFile(null)
                  setNewPostContent('')
                  setError(null)
                }
              }}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Share with Class
                  </h3>
                  <button
                    onClick={() => {
                      if (!creating) {
                        setShowNewPost(false)
                        setSelectedImage(null)
                        setImageFile(null)
                        setNewPostContent('')
                        setError(null)
                      }
                    }}
                    disabled={creating}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Photo Upload - Primary Action */}
                  {!selectedImage && !uploadingImage && (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Add a Photo
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tap to choose from your device
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={uploadingImage || creating}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Uploading State */}
                  {uploadingImage && (
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Preparing your photo...</p>
                    </div>
                  )}

                  {/* Image Preview */}
                  {selectedImage && (
                    <div className="relative">
                      <Image
                        src={selectedImage}
                        alt="Preview"
                        width={600}
                        height={400}
                        className="w-full h-auto max-h-80 object-cover rounded-2xl"
                      />
                      <button
                        onClick={removeImage}
                        disabled={creating}
                        className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Caption */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add a caption (optional)
                    </label>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's happening in class today?"
                      rows={3}
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || creating || uploadingImage}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <span>Share with Students</span>
                    )}
                  </button>
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
                  {/* Post Image - Full Width */}
                  {post.image_url && (
                    <div className="bg-gray-100 dark:bg-gray-900">
                      <Image
                        src={post.image_url}
                        alt="Post"
                        width={800}
                        height={600}
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: '500px' }}
                      />
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {post.teacher_name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {post.teacher_name}
                          </p>
                          {post.is_pinned && (
                            <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center space-x-1">
                              <Pin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Pinned</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {post.content && (
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    )}
                    
                    {/* Simplified Like Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-full transition-all ${
                          post.has_reacted
                            ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.has_reacted ? 'fill-current' : ''}`} />
                        <span className="font-semibold">{post.reactions_count} {post.reactions_count === 1 ? 'like' : 'likes'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {posts.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No Posts Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Share your first classroom moment with students!
                  </p>
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Share a Photo
                  </button>
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {posts.length > 0 && hasMore && (
                <div ref={observerTarget} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading more posts...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of Posts Message */}
              {posts.length > 0 && !hasMore && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You've reached the end
                  </p>
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
