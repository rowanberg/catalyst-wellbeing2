/**
 * Secure Database Service Layer
 * This service handles all database operations that require elevated permissions
 * Service role key is only used server-side and never exposed to client
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cache } from 'react'

// Types
interface DatabaseServiceConfig {
  enableAuditLog?: boolean
  enableCache?: boolean
  cacheTimeout?: number
}

interface AuditLogEntry {
  action: string
  user_id: string
  resource: string
  details?: Record<string, any>
  ip_address?: string
  timestamp: string
}

// Environment validation
function validateEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing required Supabase environment variables')
  }
  
  if (url.includes('your-project-ref') || serviceKey.includes('your_supabase')) {
    throw new Error('Supabase credentials appear to be placeholder values')
  }
  
  return { url, serviceKey }
}

/**
 * Secure Database Service
 * All admin operations should go through this service
 */
export class DatabaseService {
  private static instance: DatabaseService | null = null
  private adminClient: ReturnType<typeof createClient> | null = null
  private config: DatabaseServiceConfig
  
  private constructor(config: DatabaseServiceConfig = {}) {
    this.config = {
      enableAuditLog: true,
      enableCache: true,
      cacheTimeout: 300, // 5 minutes
      ...config
    }
  }
  
  static getInstance(config?: DatabaseServiceConfig): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(config)
    }
    return DatabaseService.instance
  }
  
  /**
   * Get admin client - only for server-side use
   * This bypasses RLS but logs all operations
   */
  private getAdminClient() {
    if (!this.adminClient) {
      const { url, serviceKey } = validateEnvironment()
      this.adminClient = createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    return this.adminClient
  }
  
  /**
   * Get user client with proper authentication
   * This respects RLS policies
   */
  async getUserClient() {
    const cookieStore = await cookies()
    const { url } = validateEnvironment()
    
    return createServerClient(
      url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
  }
  
  /**
   * Log audit trail for admin operations
   */
  private async logAudit(entry: AuditLogEntry) {
    if (!this.config.enableAuditLog) return
    
    try {
      const client = this.getAdminClient()
      await client.from('audit_logs').insert({
        ...entry,
        created_at: new Date().toISOString()
      } as any)
    } catch (error) {
      console.error('Failed to log audit entry:', error)
      // Don't throw - audit logging should not break operations
    }
  }
  
  /**
   * Verify user has required role
   */
  async verifyUserRole(userId: string, requiredRole: string): Promise<boolean> {
    const client = this.getAdminClient()
    
    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) return false
    return (data as any).role === requiredRole
  }
  
  /**
   * Get user profile with proper access control
   */
  async getUserProfile(userId: string, requesterId: string) {
    // Check if requester can access this profile
    const canAccess = await this.canAccessProfile(requesterId, userId)
    if (!canAccess) {
      throw new Error('Access denied')
    }
    
    const client = this.getAdminClient()
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    
    // Log the access
    await this.logAudit({
      action: 'profile_access',
      user_id: requesterId,
      resource: `profile:${userId}`,
      timestamp: new Date().toISOString()
    })
    
    return data
  }
  
  /**
   * Check if user can access another user's profile
   */
  private async canAccessProfile(requesterId: string, targetUserId: string): Promise<boolean> {
    // User can always access their own profile
    if (requesterId === targetUserId) return true
    
    const client = this.getAdminClient()
    
    // Get requester's profile
    const { data: requester } = await client
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', requesterId)
      .single()
    
    if (!requester) return false
    
    // Admins can access profiles in their school
    if ((requester as any).role === 'admin') {
      const { data: target } = await client
        .from('profiles')
        .select('school_id')
        .eq('user_id', targetUserId)
        .single()
      
      return (target as any)?.school_id === (requester as any).school_id
    }
    
    // Teachers can access student profiles in their classes
    if ((requester as any).role === 'teacher') {
      const { data: classes } = await client
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', requesterId)
      
      if (!classes || classes.length === 0) return false
      
      const classIds = (classes as any[]).map((c: any) => c.class_id)
      const { data: student } = await client
        .from('profiles')
        .select('class_id')
        .eq('user_id', targetUserId)
        .eq('role', 'student')
        .single()
      
      return Boolean(student && classIds.includes((student as any).class_id))
    }
    
    // Parents can access their children's profiles
    if ((requester as any).role === 'parent') {
      const { data: relationship } = await client
        .from('parent_child_relationships')
        .select('*')
        .eq('parent_id', requesterId)
        .eq('child_id', targetUserId)
        .single()
      
      return !!relationship
    }
    
    return false
  }
  
  /**
   * Update user profile with audit logging
   */
  async updateUserProfile(
    userId: string,
    requesterId: string,
    updates: Record<string, any>
  ) {
    // Verify permission
    const canUpdate = await this.canUpdateProfile(requesterId, userId)
    if (!canUpdate) {
      throw new Error('Permission denied')
    }
    
    // Sanitize updates - remove sensitive fields
    const sanitizedUpdates = { ...updates }
    delete sanitizedUpdates.user_id
    delete sanitizedUpdates.role // Role changes need special permission
    delete sanitizedUpdates.school_id // School changes need special permission
    
    const client = this.getAdminClient()
    const { data, error } = await (client
      .from('profiles') as any)
      .update(sanitizedUpdates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    // Log the update
    await this.logAudit({
      action: 'profile_update',
      user_id: requesterId,
      resource: `profile:${userId}`,
      details: { updates: Object.keys(sanitizedUpdates) },
      timestamp: new Date().toISOString()
    })
    
    return data
  }
  
  /**
   * Check if user can update another user's profile
   */
  private async canUpdateProfile(requesterId: string, targetUserId: string): Promise<boolean> {
    // Users can update their own profile (with restrictions)
    if (requesterId === targetUserId) return true
    
    const client = this.getAdminClient()
    const { data: requester } = await client
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', requesterId)
      .single()
    
    if (!requester) return false
    
    // Only admins can update other profiles
    if ((requester as any).role !== 'admin') return false
    
    // Admins can only update profiles in their school
    const { data: target } = await client
      .from('profiles')
      .select('school_id')
      .eq('user_id', targetUserId)
      .single()
    
    return (target as any)?.school_id === (requester as any).school_id
  }
  
  /**
   * Get school data with proper access control
   */
  async getSchoolData(schoolId: string, requesterId: string) {
    // Verify requester belongs to this school
    const client = this.getAdminClient()
    const { data: profile } = await client
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', requesterId)
      .single()
    
    if (!profile || (profile as any).school_id !== schoolId) {
      throw new Error('Access denied')
    }
    
    const { data: school, error } = await client
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()
    
    if (error) throw error
    
    // Log the access
    await this.logAudit({
      action: 'school_access',
      user_id: requesterId,
      resource: `school:${schoolId}`,
      timestamp: new Date().toISOString()
    })
    
    return school
  }
  
  /**
   * Execute admin operation with full audit trail
   */
  async executeAdminOperation<T>(
    operation: string,
    requesterId: string,
    callback: (client: ReturnType<typeof createClient>) => Promise<T>
  ): Promise<T> {
    // Verify user is admin
    const isAdmin = await this.verifyUserRole(requesterId, 'admin')
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
    
    const startTime = Date.now()
    const client = this.getAdminClient()
    
    try {
      const result = await callback(client)
      
      // Log successful operation
      await this.logAudit({
        action: `admin_operation:${operation}`,
        user_id: requesterId,
        resource: operation,
        details: { 
          success: true,
          duration_ms: Date.now() - startTime
        },
        timestamp: new Date().toISOString()
      })
      
      return result
    } catch (error) {
      // Log failed operation
      await this.logAudit({
        action: `admin_operation:${operation}`,
        user_id: requesterId,
        resource: operation,
        details: { 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime
        },
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance()

// Export cached functions for Next.js
export const getCachedUserProfile = cache(async (userId: string, requesterId: string) => {
  return databaseService.getUserProfile(userId, requesterId)
})

export const getCachedSchoolData = cache(async (schoolId: string, requesterId: string) => {
  return databaseService.getSchoolData(schoolId, requesterId)
})
