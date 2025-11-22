'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { supabase } from '@/lib/supabaseClient'
import { 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Calendar,
  Building,
  Shield,
  CheckCircle,
  ArrowRight,
  Save,
  GraduationCap,
  Globe,
  FileText,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Form validation schema
const setupSchema = z.object({
  // Basic Information
  school_name: z.string().min(1, 'School name is required'),
  principal_name: z.string().min(1, 'Principal name is required'),
  school_type: z.string().min(1, 'School type is required'),
  established_year: z.number().min(1800, 'Valid year required').max(new Date().getFullYear()).optional(),
  
  // Contact Information
  primary_email: z.string().email('Valid email required'),
  secondary_email: z.string().email('Valid email required').optional().or(z.literal('')),
  primary_phone: z.string().min(10, 'Valid phone number required'),
  secondary_phone: z.string().optional(),
  fax_number: z.string().optional(),
  website_url: z.string().url('Valid website URL required').optional().or(z.literal('')),
  
  // Address
  street_address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state_province: z.string().min(1, 'State/Province is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  
  // School Hours & Schedule
  school_start_time: z.string().min(1, 'School start time is required'),
  school_end_time: z.string().min(1, 'School end time is required'),
  office_start_time: z.string().min(1, 'Office start time is required'),
  office_end_time: z.string().min(1, 'Office end time is required'),
  lunch_start_time: z.string().min(1, 'Lunch start time is required'),
  lunch_end_time: z.string().min(1, 'Lunch end time is required'),
  
  // Operating Days
  operates_monday: z.boolean(),
  operates_tuesday: z.boolean(),
  operates_wednesday: z.boolean(),
  operates_thursday: z.boolean(),
  operates_friday: z.boolean(),
  operates_saturday: z.boolean(),
  operates_sunday: z.boolean(),
  
  // Academic Information
  academic_year_start: z.string().optional(),
  academic_year_end: z.string().optional(),
  total_students: z.number().min(0, 'Must be 0 or greater'),
  total_teachers: z.number().min(0, 'Must be 0 or greater'),
  total_staff: z.number().min(0, 'Must be 0 or greater'),
  grade_levels_offered: z.string().optional(),
  
  // Emergency Contacts
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Valid emergency phone required'),
  police_contact: z.string().optional(),
  fire_department_contact: z.string().optional(),
  hospital_contact: z.string().optional(),
  school_nurse_extension: z.string().optional(),
  security_extension: z.string().optional(),
  
  // School Information
  school_motto: z.string().optional(),
  school_mission: z.string().optional(),
  school_vision: z.string().optional(),
  accreditation_body: z.string().optional(),
  district_name: z.string().optional(),
  
  // Social Media
  facebook_url: z.string().url('Valid Facebook URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Valid Twitter URL').optional().or(z.literal('')),
  instagram_url: z.string().url('Valid Instagram URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Valid LinkedIn URL').optional().or(z.literal('')),
  
  // Programs & Activities
  special_programs: z.string().optional(),
  extracurricular_activities: z.string().optional(),
  sports_programs: z.string().optional(),
  
  // Transportation
  bus_service_available: z.boolean(),
  pickup_zones: z.string().optional(),
  
  // Facilities
  has_library: z.boolean(),
  has_gymnasium: z.boolean(),
  has_cafeteria: z.boolean(),
  has_computer_lab: z.boolean(),
  has_science_lab: z.boolean(),
  has_art_room: z.boolean(),
  has_music_room: z.boolean()
})

type SetupFormData = z.infer<typeof setupSchema>

const SCHOOL_TYPE_GROUPS = [
  {
    id: 'general',
    label: 'General School Types',
    options: [
      { value: 'Public', label: 'Public School' },
      { value: 'Private', label: 'Private School' },
      { value: 'Charter', label: 'Charter School' },
      { value: 'Magnet', label: 'Magnet School' },
      { value: 'International', label: 'International School' }
    ]
  },
  {
    id: 'asia',
    label: '1. ASIA',
    options: [
      { value: 'CBSE', label: 'CBSE' },
      { value: 'ICSE / ISC', label: 'ICSE / ISC' },
      { value: 'NIOS', label: 'NIOS' },
      { value: 'All Indian State Boards', label: 'All Indian State Boards' },
      { value: 'MEXT (Japan)', label: 'MEXT (Japan)' },
      { value: 'National Curriculum of Korea', label: 'National Curriculum of Korea' },
      { value: 'Singapore MOE', label: 'Singapore MOE' },
      { value: 'SEAB', label: 'SEAB' },
      { value: 'Cambridge O-Level (Singapore partnership)', label: 'Cambridge O-Level (Singapore partnership)' },
      { value: 'Chinese National Curriculum', label: 'Chinese National Curriculum' },
      { value: 'Gaokao Provincial Boards', label: 'Gaokao Provincial Boards' },
      { value: 'Malaysian KSSM / KSSR', label: 'Malaysian KSSM / KSSR' },
      { value: 'Thai Basic Education Commission', label: 'Thai Basic Education Commission' },
      { value: 'UAE MOE Curriculum', label: 'UAE MOE Curriculum' },
      { value: 'Saudi MOE Curriculum', label: 'Saudi MOE Curriculum' },
      { value: 'Qatar MOE', label: 'Qatar MOE' },
      { value: 'Kuwait National Curriculum', label: 'Kuwait National Curriculum' },
      { value: 'Oman MOE', label: 'Oman MOE' },
      { value: 'Bahrain MOE', label: 'Bahrain MOE' },
      { value: 'Pakistan Federal Board (FBISE)', label: 'Pakistan Federal Board (FBISE)' },
      { value: 'Punjab Board', label: 'Punjab Board' },
      { value: 'Sindh Board', label: 'Sindh Board' },
      { value: 'Bangladesh National Curriculum', label: 'Bangladesh National Curriculum' },
      { value: 'Sri Lanka National Curriculum', label: 'Sri Lanka National Curriculum' },
      { value: 'Nepal NEB', label: 'Nepal NEB' },
      { value: 'Bhutan Education Board', label: 'Bhutan Education Board' }
    ]
  },
  {
    id: 'europe',
    label: '🟩 2. EUROPE',
    options: [
      { value: 'Cambridge (CAIE)', label: 'Cambridge (CAIE)' },
      { value: 'Pearson Edexcel', label: 'Pearson Edexcel' },
      { value: 'AQA', label: 'AQA' },
      { value: 'OCR', label: 'OCR' },
      { value: 'WJEC', label: 'WJEC' },
      { value: 'French National Curriculum', label: 'French National Curriculum' },
      { value: 'Baccalauréat Board', label: 'Baccalauréat Board' },
      { value: 'German State Boards (Länder)', label: 'German State Boards (Länder)' },
      { value: 'KMK Standards', label: 'KMK Standards' },
      { value: 'Swiss EDK', label: 'Swiss EDK' },
      { value: 'Matura Boards', label: 'Matura Boards' },
      { value: 'Italian MIUR', label: 'Italian MIUR' },
      { value: 'Esame di Stato', label: 'Esame di Stato' },
      { value: 'Spanish National Curriculum', label: 'Spanish National Curriculum' },
      { value: 'ESO Board', label: 'ESO Board' },
      { value: 'Bachillerato Board', label: 'Bachillerato Board' },
      { value: 'Russian FSES', label: 'Russian FSES' },
      { value: 'Finnish National Agency for Education', label: 'Finnish National Agency for Education' },
      { value: 'Swedish National Agency for Education', label: 'Swedish National Agency for Education' },
      { value: 'Norwegian UDIR', label: 'Norwegian UDIR' },
      { value: 'Dutch CITO Board', label: 'Dutch CITO Board' },
      { value: 'Belgian Education Ministries (Flanders, Wallonia)', label: 'Belgian Education Ministries (Flanders, Wallonia)' }
    ]
  },
  {
    id: 'africa',
    label: '🟧 3. AFRICA',
    options: [
      { value: 'CAPS (South Africa)', label: 'CAPS (South Africa)' },
      { value: 'IEB (South Africa)', label: 'IEB (South Africa)' },
      { value: 'DBE (South Africa)', label: 'DBE (South Africa)' },
      { value: 'Kenya KNEC', label: 'Kenya KNEC' },
      { value: 'Nigeria WAEC', label: 'Nigeria WAEC' },
      { value: 'NECO (Nigeria)', label: 'NECO (Nigeria)' },
      { value: 'Ghana BECE / WASSCE Boards', label: 'Ghana BECE / WASSCE Boards' },
      { value: 'Uganda UNEB', label: 'Uganda UNEB' },
      { value: 'Tanzania NECTA', label: 'Tanzania NECTA' },
      { value: 'Rwanda REB', label: 'Rwanda REB' }
    ]
  },
  {
    id: 'north-america',
    label: '🟪 4. NORTH AMERICA',
    options: [
      { value: 'US State Boards (all 50 states)', label: 'US State Boards (all 50 states)' },
      { value: 'Common Core', label: 'Common Core' },
      { value: 'AP (Advanced Placement)', label: 'AP (Advanced Placement)' },
      { value: 'US High School Diploma', label: 'US High School Diploma' },
      { value: 'IB', label: 'IB' },
      { value: 'Cambridge', label: 'Cambridge' },
      { value: 'Canada Ontario Board', label: 'Canada Ontario Board' },
      { value: 'BC Curriculum', label: 'BC Curriculum' },
      { value: 'Alberta Education', label: 'Alberta Education' },
      { value: 'Quebec Ministry', label: 'Quebec Ministry' },
      { value: 'Manitoba Education', label: 'Manitoba Education' },
      { value: 'Saskatchewan Education', label: 'Saskatchewan Education' },
      { value: 'Nova Scotia Education', label: 'Nova Scotia Education' }
    ]
  },
  {
    id: 'south-america',
    label: '🟫 5. SOUTH AMERICA',
    options: [
      { value: 'BNCC (Brazil)', label: 'BNCC (Brazil)' },
      { value: 'Argentine National Education Council', label: 'Argentine National Education Council' },
      { value: 'Chile Ministry of Education Curriculum', label: 'Chile Ministry of Education Curriculum' },
      { value: 'Peru Ministry of Education', label: 'Peru Ministry of Education' },
      { value: 'Colombia MEN Curriculum', label: 'Colombia MEN Curriculum' },
      { value: 'Uruguay ANEP', label: 'Uruguay ANEP' },
      { value: 'Paraguay MEC', label: 'Paraguay MEC' }
    ]
  },
  {
    id: 'australia-oceania',
    label: '🟨 6. AUSTRALIA & OCEANIA',
    options: [
      { value: 'NESA (New South Wales)', label: 'NESA (New South Wales)' },
      { value: 'VCAA (Victoria)', label: 'VCAA (Victoria)' },
      { value: 'QCAA (Queensland)', label: 'QCAA (Queensland)' },
      { value: 'SACE Board (South Australia)', label: 'SACE Board (South Australia)' },
      { value: 'TASC (Tasmania)', label: 'TASC (Tasmania)' },
      { value: 'WA School Curriculum Authority', label: 'WA School Curriculum Authority' },
      { value: 'NT Board of Studies', label: 'NT Board of Studies' },
      { value: 'New Zealand NCEA (NZQA)', label: 'New Zealand NCEA (NZQA)' }
    ]
  },
  {
    id: 'global',
    label: '🟦 7. GLOBAL INTERNATIONAL BOARDS',
    options: [
      { value: 'IB (International Baccalaureate)', label: 'IB (International Baccalaureate)' },
      { value: 'Cambridge Assessment (CAIE / IGCSE)', label: 'Cambridge Assessment (CAIE / IGCSE)' },
      { value: 'Edexcel', label: 'Edexcel' },
      { value: 'AP', label: 'AP' },
      { value: 'American Common Core', label: 'American Common Core' },
      { value: 'American High School Diploma', label: 'American High School Diploma' },
      { value: 'IPC', label: 'IPC' },
      { value: 'IMYC', label: 'IMYC' }
    ]
  }
] as const

function SchoolSetupContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [existingData, setExistingData] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 8

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      school_start_time: '08:00',
      school_end_time: '15:30',
      office_start_time: '07:30',
      office_end_time: '16:00',
      lunch_start_time: '12:00',
      lunch_end_time: '13:00',
      total_students: 0,
      total_teachers: 0,
      total_staff: 0,
      school_type: 'Public',
      country: 'United States',
      operates_monday: true,
      operates_tuesday: true,
      operates_wednesday: true,
      operates_thursday: true,
      operates_friday: true,
      operates_saturday: false,
      operates_sunday: false,
      school_nurse_extension: '123',
      security_extension: '456',
      police_contact: '911',
      fire_department_contact: '911',
      bus_service_available: false,
      has_library: true,
      has_gymnasium: true,
      has_cafeteria: true,
      has_computer_lab: true,
      has_science_lab: false,
      has_art_room: false,
      has_music_room: false
    }
  })

  const selectedSchoolType = watch('school_type')

  // Fetch existing school data
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const response = await fetch('/api/admin/school')
        if (response.ok) {
          const data = await response.json()
          setExistingData(data.school)
          
          // Pre-fill form with existing data
          if (data.school) {
            setValue('school_name', data.school.name || '')
            setValue('principal_name', data.school.principal_name || '')
            setValue('primary_email', data.school.email || '')
            setValue('primary_phone', data.school.phone || '')
            setValue('street_address', data.school.address || '')
          }
        }
      } catch (error) {
        console.error('Error fetching existing data:', error)
      }
    }

    fetchExistingData()
  }, [setValue])

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true)
    try {
      // Get user from Supabase client
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Submitting setup for user:', user.id)

      const response = await fetch('/api/admin/school-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.id
        })
      })

      if (response.ok) {
        router.push('/admin?setup=completed')
      } else {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.error || 'Failed to save setup')
      }
    } catch (error) {
      console.error('Setup error:', error)
      // You could add a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { id: 1, title: 'Basic Information', icon: School, color: 'from-blue-500 to-blue-600' },
    { id: 2, title: 'Contact & Address', icon: MapPin, color: 'from-emerald-500 to-emerald-600' },
    { id: 3, title: 'Schedule & Hours', icon: Clock, color: 'from-purple-500 to-purple-600' },
    { id: 4, title: 'Academic Details', icon: Users, color: 'from-orange-500 to-orange-600' },
    { id: 5, title: 'Emergency Contacts', icon: Shield, color: 'from-red-500 to-red-600' },
    { id: 6, title: 'School Culture', icon: Building, color: 'from-indigo-500 to-indigo-600' },
    { id: 7, title: 'Programs & Facilities', icon: Calendar, color: 'from-teal-500 to-teal-600' },
    { id: 8, title: 'Social Media & Final', icon: CheckCircle, color: 'from-green-500 to-green-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/50 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.1) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        {/* Compact Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/60 shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Award className="w-2 h-2 text-white" />
                  </div>
                </motion.div>
                
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                      School Setup
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600">
                      Configure your school's profile and settings
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Compact Progress */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="hidden sm:flex items-center space-x-3"
              >
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">
                    {Math.round((currentStep / totalSteps) * 100)}% Complete
                  </div>
                  <div className="text-xs text-slate-500">
                    Step {currentStep} of {totalSteps}
                  </div>
                </div>
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Mobile Progress */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="sm:hidden mt-4 pt-4 border-t border-slate-200"
            >
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="font-medium">Progress</span>
                <span className="font-semibold">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Progress Steps */}
        <motion.div 
          className="mb-6 sm:mb-8 lg:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {/* Mobile Progress Steps */}
          <div className="block sm:hidden">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Current Step</h3>
                <span className="text-sm font-medium text-slate-500">{currentStep} of {totalSteps}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${steps[currentStep - 1]?.color} shadow-lg`}>
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{steps[currentStep - 1]?.title}</h4>
                  <p className="text-sm text-slate-600">Step {currentStep} of {totalSteps}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Progress Steps */}
          <div className="hidden sm:block">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-md border border-white/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-800">Setup Progress</h3>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <span className="font-medium">{currentStep}</span>
                  <span>/</span>
                  <span className="font-medium">{totalSteps}</span>
                  <span className="text-xs">({Math.round((currentStep / totalSteps) * 100)}%)</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-1 lg:space-x-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex-1 flex flex-col items-center">
                    <motion.div 
                      className="relative mb-1"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg border-2 transition-all duration-300 ${
                        currentStep >= step.id 
                          ? `bg-gradient-to-r ${step.color} border-transparent text-white shadow-sm` 
                          : 'border-slate-300 text-slate-400 bg-white hover:border-slate-400'
                      }`}>
                        <step.icon className="w-3 h-3 lg:w-4 lg:h-4" />
                      </div>
                      {currentStep === step.id && (
                        <motion.div
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </motion.div>
                    <div className="text-center px-1">
                      <div className={`text-xs font-medium leading-tight ${
                        currentStep >= step.id ? 'text-slate-800' : 'text-slate-500'
                      }`}>
                        {step.title.length > 12 ? step.title.split(' ')[0] : step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 transition-all duration-300 ${
                        currentStep > step.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : 'bg-slate-200'
                      }`} style={{ transform: 'translateX(50%)' }} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <School className="w-5 h-5 text-white" />
                    </div>
                    Basic School Information
                  </CardTitle>
                  <p className="text-slate-600 mt-2">Provide essential details about your educational institution</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      School Name *
                    </label>
                    <input
                      {...register('school_name')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                      placeholder="Enter school name"
                    />
                    {errors.school_name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <span className="w-4 h-4 text-red-500">⚠</span>
                        {errors.school_name.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Principal Name *
                    </label>
                    <input
                      {...register('principal_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter principal name"
                    />
                    {errors.principal_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.principal_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      School Type *
                    </label>

                    {/* Desktop: grouped curriculum/board selector */}
                    <div className="hidden md:block space-y-3">
                      <div className="text-xs text-slate-500 mb-1">
                        Select your primary curriculum or board. Groups are organized by region.
                      </div>
                      <div className="max-h-80 overflow-y-auto pr-1 space-y-3 rounded-xl border border-slate-200 bg-white/80 p-3">
                        {SCHOOL_TYPE_GROUPS.map((group) => (
                          <div key={group.id} className="border border-slate-100 rounded-lg bg-slate-50/70">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                {group.label}
                              </span>
                            </div>
                            <div className="px-3 py-2 flex flex-wrap gap-2">
                              {group.options.map((opt) => {
                                const isSelected = selectedSchoolType === opt.value
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setValue('school_type', opt.value, { shouldValidate: true })}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                                      ${isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-400'}
                                    `}
                                  >
                                    {opt.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.school_type && (
                        <p className="text-red-500 text-xs mt-1">{errors.school_type.message}</p>
                      )}
                    </div>

                    {/* Mobile: compact select (unchanged behavior) */}
                    <div className="md:hidden">
                      <select
                        {...register('school_type')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
                      >
                        {SCHOOL_TYPE_GROUPS.map((group) => (
                          <optgroup key={group.id} label={group.label}>
                            {group.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {errors.school_type && (
                        <p className="text-red-500 text-xs mt-1">{errors.school_type.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Established Year
                    </label>
                    <input
                      {...register('established_year', { valueAsNumber: true })}
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. 1985"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District Name
                    </label>
                    <input
                      {...register('district_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="School district name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accreditation Body
                    </label>
                    <input
                      {...register('accreditation_body')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. AdvancED, WASC"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Step 2: Contact & Address */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Contact Information & Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Email *
                    </label>
                    <input
                      {...register('primary_email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="school@example.com"
                    />
                    {errors.primary_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.primary_email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Email
                    </label>
                    <input
                      {...register('secondary_email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Phone *
                    </label>
                    <input
                      {...register('primary_phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                    {errors.primary_phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.primary_phone.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Phone
                    </label>
                    <input
                      {...register('secondary_phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4568"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax Number
                    </label>
                    <input
                      {...register('fax_number')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4569"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    {...register('website_url')}
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.schoolname.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    {...register('street_address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Education Street"
                  />
                  {errors.street_address && (
                    <p className="text-red-500 text-sm mt-1">{errors.street_address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      {...register('city')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province *
                    </label>
                    <input
                      {...register('state_province')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State"
                    />
                    {errors.state_province && (
                      <p className="text-red-500 text-sm mt-1">{errors.state_province.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <input
                      {...register('postal_code')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12345"
                    />
                    {errors.postal_code && (
                      <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      {...register('country')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="United States"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Step 3: Schedule & Hours */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  School Schedule & Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">School Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School Start Time *
                      </label>
                      <input
                        {...register('school_start_time')}
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School End Time *
                      </label>
                      <input
                        {...register('school_end_time')}
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Office Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Office Start Time *
                      </label>
                      <input
                        {...register('office_start_time')}
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Office End Time *
                      </label>
                      <input
                        {...register('office_end_time')}
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Lunch Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lunch Start Time *
                      </label>
                      <input
                        {...register('lunch_start_time')}
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lunch End Time *
                      </label>
                      <input
                        {...register('lunch_end_time')}
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Operating Days</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'operates_monday', label: 'Monday' },
                      { key: 'operates_tuesday', label: 'Tuesday' },
                      { key: 'operates_wednesday', label: 'Wednesday' },
                      { key: 'operates_thursday', label: 'Thursday' },
                      { key: 'operates_friday', label: 'Friday' },
                      { key: 'operates_saturday', label: 'Saturday' },
                      { key: 'operates_sunday', label: 'Sunday' }
                    ].map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <input
                          {...register(day.key as keyof SetupFormData)}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-700">{day.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Academic Year</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year Start
                      </label>
                      <input
                        {...register('academic_year_start')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year End
                      </label>
                      <input
                        {...register('academic_year_end')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Step 4: Academic Details */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Academic Information & Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">School Population</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Students *
                      </label>
                      <input
                        {...register('total_students', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Teachers *
                      </label>
                      <input
                        {...register('total_teachers', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Staff
                      </label>
                      <input
                        {...register('total_staff', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Levels Offered
                  </label>
                  <input
                    {...register('grade_levels_offered')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. K, 1, 2, 3, 4, 5 (comma separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter grade levels separated by commas</p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Step 5: Emergency Contacts */}
          {currentStep === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    Emergency Contacts & Safety
                  </CardTitle>
                  <p className="text-slate-600 mt-2">Configure emergency contacts and safety information for your school</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6 lg:p-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Primary Emergency Contact</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Emergency Contact Name *
                        </label>
                        <input
                          {...register('emergency_contact_name')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="Primary emergency contact"
                        />
                        {errors.emergency_contact_name && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <span className="w-4 h-4 text-red-500">⚠</span>
                            {errors.emergency_contact_name.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Emergency Contact Phone *
                        </label>
                        <input
                          {...register('emergency_contact_phone')}
                          type="tel"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="(555) 123-4567"
                        />
                        {errors.emergency_contact_phone && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <span className="w-4 h-4 text-red-500">⚠</span>
                            {errors.emergency_contact_phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Emergency Services</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Police Contact
                        </label>
                        <input
                          {...register('police_contact')}
                          type="tel"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="911 or local number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Fire Department
                        </label>
                        <input
                          {...register('fire_department_contact')}
                          type="tel"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="911 or local number"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Hospital Contact
                        </label>
                        <input
                          {...register('hospital_contact')}
                          type="tel"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="Hospital emergency line"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Internal Extensions</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          School Nurse Extension
                        </label>
                        <input
                          {...register('school_nurse_extension')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="123"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Security Extension
                        </label>
                        <input
                          {...register('security_extension')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="456"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: School Culture */}
          {currentStep === 6 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    School Culture & Identity
                  </CardTitle>
                  <p className="text-slate-600 mt-2">Define your school's mission, vision, and cultural identity</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6 lg:p-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      School Motto
                    </label>
                    <input
                      {...register('school_motto')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                      placeholder="e.g., Excellence in Education"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      School Mission
                    </label>
                    <textarea
                      {...register('school_mission')}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                      placeholder="Describe your school's mission and purpose..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      School Vision
                    </label>
                    <textarea
                      {...register('school_vision')}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                      placeholder="Describe your school's vision for the future..."
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Accreditation Body
                      </label>
                      <input
                        {...register('accreditation_body')}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                        placeholder="e.g., AdvancED, WASC"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        District Name
                      </label>
                      <input
                        {...register('district_name')}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                        placeholder="School district name"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 7: Programs & Facilities */}
          {currentStep === 7 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    Programs & Facilities
                  </CardTitle>
                  <p className="text-slate-600 mt-2">Configure your school's programs, activities, and facilities</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6 lg:p-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Academic Programs</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Special Programs
                        </label>
                        <textarea
                          {...register('special_programs')}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="e.g., STEM Program, Advanced Placement, Gifted Education..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Extracurricular Activities
                        </label>
                        <textarea
                          {...register('extracurricular_activities')}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="e.g., Drama Club, Debate Team, Student Council, Band..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Sports Programs
                        </label>
                        <textarea
                          {...register('sports_programs')}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="e.g., Basketball, Soccer, Track & Field, Swimming..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Transportation</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          {...register('bus_service_available')}
                          type="checkbox"
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <label className="text-sm font-medium text-slate-700">
                          Bus service available
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Pickup Zones
                        </label>
                        <textarea
                          {...register('pickup_zones')}
                          rows={2}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="List pickup zones and areas served..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">School Facilities</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { key: 'has_library', label: 'Library' },
                        { key: 'has_gymnasium', label: 'Gymnasium' },
                        { key: 'has_cafeteria', label: 'Cafeteria' },
                        { key: 'has_computer_lab', label: 'Computer Lab' },
                        { key: 'has_science_lab', label: 'Science Lab' },
                        { key: 'has_art_room', label: 'Art Room' },
                        { key: 'has_music_room', label: 'Music Room' }
                      ].map((facility) => (
                        <div key={facility.key} className="flex items-center space-x-2">
                          <input
                            {...register(facility.key as keyof SetupFormData)}
                            type="checkbox"
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <label className="text-sm text-slate-700">{facility.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 8: Social Media & Final */}
          {currentStep === 8 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    Social Media & Final Setup
                  </CardTitle>
                  <p className="text-slate-600 mt-2">Connect your social media accounts and complete the setup</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6 lg:p-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Social Media Presence</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Facebook URL
                        </label>
                        <input
                          {...register('facebook_url')}
                          type="url"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="https://facebook.com/yourschool"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Twitter URL
                        </label>
                        <input
                          {...register('twitter_url')}
                          type="url"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="https://twitter.com/yourschool"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Instagram URL
                        </label>
                        <input
                          {...register('instagram_url')}
                          type="url"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="https://instagram.com/yourschool"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          LinkedIn URL
                        </label>
                        <input
                          {...register('linkedin_url')}
                          type="url"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-800 placeholder-slate-400"
                          placeholder="https://linkedin.com/company/yourschool"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                          Ready to Complete Setup!
                        </h3>
                        <p className="text-green-700 text-sm leading-relaxed">
                          You're about to complete your school setup. This will save all your information 
                          and make it available throughout the Catalyst platform. You can always update 
                          these details later from your admin dashboard.
                        </p>
                        <div className="mt-4 flex items-center space-x-4 text-xs text-green-600">
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            School Information
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Contact Details
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Schedule & Programs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Navigation */}
          <motion.div 
            className="mt-6 sm:mt-8 lg:mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Mobile Navigation */}
            <div className="block sm:hidden space-y-3">
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl shadow-lg"
                >
                  Continue to Next Step <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl shadow-lg"
                >
                  {isLoading ? (
                    'Saving Setup...'
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-50 py-2 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex-1 flex items-center justify-center bg-slate-100 rounded-xl py-2">
                  <span className="text-sm font-medium text-slate-600">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:block">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 overflow-hidden">
                <div className="flex items-center">
                  {/* Previous Button */}
                  <div className="flex-shrink-0 p-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      className="flex items-center space-x-2 px-4 py-2 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden lg:inline">Previous</span>
                    </Button>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="flex-1 px-4 py-4 bg-gradient-to-r from-slate-50 to-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{steps[currentStep - 1]?.title}</span>
                        <div className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 lg:w-32 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium text-slate-600 min-w-[3rem]">
                          {Math.round((currentStep / totalSteps) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Next/Complete Button */}
                  <div className="flex-shrink-0 p-4">
                    {currentStep < totalSteps ? (
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
                      >
                        <span className="hidden lg:inline">Next Step</span>
                        <span className="lg:hidden">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Complete'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}

export default function SchoolSetupPage() {
  return (
    <UnifiedAuthGuard requiredRole="admin">
      <SchoolSetupContent />
    </UnifiedAuthGuard>
  )
}
