'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SafetyAlertsPanel from '@/components/admin/safety-alerts-panel'
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Phone, 
  MessageCircle,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  Activity,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface SafetyIncident {
  id: string
  type: 'bullying' | 'cyberbullying' | 'inappropriate_content' | 'safety_concern' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'resolved' | 'escalated'
  studentName: string
  grade: string
  reportedBy: string
  reportDate: string
  description: string
  actionsTaken: string[]
  assignedTo?: string
}

interface SafetyMetric {
  id: string
  name: string
  value: number
  previousValue: number
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
}

interface DigitalSafetyCheck {
  id: string
  studentName: string
  grade: string
  lastCheck: string
  riskLevel: 'low' | 'medium' | 'high'
  flaggedContent: number
  parentNotified: boolean
}

export default function StudentSafetyPage() {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([])
  const [metrics, setMetrics] = useState<SafetyMetric[]>([])
  const [digitalChecks, setDigitalChecks] = useState<DigitalSafetyCheck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSafetyData()
  }, [])

  const fetchSafetyData = async () => {
    try {
      setLoading(true)
      
      // Fetch safety metrics
      const metricsResponse = await fetch('/api/admin/safety-metrics')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.metrics || [])
      }

      // Fetch safety incidents
      const incidentsResponse = await fetch('/api/admin/safety-incidents?limit=20')
      if (incidentsResponse.ok) {
        const incidentsData = await incidentsResponse.json()
        const formattedIncidents = incidentsData.incidents?.map((incident: any) => ({
          id: incident.id,
          type: incident.incident_type,
          severity: incident.severity,
          status: incident.status,
          studentName: incident.student?.full_name || 'Unknown Student',
          grade: incident.student?.grade_level || 'N/A',
          reportedBy: incident.reported_by ? 
            `${incident.reported_by.role} - ${incident.reported_by.full_name}` : 
            incident.reported_by_type || 'Unknown',
          reportDate: new Date(incident.created_at).toISOString().split('T')[0],
          description: incident.description,
          actionsTaken: incident.safety_actions?.map((action: any) => action.description) || [],
          assignedTo: incident.assigned_to?.full_name || 'Unassigned'
        })) || []
        setIncidents(formattedIncidents)
      }

      // Fetch digital safety checks
      const digitalResponse = await fetch('/api/admin/digital-safety?limit=20')
      if (digitalResponse.ok) {
        const digitalData = await digitalResponse.json()
        const formattedDigitalChecks = digitalData.digitalChecks?.map((check: any) => ({
          id: check.id,
          studentName: check.student?.full_name || 'Unknown Student',
          grade: check.student?.grade_level || 'N/A',
          lastCheck: new Date(check.check_date).toISOString().split('T')[0],
          riskLevel: check.risk_level,
          flaggedContent: check.flagged_content_count || 0,
          parentNotified: check.parent_notified || false
        })) || []
        setDigitalChecks(formattedDigitalChecks)
      }

    } catch (error: any) {
      console.error('Error fetching safety data:', error)
      // Fallback to empty arrays on error
      setIncidents([])
      setMetrics([])
      setDigitalChecks([])
    } finally {
      setLoading(false)
    }
  }

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/safety-incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Refresh data to show updated status
        fetchSafetyData()
      } else {
        console.error('Failed to update incident status')
      }
    } catch (error: any) {
      console.error('Error updating incident status:', error)
    }
  }

  const contactParent = async (incidentId: string) => {
    try {
      const response = await fetch(`/api/admin/safety-incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent_notified: true })
      })

      if (response.ok) {
        // Refresh data to show parent notification status
        fetchSafetyData()
      } else {
        console.error('Failed to update parent notification')
      }
    } catch (error: any) {
      console.error('Error contacting parent:', error)
    }
  }

  const reviewDigitalSafety = async (checkId: string) => {
    try {
      // This would typically open a detailed review modal
      // For now, we'll just log the action
      console.log('Reviewing digital safety check:', checkId)
      // In a full implementation, this would open a modal with detailed content review
    } catch (error: any) {
      console.error('Error reviewing digital safety check:', error)
    }
  }

  const notifyParentDigital = async (checkId: string) => {
    try {
      // Update the digital safety check to mark parent as notified
      const response = await fetch(`/api/admin/digital-safety/${checkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent_notified: true, parent_notification_date: new Date().toISOString() })
      })

      if (response.ok) {
        // Refresh data to show parent notification status
        fetchSafetyData()
      } else {
        console.error('Failed to notify parent')
      }
    } catch (error: any) {
      console.error('Error notifying parent:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bullying': return <Users className="w-4 h-4" />
      case 'cyberbullying': return <Shield className="w-4 h-4" />
      case 'inappropriate_content': return <Eye className="w-4 h-4" />
      case 'safety_concern': return <AlertTriangle className="w-4 h-4" />
      default: return <Flag className="w-4 h-4" />
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-green-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Student Safety
                </h1>
                <p className="text-gray-600 mt-1">Monitor and manage student safety and well-being</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <Button className="bg-red-600 hover:bg-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
              <Link href="/admin">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-600 text-sm">{metric.name}</h3>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-bold ${getMetricStatusColor(metric.status)}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {metric.trend === 'down' ? 'Decreased' : metric.trend === 'up' ? 'Increased' : 'No change'} from {metric.previousValue}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Safety Alerts Panel */}
        <SafetyAlertsPanel className="mb-6" />

        {/* Main Content Tabs */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incidents">Safety Incidents</TabsTrigger>
            <TabsTrigger value="digital">Digital Safety</TabsTrigger>
            <TabsTrigger value="prevention">Prevention Programs</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-6">
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            {getTypeIcon(incident.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{incident.studentName}</h3>
                            <p className="text-sm text-gray-600">
                              Grade {incident.grade} • Reported by {incident.reportedBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                            {incident.severity} severity
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Incident Description</h4>
                          <p className="text-gray-700 text-sm">{incident.description}</p>
                        </div>
                        
                        {incident.actionsTaken.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Actions Taken</h4>
                            <ul className="space-y-1">
                              {incident.actionsTaken.map((action, i) => (
                                <li key={i} className="flex items-center text-sm text-gray-700">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm border-t pt-4">
                          <div>
                            <span className="text-gray-600">Reported: </span>
                            <span className="font-medium">{new Date(incident.reportDate).toLocaleDateString()}</span>
                            {incident.assignedTo && (
                              <>
                                <span className="text-gray-600 ml-4">Assigned to: </span>
                                <span className="font-medium">{incident.assignedTo}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Update
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => contactParent(incident.id)}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="digital" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {digitalChecks.map((check, index) => (
                <motion.div
                  key={check.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{check.studentName}</CardTitle>
                          <CardDescription>Grade {check.grade}</CardDescription>
                        </div>
                        <Badge variant="outline" className={getRiskLevelColor(check.riskLevel)}>
                          {check.riskLevel} risk
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last Check:</span>
                          <span className="font-medium">{new Date(check.lastCheck).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Flagged Content:</span>
                          <span className={`font-medium ${check.flaggedContent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {check.flaggedContent} items
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Parent Notified:</span>
                          <span className={`font-medium ${check.parentNotified ? 'text-green-600' : 'text-red-600'}`}>
                            {check.parentNotified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => reviewDigitalSafety(check.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          {!check.parentNotified && check.flaggedContent > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => notifyParentDigital(check.id)}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Notify Parent
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prevention" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Safety Programs</span>
                  </CardTitle>
                  <CardDescription>Active prevention and education programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">Digital Citizenship Program</h4>
                      <p className="text-sm text-green-700">85% student completion rate</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800">Anti-Bullying Workshops</h4>
                      <p className="text-sm text-blue-700">Monthly sessions for all grades</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800">Peer Mediation Training</h4>
                      <p className="text-sm text-purple-700">15 student mediators trained</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Safety Resources</span>
                  </CardTitle>
                  <CardDescription>Educational materials and guidelines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Student Safety Handbook
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Digital Safety Guidelines
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Incident Response Procedures
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Parent Safety Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
