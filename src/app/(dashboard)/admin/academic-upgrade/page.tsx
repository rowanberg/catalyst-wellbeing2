'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
  GraduationCap,
  ArrowRight,
  Search,
  Edit2,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Grid3x3,
  X
} from 'lucide-react'

interface ClassInfo {
  id: string
  name: string
  grade: number
  section: string
  studentCount: number
  currentYear: string
  teacherId?: string
  teacherName?: string
}

interface PromotionMapping {
  id?: string
  fromClassId: string
  fromClassName: string
  fromGrade: number
  fromSection: string
  toClassId: string | null
  toClassName: string | null
  toGrade: number | null
  toSection: string | null
  isLocked: boolean
  studentCount: number
}

const AcademicUpgradePage = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [promotionMappings, setPromotionMappings] = useState<PromotionMapping[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [editingMapping, setEditingMapping] = useState<string | null>(null)
  const { addToast } = useToast()

  // Fetch classes and existing promotion mappings
  useEffect(() => {
    fetchClassesAndMappings()
  }, [])

  const fetchClassesAndMappings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/academic-upgrade/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        
        // Initialize promotion mappings
        const mappings = data.classes.map((cls: ClassInfo) => ({
          fromClassId: cls.id,
          fromClassName: cls.name,
          fromGrade: cls.grade,
          fromSection: cls.section,
          toClassId: null,
          toClassName: null,
          toGrade: cls.grade < 12 ? cls.grade + 1 : null,
          toSection: cls.section,
          isLocked: false,
          studentCount: cls.studentCount
        }))
        
        // Load saved mappings if exist
        const savedResponse = await fetch('/api/admin/academic-upgrade/mappings')
        if (savedResponse.ok) {
          const savedData = await savedResponse.json()
          if (savedData.mappings && savedData.mappings.length > 0) {
            // Merge saved mappings with current classes
            const mergedMappings = mappings.map((mapping: PromotionMapping) => {
              const saved = savedData.mappings.find((s: any) => s.fromClassId === mapping.fromClassId)
              return saved ? { ...mapping, ...saved } : mapping
            })
            setPromotionMappings(mergedMappings)
          } else {
            setPromotionMappings(mappings)
          }
        } else {
          setPromotionMappings(mappings)
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      addToast({
        type: 'error',
        title: 'Failed to load classes',
        description: 'Please try again later'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get available classes for next grade
  const getAvailableNextClasses = (currentGrade: number) => {
    const nextGrade = currentGrade < 12 ? currentGrade + 1 : null
    if (!nextGrade) return []
    return classes.filter(cls => cls.grade === nextGrade)
  }

  // Check for grade mismatch warnings
  const getGradeMismatchWarning = (grade: number) => {
    const currentGradeClasses = classes.filter(c => c.grade === grade)
    const nextGradeClasses = getAvailableNextClasses(grade)
    
    if (grade >= 12) return null
    if (nextGradeClasses.length === 0) {
      return `No classes available for Grade ${grade + 1}`
    }
    if (currentGradeClasses.length > nextGradeClasses.length) {
      return `Grade ${grade} has ${currentGradeClasses.length} sections but Grade ${grade + 1} only has ${nextGradeClasses.length}`
    }
    return null
  }

  // Auto-assign all promotions
  const handleAutoAssign = () => {
    // Track assignments to avoid duplicates
    const assignedClassIds = new Set<string>()
    
    const updatedMappings = promotionMappings.map(mapping => {
      if (!mapping.isLocked) {
        const nextGrade = mapping.fromGrade < 12 ? mapping.fromGrade + 1 : null
        if (nextGrade) {
          const availableClasses = getAvailableNextClasses(mapping.fromGrade)
          // Try to find a class with matching section
          let nextClass = availableClasses.find(cls => 
            cls.section === mapping.fromSection && !assignedClassIds.has(cls.id)
          )
          // If no match, try to find any available class that's not already assigned
          if (!nextClass) {
            nextClass = availableClasses.find(cls => !assignedClassIds.has(cls.id))
          }
          
          if (nextClass) {
            assignedClassIds.add(nextClass.id)
            return {
              ...mapping,
              toClassId: nextClass.id,
              toClassName: nextClass.name,
              toGrade: nextGrade,
              toSection: nextClass.section
            }
          }
        }
      }
      return mapping
    })
    
    setPromotionMappings(updatedMappings)
    addToast({
      type: 'success',
      title: 'Auto-assignment complete',
      description: 'All unlocked classes have been mapped to available next grade classes'
    })
  }

  // Save promotion mappings
  const handleSave = async () => {
    // Validate all classes have mappings
    const unmappedClasses = promotionMappings.filter(m => 
      m.toGrade && !m.toClassId && !m.toClassName
    )
    
    if (unmappedClasses.length > 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: `${unmappedClasses.length} classes have no promotion target`
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/academic-upgrade/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: promotionMappings })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Mappings saved',
          description: 'Promotion configuration has been saved successfully'
        })
      } else {
        throw new Error('Failed to save mappings')
      }
    } catch (error) {
      console.error('Save error:', error)
      addToast({
        type: 'error',
        title: 'Save failed',
        description: 'Could not save promotion mappings'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle lock on mapping
  const toggleLock = (mappingId: string) => {
    setPromotionMappings(prev => prev.map(m => 
      m.fromClassId === mappingId ? { ...m, isLocked: !m.isLocked } : m
    ))
  }

  // Update promotion target by class ID
  const updatePromotionTarget = (fromClassId: string, toClassId: string) => {
    const selectedClass = classes.find(c => c.id === toClassId)
    setPromotionMappings(prev => prev.map(m => {
      if (m.fromClassId === fromClassId) {
        return {
          ...m,
          toClassId: selectedClass?.id || null,
          toClassName: selectedClass?.name || null,
          toGrade: selectedClass?.grade || null,
          toSection: selectedClass?.section || null
        }
      }
      return m
    }))
    setEditingMapping(null)
  }

  // Filter mappings based on search and selected grade
  const filteredMappings = useMemo(() => {
    let filtered = promotionMappings

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.fromClassName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.toClassName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedGrade !== null) {
      filtered = filtered.filter(m => m.fromGrade === selectedGrade)
    }

    return filtered.sort((a, b) => {
      if (a.fromGrade !== b.fromGrade) return a.fromGrade - b.fromGrade
      return a.fromSection.localeCompare(b.fromSection)
    })
  }, [promotionMappings, searchTerm, selectedGrade])

  // Get unique grades
  const uniqueGrades = useMemo(() => {
    const gradesSet = new Set(promotionMappings.map(m => m.fromGrade))
    const grades = Array.from(gradesSet)
    return grades.sort((a, b) => a - b)
  }, [promotionMappings])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Academic Upgrade Configuration
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Configure class promotions for the next academic year
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search classes..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Grade Filter */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedGrade === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGrade(null)}
                  >
                    All Grades
                  </Button>
                  {uniqueGrades.map(grade => (
                    <Button
                      key={grade}
                      variant={selectedGrade === grade ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedGrade(grade)}
                    >
                      Grade {grade}
                    </Button>
                  ))}
                </div>

                {/* Bulk Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleAutoAssign}
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto Assign
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={isLoading}
                  >
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || isSaving}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grade Mismatch Warnings */}
        {uniqueGrades.some(grade => getGradeMismatchWarning(grade)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 mb-2">Class Count Mismatch Detected</h3>
                    <div className="space-y-1 text-sm text-orange-800">
                      {uniqueGrades.map(grade => {
                        const warning = getGradeMismatchWarning(grade)
                        if (!warning) return null
                        return (
                          <div key={grade} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-400 rounded-full" />
                            <span>{warning}</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-orange-700 mt-2">
                      ⚠️ Some students may need to be redistributed across available classes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Promotion Mappings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Class Promotion Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-semibold text-sm text-gray-700">
                  <div className="col-span-3">Current Class</div>
                  <div className="col-span-1">Grade</div>
                  <div className="col-span-1">Students</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Promotion To</div>
                  <div className="col-span-1">Grade</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Body */}
                <AnimatePresence>
                  {filteredMappings.map((mapping, index) => (
                    <motion.div
                      key={mapping.fromClassId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="grid grid-cols-12 gap-4 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="col-span-3 flex items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium">{mapping.fromClassName}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <Badge variant="outline">{mapping.fromGrade}</Badge>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{mapping.studentCount}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="col-span-3 flex items-center">
                        {editingMapping === mapping.fromClassId ? (
                          <select
                            value={mapping.toClassId || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                updatePromotionTarget(mapping.fromClassId, e.target.value)
                              }
                            }}
                            className="h-8 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          >
                            <option value="">Select next grade class...</option>
                            {getAvailableNextClasses(mapping.fromGrade).map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.studentCount} students)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {mapping.toClassName ? (
                              <>
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="font-medium">{mapping.toClassName}</span>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 italic">Not assigned</span>
                                {getAvailableNextClasses(mapping.fromGrade).length === 0 && (
                                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    No next grade
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-1 flex items-center">
                        {mapping.toGrade && (
                          <Badge variant="outline" className="bg-green-50">
                            {mapping.toGrade}
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMapping(
                            editingMapping === mapping.fromClassId ? null : mapping.fromClassId
                          )}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleLock(mapping.fromClassId)}
                        >
                          {mapping.isLocked ? (
                            <Lock className="w-3 h-3 text-orange-500" />
                          ) : (
                            <Unlock className="w-3 h-3 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Promotion Preview</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPreview(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {uniqueGrades.map(grade => {
                      const gradeMappings = promotionMappings.filter(m => m.fromGrade === grade)
                      const totalStudents = gradeMappings.reduce((sum, m) => sum + m.studentCount, 0)
                      
                      return (
                        <div key={grade} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Grade {grade}</h3>
                            <Badge>{totalStudents} students</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {gradeMappings.map(m => (
                              <div key={m.fromClassId} className="flex items-center gap-2 text-sm">
                                <span>{m.fromClassName}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span className="font-medium text-green-600">
                                  {m.toClassName || 'Not assigned'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                      Close
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Confirm & Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AcademicUpgradePage
