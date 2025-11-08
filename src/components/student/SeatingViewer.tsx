'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  LayoutGrid, 
  MapPin, 
  X, 
  Users, 
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SeatingData {
  hasSeating: boolean
  isAssigned: boolean
  message?: string
  studentSeat?: {
    seat_id: string
    row_index: number
    col_index: number
  }
  seatingChart?: {
    id: string
    layout_name: string
    rows: number
    cols: number
    total_seats: number
    seat_pattern: number[][]
  }
  allAssignments?: Array<{
    seat_id: string
    row_index: number
    col_index: number
    student_id: string
    profiles: {
      first_name: string
      last_name: string
    }
  }>
  classInfo?: {
    name: string
    grade_level: string
  }
}

interface SeatingViewerProps {
  isOpen: boolean
  onClose: () => void
}

export function SeatingViewer({ isOpen, onClose }: SeatingViewerProps) {
  const [seatingData, setSeatingData] = useState<SeatingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSeatingData()
    }
  }, [isOpen])

  const fetchSeatingData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/seating')
      const data = await response.json()
      
      // Convert flat seat_pattern to 2D grid
      if (data.seatingChart && Array.isArray(data.seatingChart.seat_pattern)) {
        const { rows, cols, seat_pattern } = data.seatingChart
        
        // Check if it's a flat array (like ["seat", "seat", ...])
        if (seat_pattern.length > 0 && typeof seat_pattern[0] === 'string') {
          // Convert flat array to 2D grid based on rows x cols
          const grid: number[][] = []
          for (let r = 0; r < rows; r++) {
            const row: number[] = []
            for (let c = 0; c < cols; c++) {
              const index = r * cols + c
              // "seat" = 1, anything else = 0 (empty)
              row.push(seat_pattern[index] === 'seat' ? 1 : 0)
            }
            grid.push(row)
          }
          data.seatingChart.seat_pattern = grid
        }
      }
      
      console.log('Processed seating data:', data)
      console.log('Seat pattern grid:', data.seatingChart?.seat_pattern)
      
      setSeatingData(data)
    } catch (error) {
      console.error('Error fetching seating data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeatLabel = (rowIndex: number, colIndex: number) => {
    // Convert to A1, B2, etc. notation
    const row = String.fromCharCode(65 + rowIndex) // A, B, C...
    const col = colIndex + 1
    return `${row}${col}`
  }

  const isStudentSeat = (rowIndex: number, colIndex: number) => {
    return (
      seatingData?.studentSeat &&
      seatingData.studentSeat.row_index === rowIndex &&
      seatingData.studentSeat.col_index === colIndex
    )
  }

  const getSeatOccupant = (rowIndex: number, colIndex: number) => {
    return seatingData?.allAssignments?.find(
      (assignment) =>
        assignment.row_index === rowIndex && assignment.col_index === colIndex
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, var(--theme-highlight), var(--theme-tertiary))' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <LayoutGrid className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                    My Seat
                  </h3>
                  {seatingData?.classInfo && (
                    <p className="text-xs sm:text-sm opacity-80" style={{ color: 'var(--theme-primary)' }}>
                      {seatingData.classInfo.name} • Grade {seatingData.classInfo.grade_level}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full h-8 w-8 p-0 hover:bg-white/20"
              >
                <X className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200" style={{ borderTopColor: 'var(--theme-primary)' }} />
              </div>
            ) : !seatingData?.hasSeating || !seatingData?.isAssigned ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--theme-highlight), var(--theme-tertiary))' }}>
                  <AlertCircle className="h-8 w-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {seatingData?.message || 'No Seating Arrangement'}
                </h4>
                <p className="text-sm text-gray-600">
                  Your teacher hasn't set up the seating chart yet.
                </p>
              </div>
            ) : (
              <>
                {/* Student's Seat Info */}
                {seatingData.studentSeat && (
                  <Card className="mb-4 border-2" style={{ borderColor: 'var(--theme-primary)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))' }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-0.5">Your Seat</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                              {getSeatLabel(seatingData.studentSeat.row_index, seatingData.studentSeat.col_index)}
                            </p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: 'var(--theme-primary)' }}>
                          <CheckCircle className="h-3 w-3" />
                          Assigned
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Layout Info */}
                {seatingData.seatingChart && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setExpanded(!expanded)}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                        <span className="font-medium">View Full Classroom Layout</span>
                      </span>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                )}

                {/* Seating Chart Visualization */}
                <AnimatePresence>
                  {expanded && seatingData.seatingChart && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-gray-700">
                              {seatingData.seatingChart.layout_name}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {seatingData.seatingChart.total_seats} seats
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Front of Classroom */}
                          <div className="mb-3 py-2 px-4 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
                            <p className="text-xs font-semibold text-gray-600">TEACHER'S DESK</p>
                          </div>

                          {/* Seating Grid */}
                          <div className="space-y-2 overflow-x-auto pb-2">
                            {!Array.isArray(seatingData.seatingChart.seat_pattern) || seatingData.seatingChart.seat_pattern.length === 0 ? (
                              <div className="text-center py-8 text-sm text-gray-600">
                                <p className="font-medium">⚠️ Seat pattern data is invalid</p>
                                <p className="text-xs mt-1">Type: {typeof seatingData.seatingChart.seat_pattern}</p>
                                <p className="text-xs">Value: {JSON.stringify(seatingData.seatingChart.seat_pattern)?.slice(0, 100)}</p>
                              </div>
                            ) : (
                              seatingData.seatingChart.seat_pattern.map((row, rowIndex) => (
                              <div key={rowIndex} className="flex gap-2 justify-center">
                                {Array.isArray(row) && row.map((cell, colIndex) => {
                                  const isYourSeat = isStudentSeat(rowIndex, colIndex)
                                  const occupant = getSeatOccupant(rowIndex, colIndex)
                                  const isEmpty = cell === 0

                                  if (isEmpty) {
                                    return <div key={colIndex} className="w-16 h-16 sm:w-20 sm:h-20" />
                                  }

                                  return (
                                    <motion.div
                                      key={colIndex}
                                      whileHover={{ scale: 1.05 }}
                                      className={cn(
                                        'w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all cursor-pointer',
                                        isYourSeat
                                          ? 'border-2 shadow-lg'
                                          : occupant
                                          ? 'bg-gray-50 border-gray-300 hover:shadow-md'
                                          : 'bg-white border-gray-200 border-dashed'
                                      )}
                                      style={
                                        isYourSeat
                                          ? {
                                              borderColor: 'var(--theme-primary)',
                                              background: 'linear-gradient(135deg, var(--theme-highlight), var(--theme-tertiary))',
                                              color: 'var(--theme-primary)',
                                            }
                                          : {}
                                      }
                                      title={occupant ? `${occupant.profiles.first_name} ${occupant.profiles.last_name}` : undefined}
                                    >
                                      <span className={cn('font-bold text-[10px]', isYourSeat && 'font-extrabold')}>
                                        {getSeatLabel(rowIndex, colIndex)}
                                      </span>
                                      {isYourSeat && (
                                        <MapPin className="h-3 w-3 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
                                      )}
                                      {occupant && (
                                        <span className="text-[9px] text-gray-600 mt-0.5 font-medium text-center leading-tight px-1">
                                          {isYourSeat ? 'You' : occupant.profiles.first_name}
                                        </span>
                                      )}
                                    </motion.div>
                                  )
                                })}
                              </div>
                            ))
                            )}
                          </div>

                          {/* Legend */}
                          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-3 justify-center text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded border-2" style={{ borderColor: 'var(--theme-primary)', background: 'var(--theme-highlight)' }} />
                              <span className="text-gray-600">Your Seat</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-300" />
                              <span className="text-gray-600">Occupied</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded bg-white border-2 border-dashed border-gray-200" />
                              <span className="text-gray-600">Empty</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
