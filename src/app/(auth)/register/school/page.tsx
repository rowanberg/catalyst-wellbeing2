'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateSchoolCode } from '@/lib/utils'

const schoolRegistrationSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  address: z.string().min(10, 'Please enter a complete address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  schoolEmail: z.string().email('Please enter a valid school email address'),
  adminFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  adminLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid admin email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SchoolRegistrationForm = z.infer<typeof schoolRegistrationSchema>

export default function SchoolRegistrationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schoolCode, setSchoolCode] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolRegistrationForm>({
    resolver: zodResolver(schoolRegistrationSchema),
  })

  const onSubmit = async (data: SchoolRegistrationForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/register-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setSchoolCode(result.schoolCode)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Registration failed')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (schoolCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800">School Registered Successfully!</CardTitle>
            <CardDescription>Your school has been registered with Catalyst</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 mb-2">Your School ID:</p>
              <p className="text-2xl font-mono font-bold text-green-800">{schoolCode}</p>
              <p className="text-xs text-green-600 mt-2">
                Save this ID - you'll need it for user registration
              </p>
            </div>
            
            <div className="space-y-2">
              <Button onClick={() => router.push('/login')} className="w-full">
                Continue to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigator.clipboard.writeText(schoolCode)}
                className="w-full"
              >
                Copy School ID
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Register Your School</CardTitle>
          <CardDescription>Set up your school on the Catalyst platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">School Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="Enter school name"
                  {...register('schoolName')}
                />
                {errors.schoolName && (
                  <p className="text-sm text-red-600">{errors.schoolName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">School Address</Label>
                <Input
                  id="address"
                  placeholder="Enter complete school address"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="School phone number"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">School Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    placeholder="school@example.com"
                    {...register('schoolEmail')}
                  />
                  {errors.schoolEmail && (
                    <p className="text-sm text-red-600">{errors.schoolEmail.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Administrator Account</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminFirstName">First Name</Label>
                  <Input
                    id="adminFirstName"
                    placeholder="Admin first name"
                    {...register('adminFirstName')}
                  />
                  {errors.adminFirstName && (
                    <p className="text-sm text-red-600">{errors.adminFirstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminLastName">Last Name</Label>
                  <Input
                    id="adminLastName"
                    placeholder="Admin last name"
                    {...register('adminLastName')}
                  />
                  {errors.adminLastName && (
                    <p className="text-sm text-red-600">{errors.adminLastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('adminEmail')}
                />
                {errors.adminEmail && (
                  <p className="text-sm text-red-600">{errors.adminEmail.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering School...' : 'Register School'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
