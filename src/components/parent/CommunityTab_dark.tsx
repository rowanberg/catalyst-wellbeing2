'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import {
  Heart,
  ThumbsUp,
  Image as ImageIcon,
  Video,
  FileText,
  Pin,
  MessageCircle,
  Loader,
  Play,
  Download,
  Mic,
  ChevronDown
} from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'

interface Post {
  id: string
  content: string
  media: Array<{
    type: 'image' | 'video' | 'document' | 'voice'
    url: string
    thumbnail?: string
    name?: string
    duration?: string
  }>
  isPinned: boolean
  isWelcomePost?: boolean
  createdAt: string
  teacher: {
    id: string
    name: string
    avatar?: string
    className?: string
  }
  reactions: Record<string, number>
  totalReactions: number
}

interface CommunityTabProps {
  studentId: string
  parentId: string
}

// Curated 6 reaction emojis
const reactionEmojis = {
  like: { emoji: '👍', label: 'Like' },
  love: { emoji: '❤️', label: 'Love' },
  celebrate: { emoji: '🎉', label: 'Celebrate' },
  thanks: { emoji: '🙏', label: 'Thank You' },
  interesting: { emoji: '💡', label: 'Interesting' },
  happy: { emoji: '😊', label: 'Made my day' }
}

// Relative time helper
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Post Card Component
const PostCard = memo(({ 
  post, 
  onReact,
  userReaction 
}: { 
  post: Post
  onReact: (postId: string, reaction: string) => void
  userReaction?: string 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* Teacher Name Header */}
      <div className="px-4 lg:px-5 pt-4 pb-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{post.teacher.name}</h3>
      </div>

      {/* Media Grid */}
      <div className={`${
        post.media.length === 1 ? 'px-4 lg:px-5' :
        post.media.length === 2 ? 'grid grid-cols-2' :
        post.media.length === 3 ? 'grid grid-cols-2' :
        'grid grid-cols-2'
      }`}>
        {post.media.map((item, index) => (
          <div key={index} className={`relative bg-gray-100 dark:bg-gray-900 ${
            post.media.length === 1 ? 'aspect-[4/3] rounded-2xl overflow-hidden' :
            post.media.length === 3 && index === 0 ? 'row-span-2 aspect-square' :
            'aspect-square'
          }`}>
            {item.type === 'image' && (
              <img 
                src={item.url} 
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            
            {item.type === 'video' && (
              <div className="w-full h-full bg-black flex items-center justify-center relative">
                {item.thumbnail && (
                  <img src={item.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 w-14 h-14 rounded-full bg-white dark:bg-gray-200 flex items-center justify-center">
                  <Play className="h-6 w-6 text-gray-900 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 lg:px-5 py-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] mb-1">{post.content.split('\n')[0]}</h4>
        {post.content.split('\n').length > 1 && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{post.content.split('\n').slice(1).join(' ')}</p>
        )}
      </div>

      {/* Reactions Row */}
      <div className="px-4 lg:px-5 pb-4 flex items-center gap-2">
        {Object.entries(reactionEmojis).slice(0, 5).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onReact(post.id, key)}
            className={`flex items-center gap-1 ${
              userReaction === key ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            } transition-opacity`}
          >
            <span className="text-lg">{value.emoji}</span>
          </button>
        ))}
        {post.totalReactions > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium ml-1">{post.totalReactions}</span>
        )}
      </div>
    </div>
  )
})

PostCard.displayName = 'PostCard'

// Main Community Tab Component
export default function CommunityTab({ studentId, parentId }: CommunityTabProps) {
  const { isDarkMode } = useDarkMode()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [userReactions, setUserReactions] = useState<Record<string, string>>({})
  const [classFilter, setClassFilter] = useState('all')
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string, name: string}>>([])
  const [schoolInfo, setSchoolInfo] = useState<{id: string, name: string, logo_url: string | null} | null>(null)
  const [classesInfo, setClassesInfo] = useState<Array<{
    id: string
    name: string
    gradeLevel: string
    subject: string
    teacher: {
      id: string
      name: string
      avatar: string | null
    } | null
  }>>([])

  useEffect(() => {
    fetchPosts()
  }, [studentId, page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/v1/parents/community-feed?student_id=${studentId}&page=${page}`
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to fetch posts: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      if (page === 1) {
        if (result.data?.school) {
          setSchoolInfo(result.data.school)
        }
        if (result.data?.classes) {
          setClassesInfo(result.data.classes)
        }
      }
      
      if (page === 1) {
        setPosts(result.data.posts)
      } else {
        setPosts(prev => [...prev, ...result.data.posts])
      }
      
      setHasMore(page < result.data.pagination.totalPages)
      
      const classes = result.data.posts.reduce((acc: any[], post: Post) => {
        if (post.teacher.className && !acc.find(c => c.id === post.teacher.id)) {
          acc.push({ id: post.teacher.id, name: post.teacher.className })
        }
        return acc
      }, [])
      setAvailableClasses(classes)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (postId: string, reaction: string) => {
    try {
      const response = await fetch('/api/v1/parents/community-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, reaction, parentId })
      })

      if (response.ok) {
        setUserReactions(prev => ({ ...prev, [postId]: reaction }))
        
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const oldReaction = userReactions[postId]
            const newReactions = { ...post.reactions }
            
            if (oldReaction && oldReaction !== reaction) {
              newReactions[oldReaction] = Math.max(0, (newReactions[oldReaction] || 0) - 1)
            }
            
            newReactions[reaction] = (newReactions[reaction] || 0) + 1
            
            return {
              ...post,
              reactions: newReactions,
              totalReactions: Object.values(newReactions).reduce((a, b) => a + b, 0)
            }
          }
          return post
        }))
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const filteredPosts = classFilter === 'all' 
    ? posts 
    : posts.filter(post => post.teacher.id === classFilter)

  // Loading skeleton
  if (loading && page === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-0">
        <div className="bg-blue-600 dark:bg-blue-700 rounded-t-3xl px-5 py-4 h-20 animate-pulse" />
        <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-b-3xl">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* Header - Desktop optimized */}
      <div className="bg-[#3B5998] dark:bg-blue-900 rounded-t-3xl px-5 lg:px-6 py-4 lg:py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg lg:text-xl">Class Community</h1>
            <p className="text-white/80 text-xs lg:text-sm mt-0.5">
              {classesInfo.length === 1 
                ? classesInfo[0].name 
                : `Mrs. Sharma's 5th Grade`}
            </p>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Teachers Horizontal Scroll */}
      {classesInfo.length > 0 && (
        <div className="bg-white dark:bg-gray-800 px-4 lg:px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {classesInfo.map((classInfo) => (
              classInfo.teacher && (
                <button 
                  key={classInfo.teacher.id}
                  className="flex-shrink-0 flex flex-col items-center gap-1 group"
                >
                  {classInfo.teacher.avatar ? (
                    <img
                      src={classInfo.teacher.avatar}
                      alt={classInfo.teacher.name}
                      className="w-16 h-16 rounded-full object-cover border-[3px] border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-[3px] border-gray-200 dark:border-gray-600">
                      <span className="text-base font-bold text-white">
                        {classInfo.teacher.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[64px] truncate">
                    {classInfo.teacher.name.split(' ')[1] || classInfo.teacher.name.split(' ')[0]}
                  </span>
                </button>
              )
            ))}
            <button className="flex-shrink-0 flex flex-col items-center gap-1 group">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border-[3px] border-gray-200 dark:border-gray-600">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Posts Feed - Desktop optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-b-3xl overflow-hidden shadow-sm dark:shadow-xl">
        {filteredPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onReact={handleReaction}
            userReaction={userReactions[post.id]}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center py-6">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
          >
            Load More Posts
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div className="text-center py-6">
          <Loader className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
        </div>
      )}

      {filteredPosts.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-b-3xl">
          <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No posts to show</p>
        </div>
      )}
    </div>
  )
}
