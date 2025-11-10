'use client'

export const dynamic = 'force-dynamic'

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
  X,
  Filter,
  Zap,
  TrendingUp,
  ArrowDown,
  ChevronRight,
  Check
} from 'lucide-react'

// Custom hook for mobile detection
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])
  
  return matches
}

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
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [selectedMappingForEdit, setSelectedMappingForEdit] = useState<PromotionMapping | null>(null)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const { addToast } = useToast()
  
  // Mobile detection
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Optimized Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            ${isMobile 
              ? 'bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-100 shadow-sm' 
              : 'relative mb-6'
            }
          `}
        >
          <div className={`
            flex items-center gap-3
            ${isMobile 
              ? 'px-4 py-2.5 safe-area-top' 
              : 'lg:gap-4'
            }
          `}>
            {/* Icon */}
            <motion.div
              whileTap={isMobile ? { scale: 0.95 } : {}}
              className="p-2.5 lg:p-3 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl shadow-lg shrink-0"
            >
              <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </motion.div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <h1 className={`
                font-bold text-gray-900 truncate
                ${isMobile 
                  ? 'text-[15px] leading-tight' 
                  : 'text-2xl xl:text-3xl'
                }
              `}>
                {isMobile ? 'Academic Upgrade' : 'Academic Upgrade Configuration'}
              </h1>
              <p className={`
                text-gray-500 truncate mt-0.5
                ${isMobile 
                  ? 'text-[11px] leading-tight' 
                  : 'text-sm lg:mt-1'
                }
              `}>
                {isMobile ? `${filteredMappings.length} classes` : 'Configure class promotions for the next academic year'}
              </p>
            </div>

            {/* Mobile Filter Button */}
            {isMobile && (
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 shrink-0 touch-manipulation rounded-lg active:bg-gray-100"
                  onClick={() => setShowFilterSheet(true)}
                >
                  <Filter className="w-4.5 h-4.5" />
                  {selectedGrade !== null && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-white"></span>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Mobile Active Filter Indicator */}
          {isMobile && selectedGrade !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-2"
            >
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] px-2 py-0.5"
                >
                  Grade {selectedGrade}
                </Badge>
                <button
                  onClick={() => setSelectedGrade(null)}
                  className="text-[11px] text-gray-500 hover:text-gray-700 active:text-gray-900 touch-manipulation"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Mobile Optimized Action Bar */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 px-4 lg:px-0"
          >
            <Card>
              <CardContent className="p-3 lg:p-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search classes..."
                        className="pl-10 h-9"
                      />
                    </div>
                  </div>

                  {/* Grade Filter */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={selectedGrade === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedGrade(null)}
                      className="h-9"
                    >
                      All Grades
                    </Button>
                    {uniqueGrades.map(grade => (
                      <Button
                        key={grade}
                        variant={selectedGrade === grade ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGrade(grade)}
                        className="h-9"
                      >
                        Grade {grade}
                      </Button>
                    ))}
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoAssign}
                      disabled={isLoading}
                      className="h-9"
                    >
                      <Sparkles className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Auto Assign</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      disabled={isLoading}
                      className="h-9"
                    >
                      <Grid3x3 className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Preview</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Mobile Search Bar */}
        {isMobile && (
          <div className="px-4 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search classes..."
                className="pl-10 h-10 bg-white shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Grade Mismatch Warnings */}
        {uniqueGrades.some(grade => getGradeMismatchWarning(grade)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 lg:mb-6 px-4 lg:px-0"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="p-1.5 lg:p-2 bg-orange-100 rounded-lg shrink-0">
                    <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm lg:text-base font-semibold text-orange-900 mb-1 lg:mb-2">
                      Class Count Mismatch
                    </h3>
                    <div className="space-y-1 text-xs lg:text-sm text-orange-800">
                      {uniqueGrades.map(grade => {
                        const warning = getGradeMismatchWarning(grade)
                        if (!warning) return null
                        return (
                          <div key={grade} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-orange-400 rounded-full shrink-0 mt-1" />
                            <span className="flex-1">{warning}</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[10px] lg:text-xs text-orange-700 mt-1.5 lg:mt-2">
                      ⚠️ Students may need redistribution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Promotion Mappings - Desktop Table / Mobile Cards */}
        <div className="px-4 lg:px-0">
          <Card>
            <CardHeader className="p-3 lg:p-6">
              <CardTitle className="text-base lg:text-lg">Class Promotion Mappings</CardTitle>
            </CardHeader>
            <CardContent className="p-3 lg:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  {/* Desktop Table Header */}
                  {!isMobile && (
                    <div className="hidden lg:grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-semibold text-sm text-gray-700 mb-2">
                      <div className="col-span-3">Current Class</div>
                      <div className="col-span-1">Grade</div>
                      <div className="col-span-1">Students</div>
                      <div className="col-span-1"></div>
                      <div className="col-span-3">Promotion To</div>
                      <div className="col-span-1">Grade</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredMappings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" />
                      </div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                        No classes found
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search or filter' : 'No class promotion mappings available'}
                      </p>
                      {(searchTerm || selectedGrade !== null) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedGrade(null)
                          }}
                          className="touch-manipulation"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className={isMobile ? "space-y-3" : "space-y-2"}>
                      <AnimatePresence>
                        {filteredMappings.map((mapping, index) => (
                        isMobile ? (
                          // Mobile Card Layout
                          <motion.div
                            key={mapping.fromClassId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.03 }}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm active:scale-[0.98] transition-all touch-manipulation"
                            onClick={() => {
                              setSelectedMappingForEdit(mapping)
                              setShowBottomSheet(true)
                            }}
                          >
                            <div className="p-4 space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{mapping.fromClassName}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Grade {mapping.fromGrade}</Badge>
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {mapping.studentCount}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {mapping.isLocked && (
                                  <Lock className="w-4 h-4 text-orange-500 shrink-0" />
                                )}
                              </div>

                              {/* Promotion Arrow */}
                              <div className="flex items-center gap-2 pl-12">
                                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                                <ArrowDown className="w-4 h-4 text-gray-400" />
                                <div className="flex-1 h-px bg-gradient-to-l from-gray-200 to-transparent"></div>
                              </div>

                              {/* Target Class */}
                              <div className="pl-12">
                                {mapping.toClassName ? (
                                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                      <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-green-900 text-sm truncate">{mapping.toClassName}</p>
                                      <p className="text-xs text-green-700">Grade {mapping.toGrade}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-green-600 shrink-0" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <AlertCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500 italic">Tap to assign</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          // Desktop Table Row
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
                          )
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sticky Mobile Action Bar */}
        {isMobile && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl safe-area-bottom"
          >
            <div className="px-4 py-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoAssign}
                disabled={isLoading}
                className="flex-1 h-11 touch-manipulation active:scale-95 transition-transform"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={isLoading}
                className="flex-1 h-11 touch-manipulation active:scale-95 transition-transform"
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || isSaving}
                className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 touch-manipulation active:scale-95 transition-transform"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </motion.div>
        )}

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
                initial={{ scale: 0.9, opacity: 0, y: isMobile ? 100 : 0 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: isMobile ? 100 : 0 }}
                className={`bg-white max-w-4xl w-full max-h-[85vh] overflow-auto ${
                  isMobile ? 'rounded-t-3xl fixed bottom-0 left-0 right-0' : 'rounded-xl'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 lg:p-6">
                  {/* Mobile Drag Handle */}
                  {isMobile && (
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-bold">Promotion Preview</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPreview(false)}
                      className="touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3 lg:space-y-4">
                    {uniqueGrades.map(grade => {
                      const gradeMappings = promotionMappings.filter(m => m.fromGrade === grade)
                      const totalStudents = gradeMappings.reduce((sum, m) => sum + m.studentCount, 0)
                      
                      return (
                        <div key={grade} className="border rounded-lg p-3 lg:p-4">
                          <div className="flex items-center justify-between mb-2 lg:mb-3">
                            <h3 className="text-sm lg:text-base font-semibold">Grade {grade}</h3>
                            <Badge className="text-xs">{totalStudents} students</Badge>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            {gradeMappings.map(m => (
                              <div key={m.fromClassId} className="flex items-center gap-2 text-xs lg:text-sm bg-gray-50 rounded p-2">
                                <span className="truncate flex-1">{m.fromClassName}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="font-medium text-green-600 truncate flex-1">
                                  {m.toClassName || 'Not assigned'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-4 lg:mt-6 flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPreview(false)}
                      className="flex-1 lg:flex-none h-11 touch-manipulation active:scale-95 transition-transform"
                    >
                      Close
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="flex-1 lg:flex-none h-11 touch-manipulation active:scale-95 transition-transform"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {isMobile ? 'Save' : 'Confirm & Save'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Edit Bottom Sheet */}
        <AnimatePresence>
          {showBottomSheet && selectedMappingForEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => {
                setShowBottomSheet(false)
                setSelectedMappingForEdit(null)
              }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  {/* Drag Handle */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{selectedMappingForEdit.fromClassName}</h3>
                      <p className="text-xs text-gray-500">
                        Grade {selectedMappingForEdit.fromGrade} • {selectedMappingForEdit.studentCount} students
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleLock(selectedMappingForEdit.fromClassId)}
                      className="shrink-0 touch-manipulation"
                    >
                      {selectedMappingForEdit.isLocked ? (
                        <Lock className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Unlock className="w-5 h-5 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  {/* Current Assignment */}
                  {selectedMappingForEdit.toClassName && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs text-green-700 font-medium mb-1">Current Assignment</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-900">{selectedMappingForEdit.toClassName}</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          Grade {selectedMappingForEdit.toGrade}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Available Classes */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Available Grade {selectedMappingForEdit.fromGrade < 12 ? selectedMappingForEdit.fromGrade + 1 : 'Next'} Classes
                    </h4>
                    <div className="space-y-2">
                      {getAvailableNextClasses(selectedMappingForEdit.fromGrade).length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No classes available for next grade</p>
                        </div>
                      ) : (
                        getAvailableNextClasses(selectedMappingForEdit.fromGrade).map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => {
                              updatePromotionTarget(selectedMappingForEdit.fromClassId, cls.id)
                              setShowBottomSheet(false)
                              setSelectedMappingForEdit(null)
                              addToast({
                                type: 'success',
                                title: 'Assignment Updated',
                                description: `${selectedMappingForEdit.fromClassName} → ${cls.name}`
                              })
                            }}
                            className={`w-full p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                              selectedMappingForEdit.toClassId === cls.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                selectedMappingForEdit.toClassId === cls.id
                                  ? 'bg-indigo-100'
                                  : 'bg-gray-100'
                              }`}>
                                <GraduationCap className={`w-5 h-5 ${
                                  selectedMappingForEdit.toClassId === cls.id
                                    ? 'text-indigo-600'
                                    : 'text-gray-600'
                                }`} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-gray-900">{cls.name}</p>
                                <p className="text-xs text-gray-500">
                                  Grade {cls.grade} • {cls.studentCount} capacity
                                </p>
                              </div>
                              {selectedMappingForEdit.toClassId === cls.id && (
                                <Check className="w-5 h-5 text-indigo-600" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBottomSheet(false)
                        setSelectedMappingForEdit(null)
                      }}
                      className="flex-1 h-11 touch-manipulation active:scale-95 transition-transform"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Filter Bottom Sheet */}
        <AnimatePresence>
          {showFilterSheet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowFilterSheet(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  {/* Drag Handle */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                  </div>

                  <h3 className="text-lg font-bold mb-4">Filter by Grade</h3>

                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedGrade(null)
                        setShowFilterSheet(false)
                      }}
                      className={`w-full p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                        selectedGrade === null
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">All Grades</span>
                        {selectedGrade === null && <Check className="w-5 h-5 text-indigo-600" />}
                      </div>
                    </button>
                    {uniqueGrades.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => {
                          setSelectedGrade(grade)
                          setShowFilterSheet(false)
                        }}
                        className={`w-full p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                          selectedGrade === grade
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <span className="font-bold text-indigo-600">{grade}</span>
                            </div>
                            <span className="font-medium">Grade {grade}</span>
                          </div>
                          {selectedGrade === grade && <Check className="w-5 h-5 text-indigo-600" />}
                        </div>
                      </button>
                    ))}
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
