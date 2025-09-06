'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SetupDemoPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [schools, setSchools] = useState<any[]>([])
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    schoolId: ''
  })

  const setupDemoData = async () => {
    try {
      setLoading(true)
      setMessage('Creating demo schools and students...')

      const response = await fetch('/api/admin/setup-demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok) {
        setSchools(data.schools)
        setMessage(`✅ Demo data created successfully! Created ${data.schools.length} schools with students and help requests.`)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const createAdminUser = async () => {
    try {
      setLoading(true)
      setMessage('Creating admin user...')

      const response = await fetch('/api/admin/create-admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Admin user created successfully! Email: ${data.user.email}`)
        setAdminForm({ email: '', password: '', firstName: '', lastName: '', schoolId: '' })
      } else {
        console.error('Admin user creation failed:', data)
        setMessage(`❌ Error: ${data.error}${data.details ? ` - ${data.details}` : ''}${data.code ? ` (Code: ${data.code})` : ''}`)
      }
    } catch (error) {
      console.error('Network error:', error)
      setMessage(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Demo Data Setup</h1>
          <p className="text-muted-foreground">
            Set up demo schools, students, and help requests to test the school isolation system.
          </p>
        </div>

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Demo Schools & Students</CardTitle>
            <CardDescription>
              This will create 2 demo schools with students and encrypted help requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={setupDemoData} disabled={loading}>
              {loading ? 'Creating...' : 'Setup Demo Data'}
            </Button>
          </CardContent>
        </Card>

        {schools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Created Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schools.map((school) => (
                  <div key={school.id} className="border p-4 rounded">
                    <h3 className="font-semibold">{school.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      School Code: {school.schoolCode} | 
                      Students: {school.studentsCreated} | 
                      Help Requests: {school.helpRequestsCreated}
                    </p>
                    <p className="text-xs text-muted-foreground">ID: {school.id}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {schools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Create Admin User</CardTitle>
              <CardDescription>
                Create an admin user for one of the schools to test the messaging system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={adminForm.firstName}
                      onChange={(e) => setAdminForm({...adminForm, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={adminForm.lastName}
                      onChange={(e) => setAdminForm({...adminForm, lastName: e.target.value})}
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                    placeholder="admin@school.edu"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                    placeholder="Password123!"
                  />
                </div>
                <div>
                  <Label htmlFor="schoolId">School</Label>
                  <select
                    id="schoolId"
                    value={adminForm.schoolId}
                    onChange={(e) => setAdminForm({...adminForm, schoolId: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  onClick={createAdminUser} 
                  disabled={loading || !adminForm.email || !adminForm.password || !adminForm.firstName || !adminForm.lastName || !adminForm.schoolId}
                >
                  {loading ? 'Creating...' : 'Create Admin User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Debug Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>If you're getting errors, check your Supabase configuration:</p>
              <Button 
                onClick={() => window.open('/api/debug/supabase-config', '_blank')}
                variant="outline"
              >
                Test Supabase Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Test the System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>1. Login with the admin user you created</p>
              <p>2. Go to Admin Dashboard → Messaging</p>
              <p>3. You should only see help requests from students in that admin's school</p>
              <p>4. Create another admin for the other school to test isolation</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
