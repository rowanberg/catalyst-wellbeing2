'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Palette, 
  ArrowLeft, 
  Plus, 
  Eye, 
  Share2, 
  Edit3,
  Trash2,
  Star,
  Calendar,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Loader2,
  AlertCircle,
  Upload
} from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  description: string
  type: 'image' | 'document' | 'video' | 'audio' | 'project'
  category: string
  subject: string
  dateCreated: string
  isPublic: boolean
  views: number
  likes: number
  tags: string[]
  thumbnail?: string
  fileSize?: string
}

export function DigitalPortfolio({ onBack }: { onBack: () => void }) {
  const { profile } = useAppSelector((state) => state.auth)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 'All', label: 'All Work', icon: '📚' },
    { id: 'Art', label: 'Art & Design', icon: '🎨' },
    { id: 'Writing', label: 'Writing', icon: '✍️' },
    { id: 'Science', label: 'Science', icon: '🔬' },
    { id: 'Math', label: 'Mathematics', icon: '📐' },
    { id: 'Projects', label: 'Projects', icon: '🚀' }
  ]

  // Optimized fetch function with proper error handling
  const fetchItems = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/digital-portfolio?userId=${profile.id}&schoolId=${profile.school_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load portfolio items')
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      setError(error instanceof Error ? error.message : 'Failed to load portfolio items')
      toast.error('Failed to load portfolio items')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.school_id])

  // Optimized upload function
  const handleUpload = useCallback(async (file: File, metadata: Partial<PortfolioItem>) => {
    if (!profile?.id) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify({
      ...metadata,
      userId: profile.id,
      schoolId: profile.school_id
    }))
    
    try {
      const response = await fetch('/api/digital-portfolio/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        toast.success('Item uploaded successfully!')
        fetchItems() // Refresh the list
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload item')
    }
  }, [profile?.id, profile?.school_id, fetchItems])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filteredItems = items.filter(item => 
    selectedCategory === 'All' || item.category === selectedCategory
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'project': return <Star className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Optimized Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl border border-pink-400/30">
                  <Palette className="h-6 w-6 text-pink-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Digital Portfolio</h1>
                  <p className="text-white/60 text-sm">Showcase your creative work</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Add Work
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleUpload(file, {
                      title: file.name,
                      description: '',
                      category: selectedCategory === 'All' ? 'Projects' : selectedCategory,
                      type: file.type.startsWith('image/') ? 'image' : 
                            file.type.startsWith('video/') ? 'video' :
                            file.type.startsWith('audio/') ? 'audio' : 'document'
                    })
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Optimized Category Filter */}
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Error loading portfolio</p>
                <p className="text-red-400/70 text-sm">{error}</p>
              </div>
              <Button
                onClick={fetchItems}
                variant="ghost"
                className="ml-auto text-red-300 hover:text-red-200"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="flex items-center space-x-3 text-white/60">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading your portfolio...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{item.thumbnail}</div>
                  <h3 className="text-white/90 font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-400/30 text-xs">
                      {getTypeIcon(item.type)}
                      <span className="ml-1">{item.type}</span>
                    </Badge>
                    <Badge className={`text-xs px-2 py-1 ${
                      item.isPublic ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                      'bg-gray-500/20 text-gray-300 border-gray-400/30'
                    }`}>
                      {item.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(item.dateCreated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{item.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>{item.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-red-500/20 rounded-full text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="h-8 w-8 text-white/40" />
              </div>
              <p className="text-white/80 text-lg font-medium mb-2">No work to display</p>
              <p className="text-white/60 text-sm mb-4">Start building your portfolio by adding your creative work</p>
              <Button
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-2 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Work
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
