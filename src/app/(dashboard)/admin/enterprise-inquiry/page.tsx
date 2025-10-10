'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Building,
  ArrowLeft,
  Users,
  School,
  Globe,
  Phone,
  Mail,
  MapPin,
  Send,
  Check,
  Shield,
  Award,
  Zap,
  Rocket
} from 'lucide-react'

function EnterpriseInquiryContent() {
  const router = useRouter()
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    numberOfStudents: '',
    numberOfSchools: '',
    currentSolution: '',
    requirements: '',
    timeline: '',
    budget: '',
    additionalInfo: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    addToast({
      type: 'success',
      title: 'Inquiry Submitted!',
      description: 'Our enterprise team will contact you within 24 hours.'
    })
    
    setIsSubmitting(false)
    router.push('/admin/subscription')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/subscription')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Enterprise Solutions</h1>
                    <p className="text-sm text-gray-400 mt-1">Tailored solutions for large organizations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="text-xl">Enterprise Inquiry Form</CardTitle>
                <CardDescription className="text-gray-200">
                  Tell us about your organization and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Organization Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Organization Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Organization Name *</Label>
                        <Input
                          value={formData.organizationName}
                          onChange={(e) => handleInputChange('organizationName', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="ABC School District"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Organization Type *</Label>
                        <Select
                          value={formData.organizationType}
                          onValueChange={(value) => handleInputChange('organizationType', value)}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school-district">School District</SelectItem>
                            <SelectItem value="university">University</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                            <SelectItem value="k12-chain">K-12 School Chain</SelectItem>
                            <SelectItem value="education-ministry">Education Ministry</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Contact Name *</Label>
                        <Input
                          value={formData.contactName}
                          onChange={(e) => handleInputChange('contactName', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Title/Position *</Label>
                        <Input
                          value={formData.contactTitle}
                          onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="IT Director"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="john@school.edu"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Phone Number</Label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scale & Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Scale & Requirements</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Number of Students *</Label>
                        <Select
                          value={formData.numberOfStudents}
                          onValueChange={(value) => handleInputChange('numberOfStudents', value)}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                            <SelectItem value="10000-25000">10,000 - 25,000</SelectItem>
                            <SelectItem value="25000-50000">25,000 - 50,000</SelectItem>
                            <SelectItem value="50000-100000">50,000 - 100,000</SelectItem>
                            <SelectItem value="100000+">100,000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Number of Schools/Campuses</Label>
                        <Input
                          value={formData.numberOfSchools}
                          onChange={(e) => handleInputChange('numberOfSchools', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 25"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Implementation Timeline</Label>
                        <Select
                          value={formData.timeline}
                          onValueChange={(value) => handleInputChange('timeline', value)}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate (&lt; 1 month)</SelectItem>
                            <SelectItem value="1-3months">1-3 months</SelectItem>
                            <SelectItem value="3-6months">3-6 months</SelectItem>
                            <SelectItem value="6-12months">6-12 months</SelectItem>
                            <SelectItem value="12months+">12+ months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Budget Range</Label>
                        <Select
                          value={formData.budget}
                          onValueChange={(value) => handleInputChange('budget', value)}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select budget" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under-1l">Under ₹1 Lakh/month</SelectItem>
                            <SelectItem value="1-5l">₹1-5 Lakhs/month</SelectItem>
                            <SelectItem value="5-10l">₹5-10 Lakhs/month</SelectItem>
                            <SelectItem value="10l+">₹10+ Lakhs/month</SelectItem>
                            <SelectItem value="negotiable">To be discussed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-300">Key Requirements & Features Needed</Label>
                      <Textarea
                        value={formData.requirements}
                        onChange={(e) => handleInputChange('requirements', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                        placeholder="Describe your specific requirements, integrations needed, compliance requirements, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-300">Current Solution (if any)</Label>
                      <Input
                        value={formData.currentSolution}
                        onChange={(e) => handleInputChange('currentSolution', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="e.g., Google Classroom, Custom LMS, etc."
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Send className="h-4 w-4 mr-2" />
                        Submit Enterprise Inquiry
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Enterprise Benefits */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700">
                <CardTitle className="text-white text-lg">Enterprise Benefits</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Priority Implementation</p>
                      <p className="text-gray-400 text-sm">Dedicated team for rapid deployment</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Enhanced Security</p>
                      <p className="text-gray-400 text-sm">Custom security protocols & compliance</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Users className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Dedicated Support</p>
                      <p className="text-gray-400 text-sm">24/7 priority support & SLA guarantee</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Rocket className="h-5 w-5 text-purple-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Custom Features</p>
                      <p className="text-gray-400 text-sm">Tailored development for your needs</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700">
                <CardTitle className="text-white text-lg">Direct Contact</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">enterprise@catalyst.edu</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">+91 1800-CATALYST</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">catalyst.edu/enterprise</span>
                </div>
                <p className="text-xs text-gray-500 pt-4">
                  Our enterprise team typically responds within 24 hours during business days.
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">ISO 27001</p>
                </div>
                <div className="text-center">
                  <Award className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">SOC 2</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">GDPR</p>
                </div>
                <div className="text-center">
                  <Check className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">FERPA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnterpriseInquiryPage() {
  return (
    <ClientWrapper>
      <UnifiedAuthGuard requiredRole="admin">
        <EnterpriseInquiryContent />
      </UnifiedAuthGuard>
    </ClientWrapper>
  )
}
