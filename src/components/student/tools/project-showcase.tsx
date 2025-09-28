'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Zap,
  Settings
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
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [currentView, setCurrentView] = useState<'featured' | 'recent' | 'my-projects'>('featured')

  const categories = [
    { id: 'All', label: 'All Projects' },
    { id: 'Science', label: 'Science' },
    { id: 'Technology', label: 'Technology' },
    { id: 'Art', label: 'Art & Design' },
    { id: 'Literature', label: 'Literature' },
    { id: 'Social', label: 'Social Studies' }
  ]

  useEffect(() => {
    setProjects([
      {
        id: '1',
        title: 'Solar System Explorer',
        description: 'Interactive 3D model of our solar system with detailed planet information and orbital mechanics.',
        category: 'Science',
        subject: 'Astronomy',
        author: {
          name: 'Emma Chen',
          avatar: 'EC',
          grade: 'Grade 10'
        },
        collaborators: [
          { name: 'Alex Kim', avatar: 'AK' },
          { name: 'Sarah Johnson', avatar: 'SJ' }
        ],
        dateCreated: '2025-09-15',
        views: 234,
        likes: 45,
        comments: 12,
        isCollaborative: true,
        status: 'featured',
        tags: ['astronomy', '3d-modeling', 'interactive', 'planets'],
        thumbnail: '🌌',
        rating: 4.8
      },
      {
        id: '2',
        title: 'Climate Change Awareness App',
        description: 'Mobile app prototype designed to educate users about climate change impacts and solutions.',
        category: 'Technology',
        subject: 'Environmental Science',
        author: {
          name: 'Marcus Rodriguez',
          avatar: 'MR',
          grade: 'Grade 11'
        },
        dateCreated: '2025-09-10',
        views: 189,
        likes: 38,
        comments: 8,
        isCollaborative: false,
        status: 'published',
        tags: ['app-design', 'climate-change', 'education', 'prototype'],
        thumbnail: '🌍',
        rating: 4.6
      },
      {
        id: '3',
        title: 'Digital Art Gallery',
        description: 'Curated collection of student artwork with interactive viewing experience.',
        category: 'Art',
        subject: 'Visual Arts',
        author: {
          name: 'Luna Park',
          avatar: 'LP',
          grade: 'Grade 9'
        },
        dateCreated: '2025-09-20',
        views: 156,
        likes: 52,
        comments: 15,
        isCollaborative: false,
        status: 'published',
        tags: ['digital-art', 'gallery', 'curation', 'visual-design'],
        thumbnail: '🎨',
        rating: 4.9
      }
    ])
  }, [])

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

  const likeProject = (projectId: string) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, likes: project.likes + 1 }
          : project
      )
    )
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

          <div className="flex space-x-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>

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
