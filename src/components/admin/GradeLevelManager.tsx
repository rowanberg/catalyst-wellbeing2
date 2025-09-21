'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Plus, Trash2, GraduationCap, BookOpen } from 'lucide-react'

interface GradeLevel {
  id: string
  grade_level: string
  grade_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface GradeLevelManagerProps {
  schoolId?: string
}

export function GradeLevelManager({ schoolId }: GradeLevelManagerProps) {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newGrade, setNewGrade] = useState({
    grade_level: '',
    grade_name: ''
  })
  const { addToast } = useToast()

  useEffect(() => {
    if (schoolId) {
      fetchGradeLevels()
    }
  }, [schoolId])

  const fetchGradeLevels = async () => {
    if (!schoolId) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/grade-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch grade levels')
      }

      const data = await response.json()
      setGradeLevels(data.gradeLevels || [])
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Load Grade Levels',
        description: 'Could not fetch grade levels from the server'
      })
    } finally {
      setLoading(false)
    }
  }

  const createGradeLevel = async () => {
    if (!schoolId || !newGrade.grade_level || !newGrade.grade_name) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/grade-levels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId,
          gradeLevel: newGrade
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create grade level')
      }

      const data = await response.json()
      setGradeLevels(prev => [...prev, data.gradeLevel])
      setNewGrade({
        grade_level: '',
        grade_name: ''
      })

      addToast({
        type: 'success',
        title: 'Grade Level Created',
        description: 'New grade level has been added successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Grade Level',
        description: 'Could not create the grade level'
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteGradeLevel = async (gradeId: string) => {
    if (!schoolId) return

    try {
      const response = await fetch('/api/admin/grade-levels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId,
          gradeId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete grade level')
      }

      setGradeLevels(prev => prev.filter(g => g.id !== gradeId))

      addToast({
        type: 'success',
        title: 'Grade Level Deleted',
        description: 'Grade level has been removed successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Delete Grade Level',
        description: 'Could not delete the grade level'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading grade levels...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Grade Level */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <Plus className="h-5 w-5 mr-2" />
            Create New Grade Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="grade-level">Grade Level *</Label>
              <Input
                id="grade-level"
                value={newGrade.grade_level}
                onChange={(e) => setNewGrade(prev => ({ ...prev, grade_level: e.target.value }))}
                placeholder="e.g., 1, 2, 3, K"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="grade-name">Grade Name *</Label>
              <Input
                id="grade-name"
                value={newGrade.grade_name}
                onChange={(e) => setNewGrade(prev => ({ ...prev, grade_name: e.target.value }))}
                placeholder="e.g., First Grade, Kindergarten"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={createGradeLevel} 
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Grade Level'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Grade Levels */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Grade Levels ({gradeLevels.length})</h3>
        {gradeLevels.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No grade levels created yet</p>
              <p className="text-gray-500 text-sm">Create your first grade level above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gradeLevels.map((grade) => (
              <Card key={grade.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <CardTitle className="text-base">{grade.grade_name}</CardTitle>
                        <p className="text-sm text-gray-600">Grade {grade.grade_level}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGradeLevel(grade.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>Status: {grade.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
