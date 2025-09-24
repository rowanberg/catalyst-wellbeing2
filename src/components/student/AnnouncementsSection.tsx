'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Megaphone, 
  Bell, 
  AlertTriangle, 
  Info, 
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  author_name: string
  target_audience: string
  created_at: string
  expires_at?: string
}

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/student/announcements')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch announcements')
        }
        
        setAnnouncements(data.announcements || [])
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'Failed to load announcements')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'high':
        return <Bell className="w-4 h-4 text-orange-600" />
      case 'medium':
        return <Info className="w-4 h-4 text-blue-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <span>School Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-red-600" />
            <span>School Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <span>School Announcements</span>
          </div>
          {announcements.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {announcements.length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-600">Check back later for updates from your school.</p>
          </div>
        ) : (
          announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getPriorityIcon(announcement.priority)}
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(announcement.created_at)}
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">
                {announcement.title}
              </h4>
              
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {announcement.content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <span>By {announcement.author_name}</span>
                </div>
                <button className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors">
                  <span>Read more</span>
                  <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
