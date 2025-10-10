'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Rocket, 
  ArrowLeft, 
  Plus, 
  Eye, 
  Heart, 
  MessageCircle,
  Share2,
  Star,
  Calendar,
  Users,
  Trophy,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  category: string
  subject: string
  author: {
    name: string
    avatar: string
    grade: string
  }
  collaborators?: {
    name: string
    avatar: string
  }[]
  dateCreated: string
  views: number
  likes: number
  comments: number
  isCollaborative: boolean
  status: 'draft' | 'published' | 'featured'
  tags: string[]
  thumbnail: string
  rating: number
}

export function ProjectShowcase({ onBack }: { onBack: () => void }) {
  const { profile } = useAppSelector((state) => state.auth)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [currentView, setCurrentView] = useState<'featured' | 'recent' | 'my-projects'>('featured')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 'All', label: 'All Projects', icon: '🚀' },
    { id: 'Science', label: 'Science', icon: '🔬' },
    { id: 'Technology', label: 'Technology', icon: '💻' },
    { id: 'Art', label: 'Art & Design', icon: '🎨' },
    { id: 'Literature', label: 'Literature', icon: '📚' },
    { id: 'Social', label: 'Social Studies', icon: '🌍' }
  ]

  // Optimized fetch function with real API integration
  const fetchProjects = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/project-showcase?view=${currentView}&category=${selectedCategory}&userId=${profile.id}&schoolId=${profile.school_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError(error instanceof Error ? error.message : 'Failed to load projects')
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.school_id, currentView, selectedCategory])

  // Optimized like function
  const likeProject = useCallback(async (projectId: string) => {
    if (!profile?.id) return
    
    try {
      const response = await fetch(`/api/project-showcase/${projectId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id,
          schoolId: profile.school_id
        }),
      })
      
      if (response.ok) {
        // Optimistically update the UI
        setProjects(prev => 
          prev.map(project => 
            project.id === projectId 
              ? { ...project, likes: project.likes + 1 }
              : project
          )
        )
        toast.success('Project liked!')
      } else {
        throw new Error('Failed to like project')
      }
    } catch (error) {
      console.error('Error liking project:', error)
      toast.error('Failed to like project')
    }
  }, [profile?.id, profile?.school_id])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const filteredProjects = projects.filter(project => 
    selectedCategory === 'All' || project.category === selectedCategory
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'featured': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'published': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
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
                <div className="p-3 bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-2xl border border-teal-400/30">
                  <Rocket className="h-6 w-6 text-teal-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Project Showcase</h1>
                  <p className="text-white/60 text-sm">Share creative projects</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white px-4 py-2 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Share Project
              </Button>
            </div>
          </motion.div>

          <div className="flex space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20">
            {[
              { id: 'featured', label: 'Featured', icon: Star },
              { id: 'recent', label: 'Recent', icon: Calendar },
              { id: 'my-projects', label: 'My Projects', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              )
            })}
          </div>

          {/* Optimized Category Filter */}
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
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
                <p className="text-red-300 font-medium">Error loading projects</p>
                <p className="text-red-400/70 text-sm">{error}</p>
              </div>
              <Button
                onClick={fetchProjects}
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
                <span>Loading projects...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all"
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-white/90 font-bold text-lg">{project.title}</h3>
                      {project.status === 'featured' && (
                        <Badge className={`text-xs px-2 py-1 ${getStatusColor(project.status)}`}>
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-xs mb-3">
                      {project.category}
                    </Badge>
                  </div>
                  <div className="text-6xl">{project.thumbnail}</div>
                </div>

                <p className="text-white/70 text-sm mb-4 line-clamp-2">{project.description}</p>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-r from-teal-400 to-green-400 text-white text-xs">
                        {project.author.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white/80 text-xs font-medium">{project.author.name}</p>
                      <p className="text-white/60 text-xs">{project.author.grade}</p>
                    </div>
                  </div>
                  
                  {project.collaborators && project.collaborators.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-white/60" />
                      <div className="flex -space-x-1">
                        {project.collaborators.slice(0, 3).map((collab, index) => (
                          <Avatar key={index} className="w-6 h-6 border-2 border-white/20">
                            <AvatarFallback className="bg-gradient-to-r from-teal-400 to-green-400 text-white text-xs">
                              {collab.avatar}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-white/60">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{project.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{project.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{project.comments}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{project.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => likeProject(project.id)}
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
