'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { UserCheck, UserX, Users, Clock, Mail, Calendar, RefreshCw } from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  email_confirmed: boolean
  created_at: string
  last_sign_in_at?: string
}

export default function PendingUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set())
  const [approvalData, setApprovalData] = useState<{[key: string]: {firstName: string, lastName: string, role: string}}>({})
  const { addToast } = useToast()

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/admin/pending-users')
      const data = await response.json()
      
      if (response.ok) {
        setPendingUsers(data.pending_users || [])
      } else {
        addToast({
          type: 'error',
          title: 'Failed to fetch pending users',
          description: data.message || 'Unknown error'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to fetch pending users'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const handleApprove = async (userId: string) => {
    const userData = approvalData[userId]
    if (!userData?.firstName || !userData?.lastName) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        description: 'Please fill in first name and last name'
      })
      return
    }

    setProcessingUsers(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch('/api/admin/pending-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'student',
          action: 'approve'
        })
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'User Approved',
          description: `${userData.firstName} ${userData.lastName} has been approved and can now log in`
        })
        fetchPendingUsers() // Refresh list
      } else {
        addToast({
          type: 'error',
          title: 'Approval Failed',
          description: data.message || 'Failed to approve user'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to approve user'
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleReject = async (userId: string) => {
    setProcessingUsers(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch('/api/admin/pending-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'reject'
        })
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'User Rejected',
          description: 'User has been removed from the system'
        })
        fetchPendingUsers() // Refresh list
      } else {
        addToast({
          type: 'error',
          title: 'Rejection Failed',
          description: data.message || 'Failed to reject user'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reject user'
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const updateApprovalData = (userId: string, field: string, value: string) => {
    setApprovalData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading pending users..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending User Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve student registration requests</p>
        </div>
        <Button 
          onClick={fetchPendingUsers}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              <p className="text-gray-600">Pending Approvals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Users</h3>
            <p className="text-gray-600">All user registrations have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.email}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Registered: {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.email_confirmed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.email_confirmed ? 'Email Confirmed' : 'Email Not Confirmed'}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`firstName-${user.id}`}>First Name</Label>
                    <Input
                      id={`firstName-${user.id}`}
                      placeholder="First name"
                      value={approvalData[user.id]?.firstName || ''}
                      onChange={(e) => updateApprovalData(user.id, 'firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`lastName-${user.id}`}>Last Name</Label>
                    <Input
                      id={`lastName-${user.id}`}
                      placeholder="Last name"
                      value={approvalData[user.id]?.lastName || ''}
                      onChange={(e) => updateApprovalData(user.id, 'lastName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`role-${user.id}`}>Role</Label>
                    <select
                      id={`role-${user.id}`}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={approvalData[user.id]?.role || 'student'}
                      onChange={(e) => updateApprovalData(user.id, 'role', e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingUsers.has(user.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingUsers.has(user.id) ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      disabled={processingUsers.has(user.id)}
                      variant="destructive"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
