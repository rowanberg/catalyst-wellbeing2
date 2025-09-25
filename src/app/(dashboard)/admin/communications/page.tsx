'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClientWrapper } from '@/components/providers/ClientWrapper';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Flag,
  Search,
  Filter,
  Download,
  Lock,
  Unlock,
  Ban,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/auth/auth-guard';

interface ModerationItem {
  id: string;
  messageId: string;
  flaggedBy: 'ai_system' | 'user_report' | 'admin_review';
  flagReason: string;
  flagSeverity: 'low' | 'medium' | 'high' | 'critical';
  flagCategories: string[];
  reviewStatus: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  actionTaken?: 'none' | 'quarantine' | 'block_user' | 'notify_admin' | 'emergency_alert';
  createdAt: string;
  message: {
    content: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    channelId: string;
    sentAt: string;
  };
}

interface EmergencyIncident {
  id: string;
  incidentType: 'safety_button' | 'content_violation' | 'user_report' | 'system_alert';
  reporterId: string;
  reporterName: string;
  reportedUserId?: string;
  reportedUserName?: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface CommunicationStats {
  totalMessages: number;
  flaggedMessages: number;
  activeChannels: number;
  emergencyIncidents: number;
  flaggedRate: number;
  responseTime: number;
}

function AdminCommunicationsContent() {
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [emergencyIncidents, setEmergencyIncidents] = useState<EmergencyIncident[]>([]);
  const [stats, setStats] = useState<CommunicationStats>({
    totalMessages: 0,
    flaggedMessages: 0,
    activeChannels: 0,
    emergencyIncidents: 0,
    flaggedRate: 0,
    responseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from API
      setModerationQueue([
        {
          id: '1',
          messageId: 'msg_001',
          flaggedBy: 'ai_system',
          flagReason: 'Potential bullying language detected',
          flagSeverity: 'high',
          flagCategories: ['bullying', 'inappropriate_language'],
          reviewStatus: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          message: {
            content: 'You are so stupid and ugly, nobody likes you',
            senderId: 'student_123',
            senderName: 'Alex Johnson',
            senderRole: 'student',
            channelId: 'channel_001',
            sentAt: '2024-01-15T10:25:00Z'
          }
        },
        {
          id: '2',
          messageId: 'msg_002',
          flaggedBy: 'user_report',
          flagReason: 'Parent reported inappropriate content',
          flagSeverity: 'medium',
          flagCategories: ['inappropriate_content'],
          reviewStatus: 'reviewing',
          reviewedBy: 'Admin Smith',
          createdAt: '2024-01-15T09:15:00Z',
          message: {
            content: 'Can we meet after school to discuss the assignment?',
            senderId: 'teacher_456',
            senderName: 'Ms. Davis',
            senderRole: 'teacher',
            channelId: 'channel_002',
            sentAt: '2024-01-15T09:10:00Z'
          }
        }
      ]);

      setEmergencyIncidents([
        {
          id: '1',
          incidentType: 'safety_button',
          reporterId: 'student_789',
          reporterName: 'Emma Wilson',
          reportedUserId: 'student_123',
          reportedUserName: 'Alex Johnson',
          severityLevel: 'critical',
          description: 'Student pressed "I Feel Unsafe" button during conversation',
          status: 'open',
          createdAt: '2024-01-15T11:00:00Z'
        }
      ]);

      setStats({
        totalMessages: 1247,
        flaggedMessages: 23,
        activeChannels: 156,
        emergencyIncidents: 3,
        flaggedRate: 1.8,
        responseTime: 12
      });
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (itemId: string, action: 'approve' | 'reject' | 'escalate', notes?: string) => {
    try {
      setModerationQueue(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                reviewStatus: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'escalated',
                reviewedBy: 'Current Admin',
                reviewedAt: new Date().toISOString(),
                reviewNotes: notes
              }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleEmergencyAction = async (incidentId: string, action: 'investigate' | 'resolve' | 'escalate') => {
    try {
      setEmergencyIncidents(prev =>
        prev.map(incident =>
          incident.id === incidentId
            ? {
                ...incident,
                status: action === 'investigate' ? 'investigating' : action === 'resolve' ? 'resolved' : 'escalated',
                assignedTo: action === 'investigate' ? 'Current Admin' : incident.assignedTo,
                resolvedAt: action === 'resolve' ? new Date().toISOString() : incident.resolvedAt
              }
            : incident
        )
      );
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredModerationQueue = moderationQueue.filter(item => {
    const matchesSearch = item.message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.message.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || item.flagSeverity === severityFilter;
    const matchesStatus = statusFilter === 'all' || item.reviewStatus === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communication Security Center</h1>
              <p className="text-gray-600">Military-grade oversight and moderation</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Logs</span>
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Lock</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Messages</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalMessages.toLocaleString()}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Flagged Messages</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.flaggedMessages}</p>
                  <p className="text-xs text-orange-600">{stats.flaggedRate}% flag rate</p>
                </div>
                <Flag className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Channels</p>
                  <p className="text-3xl font-bold text-green-900">{stats.activeChannels}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Emergency Incidents</p>
                  <p className="text-3xl font-bold text-red-900">{stats.emergencyIncidents}</p>
                  <p className="text-xs text-red-600">Avg {stats.responseTime}min response</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Moderation Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation Queue</CardTitle>
              <CardDescription>Review flagged messages and take appropriate action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search messages, users, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredModerationQueue.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-6 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(item.flagSeverity)}>
                          {item.flagSeverity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(item.reviewStatus)}>
                          {item.reviewStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Flagged by {item.flaggedBy.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>From:</strong> {item.message.senderName} ({item.message.senderRole})
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>Reason:</strong> {item.flagReason}
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-400">
                        <p className="text-gray-800">{item.message.content}</p>
                      </div>
                    </div>

                    {item.reviewStatus === 'pending' && (
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleReviewAction(item.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleReviewAction(item.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50"
                          onClick={() => handleReviewAction(item.id, 'escalate')}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Escalate
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Emergency Incidents</span>
              </CardTitle>
              <CardDescription>Critical safety incidents requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emergencyIncidents.map((incident) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-6 bg-white shadow-sm border-red-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(incident.severityLevel)}>
                          {incident.severityLevel.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {incident.incidentType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(incident.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reporter:</strong> {incident.reporterName}
                      </p>
                      {incident.reportedUserName && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Reported User:</strong> {incident.reportedUserName}
                        </p>
                      )}
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <p className="text-gray-800">{incident.description}</p>
                      </div>
                    </div>

                    {incident.status === 'open' && (
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleEmergencyAction(incident.id, 'investigate')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleEmergencyAction(incident.id, 'resolve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function AdminCommunications() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminCommunicationsContent />
    </AuthGuard>
  );
}
