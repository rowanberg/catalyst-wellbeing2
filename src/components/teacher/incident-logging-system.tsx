'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  MapPin,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  FileText,
  Users
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Student {
  id: string
  first_name: string
  last_name: string
  grade_level: string
  class_name: string
}

interface IncidentLog {
  id: string
  student_id: string
  incident_type: string
  severity_level: string
  title: string
  description: string
  location?: string
  witnesses?: string[]
  action_taken?: string
  follow_up_required: boolean
  follow_up_date?: string
  created_at: string
  student_name: string
  grade_level: string
  class_name: string
}

interface IncidentLoggingSystemProps {
  students: Student[]
  onIncidentCreated?: () => void
}

export const IncidentLoggingSystem = ({ students, onIncidentCreated }: IncidentLoggingSystemProps) => {
  const [incidents, setIncidents] = useState<IncidentLog[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    incident_type: '',
    severity_level: '',
    title: '',
    description: '',
    location: '',
    witnesses: [] as string[],
    action_taken: '',
    follow_up_required: false,
    follow_up_date: '',
    visible_to_admin: true,
    visible_to_counselor: false,
    is_confidential: true
  })

  const incidentTypes = [
    { value: 'behavioral', label: 'Behavioral', color: 'bg-red-100 text-red-800' },
    { value: 'academic', label: 'Academic', color: 'bg-blue-100 text-blue-800' },
    { value: 'social', label: 'Social', color: 'bg-purple-100 text-purple-800' },
    { value: 'attendance', label: 'Attendance', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'safety', label: 'Safety', color: 'bg-orange-100 text-orange-800' },
    { value: 'positive', label: 'Positive', color: 'bg-green-100 text-green-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ]

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ]

  const fetchIncidents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teacher/incident-logs')
      if (response.ok) {
        const data = await response.json()
        setIncidents(data.incidents || [])
      }
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  const handleCreateIncident = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teacher/incident-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setFormData({
          student_id: '',
          incident_type: '',
          severity_level: '',
          title: '',
          description: '',
          location: '',
          witnesses: [],
          action_taken: '',
          follow_up_required: false,
          follow_up_date: '',
          visible_to_admin: true,
          visible_to_counselor: false,
          is_confidential: true
        })
        await fetchIncidents()
        onIncidentCreated?.()
      }
    } catch (error) {
      console.error('Error creating incident:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || incident.incident_type === filterType
    const matchesSeverity = filterSeverity === 'all' || incident.severity_level === filterSeverity
    return matchesSearch && matchesType && matchesSeverity
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incident Logs</h2>
          <p className="text-gray-600">Secure documentation for student observations</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Incident
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search incidents or students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {incidentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {severityLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No incidents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))
        )}
      </div>

      {/* Create Incident Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateIncidentModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            students={students}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateIncident}
            isLoading={isLoading}
            incidentTypes={incidentTypes}
            severityLevels={severityLevels}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const IncidentCard = ({ incident }: { incident: IncidentLog }) => {
  const getTypeColor = (type: string) => {
    const typeMap = {
      behavioral: 'bg-red-100 text-red-800',
      academic: 'bg-blue-100 text-blue-800',
      social: 'bg-purple-100 text-purple-800',
      attendance: 'bg-yellow-100 text-yellow-800',
      safety: 'bg-orange-100 text-orange-800',
      positive: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return typeMap[type as keyof typeof typeMap] || 'bg-gray-100 text-gray-800'
  }

  const getSeverityColor = (severity: string) => {
    const severityMap = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return severityMap[severity as keyof typeof severityMap] || 'bg-gray-100 text-gray-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{incident.title}</h3>
            <Badge className={getTypeColor(incident.incident_type)}>
              {incident.incident_type}
            </Badge>
            <Badge className={getSeverityColor(incident.severity_level)}>
              {incident.severity_level}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {incident.student_name} ({incident.grade_level})
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(incident.created_at).toLocaleDateString()}
            </div>
            {incident.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {incident.location}
              </div>
            )}
          </div>
        </div>
        {incident.follow_up_required && (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            Follow-up Required
          </Badge>
        )}
      </div>
      
      <p className="text-gray-700 mb-4">{incident.description}</p>
      
      {incident.action_taken && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900 mb-1">Action Taken:</p>
          <p className="text-sm text-blue-800">{incident.action_taken}</p>
        </div>
      )}
    </motion.div>
  )
}

const CreateIncidentModal = ({ 
  isOpen, 
  onClose, 
  students, 
  formData, 
  setFormData, 
  onSubmit, 
  isLoading,
  incidentTypes,
  severityLevels 
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Incident Log</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <Select value={formData.student_id} onValueChange={(value: string) => 
                  setFormData((prev: any) => ({ ...prev, student_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.grade_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Type *
                </label>
                <Select value={formData.incident_type} onValueChange={(value: string) => 
                  setFormData((prev: any) => ({ ...prev, incident_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((type: any) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level *
                </label>
                <Select value={formData.severity_level} onValueChange={(value: string) => 
                  setFormData((prev: any) => ({ ...prev, severity_level: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level: any) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Classroom 5A, Playground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of the incident"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of what happened..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Taken
              </label>
              <Textarea
                value={formData.action_taken}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, action_taken: e.target.value }))}
                placeholder="What actions were taken to address the incident..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="follow_up_required"
                checked={formData.follow_up_required}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, follow_up_required: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="follow_up_required" className="text-sm font-medium text-gray-700">
                Follow-up required
              </label>
            </div>

            {formData.follow_up_required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <Input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, follow_up_date: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isLoading || !formData.student_id || !formData.incident_type || !formData.severity_level || !formData.title || !formData.description}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Log
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
