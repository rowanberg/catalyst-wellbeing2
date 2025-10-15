/**
 * Zod Validation Schemas for API Endpoints
 * Provides type-safe input validation across all API routes
 */

import { z } from 'zod'

// ============================================================================
// Common Schemas
// ============================================================================

export const UUIDSchema = z.string().uuid('Invalid UUID format')

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// ============================================================================
// Parent Dashboard Schemas
// ============================================================================

export const ParentDashboardQuerySchema = z.object({
  student_id: UUIDSchema
})

export const ParentCommunityFeedQuerySchema = z.object({
  student_id: UUIDSchema,
  post_type: z.enum(['announcement', 'achievement', 'event', 'resource', 'update']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})

export const ParentLinkChildSchema = z.object({
  child_email: z.string().email('Invalid email address'),
  relationship: z.enum(['mother', 'father', 'guardian', 'other']).optional()
})

// ============================================================================
// Student Wallet Schemas
// ============================================================================

export const WalletTransactionSchema = z.object({
  toAddress: z.string().min(10).max(100).optional(),
  toStudentTag: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid student tag format').optional(),
  amount: z.number().positive().finite(),
  currencyType: z.enum(['mind_gems', 'fluxon']),
  memo: z.string().max(200).optional(),
  password: z.string().min(1),
  requestId: z.string().optional()
}).refine((data) => data.toAddress || data.toStudentTag, {
  message: 'Either toAddress or toStudentTag must be provided'
}).refine((data) => {
  const maxLimits = { mind_gems: 10000, fluxon: 1000 }
  return data.amount <= maxLimits[data.currencyType]
}, {
  message: 'Amount exceeds maximum transaction limit'
})

// ============================================================================
// Teacher Schemas
// ============================================================================

export const CreateAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  subject: z.string().min(1).max(100),
  class_id: UUIDSchema,
  assessment_type: z.enum(['exam', 'quiz', 'homework', 'project', 'participation']),
  due_date: z.string().datetime(),
  total_points: z.number().int().positive().max(1000),
  weight: z.number().min(0).max(100).default(1)
})

export const GradeEntrySchema = z.object({
  student_id: UUIDSchema,
  assessment_id: UUIDSchema,
  score: z.number().min(0).max(1000),
  feedback: z.string().max(1000).optional(),
  late_submission: z.boolean().default(false)
})

export const AttendanceRecordSchema = z.object({
  student_id: UUIDSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional()
})

export const CreateCommunityPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  post_type: z.enum(['announcement', 'achievement', 'event', 'resource', 'update']),
  visibility: z.enum(['all_parents', 'class_parents', 'specific_parents']),
  class_id: UUIDSchema.optional(),
  target_parent_ids: z.array(UUIDSchema).max(100).optional(),
  is_pinned: z.boolean().default(false)
})

// ============================================================================
// File Upload Schemas
// ============================================================================

export const FileUploadMetadataSchema = z.object({
  filename: z.string().min(1).max(255)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid filename characters'),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
  mimeType: z.enum([
    'image/jpeg',
    'image/png', 
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
})

// ============================================================================
// Search & Filter Schemas
// ============================================================================

export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(100).trim(),
  type: z.enum(['students', 'teachers', 'classes', 'assessments']).optional()
})

export const StudentFilterSchema = z.object({
  grade_level: z.coerce.number().int().min(1).max(12).optional(),
  class_id: UUIDSchema.optional(),
  school_id: UUIDSchema.optional(),
  search: z.string().max(100).optional()
})

// ============================================================================
// Admin Schemas
// ============================================================================

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  role: z.enum(['admin', 'teacher', 'student', 'parent']),
  school_id: UUIDSchema,
  grade_level: z.number().int().min(1).max(12).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional()
})

export const UpdateSchoolSettingsSchema = z.object({
  school_name: z.string().min(1).max(200).optional(),
  timezone: z.string().max(50).optional(),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Invalid academic year format').optional(),
  settings: z.record(z.unknown()).optional()
})

// ============================================================================
// Safety & Wellbeing Schemas
// ============================================================================

export const CreateIncidentReportSchema = z.object({
  student_id: UUIDSchema,
  incident_type: z.enum(['bullying', 'fight', 'safety', 'behavior', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(10).max(2000),
  location: z.string().max(200).optional(),
  witnesses: z.array(UUIDSchema).max(10).optional(),
  action_taken: z.string().max(1000).optional()
})

export const MoodTrackingSchema = z.object({
  mood: z.enum(['happy', 'sad', 'anxious', 'angry', 'calm', 'excited']),
  energy: z.number().int().min(1).max(10),
  stress: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional()
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates request body against schema
 * Throws detailed error if validation fails
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      throw new ValidationError('Invalid request data', formattedErrors)
    }
    throw error
  }
}

/**
 * Validates query parameters against schema
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      throw new ValidationError('Invalid query parameters', formattedErrors)
    }
    throw error
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// XSS Sanitization
// ============================================================================

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes all HTML tags except safe ones
 */
export function sanitizeUserInput(input: string, allowHtml = false): string {
  if (!input) return ''
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  if (!allowHtml) {
    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }
  
  // Remove potentially dangerous patterns
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script/gi, '')
    .replace(/<iframe/gi, '')
    
  return sanitized.trim()
}

/**
 * Sanitizes HTML content for safe rendering
 * Only allows specific safe tags
 */
export function sanitizeHtmlContent(html: string): string {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
  const allowedAttributes = ['href', 'title']
  
  // This is a basic sanitizer - in production use DOMPurify
  let sanitized = html
  
  // Remove all tags except allowed ones
  sanitized = sanitized.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
    if (!allowedTags.includes(tag.toLowerCase())) {
      return ''
    }
    
    // Filter attributes
    const safeAttrs = attrs.replace(/(\w+)="([^"]*)"/g, (m: string, attr: string, value: string) => {
      if (allowedAttributes.includes(attr.toLowerCase()) && !value.includes('javascript:')) {
        return `${attr}="${value}"`
      }
      return ''
    })
    
    return `<${tag}${safeAttrs}>`
  })
  
  return sanitized
}
