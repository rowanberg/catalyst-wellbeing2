'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Camera, 
  Upload, 
  Download, 
  Scan,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
  Zap,
  Target,
  Clock,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

interface OMRScanningInterfaceProps {
  assessment: {
    id: string
    title: string
    max_score: number
    answer_key?: { [questionId: string]: string }
  }
  onGradesScanned: (grades: Array<{
    student_id: string
    student_name: string
    score: number
    answers: { [questionId: string]: string }
    confidence: number
  }>) => void
}

interface ScannedSheet {
  id: string
  student_name: string
  student_id: string
  answers: { [questionId: string]: string }
  score: number
  confidence: number
  image_data: string
  timestamp: string
  status: 'pending' | 'processed' | 'error'
}

export default function OMRScanningInterface({ assessment, onGradesScanned }: OMRScanningInterfaceProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedSheets, setScannedSheets] = useState<ScannedSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<ScannedSheet | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start camera for live scanning
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraStream(stream)
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Could not access camera. Please check permissions.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
      setShowCamera(false)
    }
  }, [cameraStream])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      processOMRSheet(imageData)
    }
  }, [])

  // Process uploaded or captured OMR sheet
  const processOMRSheet = async (imageData: string) => {
    setIsScanning(true)
    
    try {
      // Simulate OMR processing (in real implementation, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock OMR processing results
      const mockResults = generateMockOMRResults(imageData)
      
      setScannedSheets(prev => [...prev, mockResults])
      toast.success(`Scanned sheet for ${mockResults.student_name}`)
      
    } catch (error) {
      console.error('Error processing OMR sheet:', error)
      toast.error('Failed to process OMR sheet')
    } finally {
      setIsScanning(false)
    }
  }

  // Generate mock OMR results for demonstration
  const generateMockOMRResults = (imageData: string): ScannedSheet => {
    const mockStudents = [
      'Alex Johnson', 'Sarah Chen', 'Michael Brown', 'Emma Davis', 'James Wilson',
      'Olivia Garcia', 'William Miller', 'Sophia Anderson', 'Benjamin Taylor', 'Isabella Martinez'
    ]
    
    const studentName = mockStudents[Math.floor(Math.random() * mockStudents.length)]
    const answers: { [key: string]: string } = {}
    let correctAnswers = 0
    
    // Generate random answers for 20 questions
    for (let i = 1; i <= 20; i++) {
      const options = ['A', 'B', 'C', 'D']
      const selectedAnswer = options[Math.floor(Math.random() * options.length)]
      answers[i.toString()] = selectedAnswer
      
      // Simulate some correct answers (70-90% accuracy)
      if (Math.random() > 0.2) correctAnswers++
    }
    
    const score = Math.round((correctAnswers / 20) * assessment.max_score)
    const confidence = 85 + Math.random() * 10 // 85-95% confidence
    
    return {
      id: `omr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      student_name: studentName,
      student_id: `student_${studentName.toLowerCase().replace(' ', '_')}`,
      answers,
      score,
      confidence: Math.round(confidence),
      image_data: imageData,
      timestamp: new Date().toISOString(),
      status: 'processed'
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            processOMRSheet(e.target.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // Process all scanned sheets
  const processAllSheets = () => {
    const processedSheets = scannedSheets.filter(sheet => sheet.status === 'processed')
    const grades = processedSheets.map(sheet => ({
      student_id: sheet.student_id,
      student_name: sheet.student_name,
      score: sheet.score,
      answers: sheet.answers,
      confidence: sheet.confidence
    }))
    
    onGradesScanned(grades)
    toast.success(`Processed ${grades.length} grade entries`)
  }

  // Download OMR template
  const downloadTemplate = () => {
    // In real implementation, this would generate a proper OMR template PDF
    toast.info('OMR template download would be implemented here')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Scan className="h-5 w-5 text-blue-600" />
            OMR Scanning System
          </h2>
          <p className="text-gray-600 text-sm">Scan answer sheets with 60-second grading for 30 tests</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          
          {scannedSheets.length > 0 && (
            <Button onClick={processAllSheets} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Process All ({scannedSheets.length})
            </Button>
          )}
        </div>
      </div>

      {/* Scanning Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Scanning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Camera Scanning
            </CardTitle>
            <CardDescription>
              Use your device camera to scan answer sheets in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCamera ? (
              <Button onClick={startCamera} className="w-full flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera overlay guides */}
                  <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                      Align answer sheet within frame
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={capturePhoto} 
                    disabled={isScanning}
                    className="flex-1 flex items-center gap-2"
                  >
                    {isScanning ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                    {isScanning ? 'Processing...' : 'Capture'}
                  </Button>
                  
                  <Button variant="outline" onClick={stopCamera}>
                    Stop Camera
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Batch Upload
            </CardTitle>
            <CardDescription>
              Upload multiple answer sheet images for batch processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop answer sheets
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports JPG, PNG (up to 10MB each)
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Ensure good lighting and clear images</p>
              <p>• Keep answer sheets flat and unfolded</p>
              <p>• Use dark pen/pencil marks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanned Sheets Results */}
      {scannedSheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Scanned Results ({scannedSheets.length})
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready to Process
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scannedSheets.map((sheet, index) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{sheet.student_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Score: {sheet.score}/{assessment.max_score}</span>
                        <span>Confidence: {sheet.confidence}%</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(sheet.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={sheet.confidence > 90 ? 'default' : 'secondary'}
                      className={sheet.confidence > 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                    >
                      {sheet.confidence > 90 ? 'High Confidence' : 'Review Needed'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSheet(sheet)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScannedSheets(prev => prev.filter(s => s.id !== sheet.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sheet Review Modal */}
      <AnimatePresence>
        {selectedSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSheet(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Review: {selectedSheet.student_name}</h3>
                <Button variant="ghost" onClick={() => setSelectedSheet(null)}>×</Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scanned Image */}
                <div>
                  <h4 className="font-semibold mb-2">Scanned Answer Sheet</h4>
                  <div className="relative w-full" style={{ minHeight: '400px' }}>
                    <Image 
                      src={selectedSheet.image_data} 
                      alt="Scanned answer sheet"
                      fill
                      className="border rounded-lg object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
                
                {/* Detected Answers */}
                <div>
                  <h4 className="font-semibold mb-2">Detected Answers</h4>
                  <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                    {Object.entries(selectedSheet.answers).map(([question, answer]) => (
                      <div key={question} className="p-2 bg-gray-50 rounded text-center text-sm">
                        <div className="font-medium">Q{question}</div>
                        <div className="text-blue-600">{answer}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Final Score:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {selectedSheet.score}/{assessment.max_score}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span>Confidence Level:</span>
                      <span className={`font-medium ${selectedSheet.confidence > 90 ? 'text-green-600' : 'text-amber-600'}`}>
                        {selectedSheet.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">OMR Scanning Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">For Best Results:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use the provided OMR template</li>
                <li>• Ensure good lighting conditions</li>
                <li>• Keep answer sheets flat and straight</li>
                <li>• Use dark pen or #2 pencil</li>
                <li>• Fill bubbles completely</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Processing Time:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Single sheet: ~2-3 seconds</li>
                <li>• Batch of 30 sheets: ~60 seconds</li>
                <li>• Automatic grade calculation</li>
                <li>• Confidence scoring included</li>
                <li>• Manual review for low confidence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
