'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  User, 
  Clock,
  AlertCircle,
  Shield
} from 'lucide-react'

interface SafetyAlert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  created_at: string
  acknowledged: boolean
  acknowledged_at?: string
  resolved_at?: string
  assigned_to?: {
    id: string
    full_name: string
    role: string
  }
  related_student?: {
    id: string
    full_name: string
    grade_level: string
  }
  acknowledged_by?: {
    id: string
    full_name: string
    role: string
  }
  auto_generated: boolean
}

interface SafetyAlertsPanelProps {
  className?: string
}

export default function SafetyAlertsPanel({ className }: SafetyAlertsPanelProps) {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active')

  useEffect(() => {
    fetchAlerts()
    // Set up polling for real-time updates
    const interval = setInterval(fetchAlerts, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [filter])

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/admin/safety-alerts?status=${filter === 'all' ? 'active' : filter}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching safety alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/safety-alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledged: true })
      })

      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/safety-alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' })
      })

      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/safety-alerts/${alertId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error('Error dismissing alert:', error)
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Bell className="w-4 h-4" />
      case 'medium': return <AlertCircle className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <Shield className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'incident_created': return 'bg-purple-100 text-purple-800'
      case 'high_risk_detected': return 'bg-red-100 text-red-800'
      case 'parent_notification': return 'bg-blue-100 text-blue-800'
      case 'escalation_required': return 'bg-orange-100 text-orange-800'
      case 'system_alert': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'active') return alert.status === 'active'
    if (filter === 'acknowledged') return alert.acknowledged && alert.status !== 'resolved'
    if (filter === 'resolved') return alert.status === 'resolved'
    return true
  })

  const activeAlertsCount = alerts.filter(alert => alert.status === 'active' && !alert.acknowledged).length
  const criticalAlertsCount = alerts.filter(alert => alert.severity === 'critical' && alert.status === 'active').length

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Safety Alerts</span>
              {activeAlertsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeAlertsCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex space-x-2">
              {['all', 'active', 'acknowledged', 'resolved'].map((filterOption) => (
                <Button
                  key={filterOption}
                  size="sm"
                  variant={filter === filterOption ? 'default' : 'outline'}
                  onClick={() => setFilter(filterOption as any)}
                  className="capitalize"
                >
                  {filterOption}
                </Button>
              ))}
            </div>
          </div>
          {criticalAlertsCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  {criticalAlertsCount} critical alert{criticalAlertsCount > 1 ? 's' : ''} require immediate attention
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No alerts found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border rounded-lg p-4 ${
                      alert.severity === 'critical' ? 'border-red-300 bg-red-50' :
                      alert.severity === 'high' ? 'border-orange-300 bg-orange-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {getSeverityIcon(alert.severity)}
                            <span className="ml-1 capitalize">{alert.severity}</span>
                          </Badge>
                          <Badge className={getAlertTypeColor(alert.alert_type)}>
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                          {alert.auto_generated && (
                            <Badge variant="outline" className="text-xs">
                              Auto
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                        <p className="text-gray-700 text-sm mb-3">{alert.message}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                          </div>
                          {alert.assigned_to && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{alert.assigned_to.full_name}</span>
                            </div>
                          )}
                          {alert.related_student && (
                            <div className="flex items-center space-x-1">
                              <span>Student: {alert.related_student.full_name} (Grade {alert.related_student.grade_level})</span>
                            </div>
                          )}
                        </div>
                        
                        {alert.acknowledged && alert.acknowledged_by && (
                          <div className="mt-2 text-xs text-green-600">
                            ✓ Acknowledged by {alert.acknowledged_by.full_name} at {new Date(alert.acknowledged_at!).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!alert.acknowledged && alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {alert.status !== 'resolved' && (
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(alert.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
