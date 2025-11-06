/**
 * Parent Settings API
 * GET /api/v1/parents/settings
 * PUT /api/v1/parents/settings
 */
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { 
  getCachedParentSettings, 
  setCachedParentSettings,
  invalidateParentSettings 
} from '@/lib/redis/parent-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')
    
    if (!parentId) {
      return ApiResponse.badRequest('Parent ID is required')
    }

    // Check Redis cache first
    const cachedData = await getCachedParentSettings(parentId)
    if (cachedData) {
      console.log(`🚀 CACHE HIT - Returning cached settings for parent: ${parentId}`)
      return ApiResponse.success(cachedData)
    }
    
    console.log(`💾 CACHE MISS - Fetching fresh settings from database for parent: ${parentId}`)

    const supabase = getSupabaseAdmin()

    // Fetch parent profile with only needed fields
    const { data: parentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, email, phone, avatar_url')
      .eq('id', parentId)
      .single()

    console.log('Parent profile query:', { parentId, parentProfile, profileError })

    if (!parentProfile) {
      return ApiResponse.notFound('Parent profile not found')
    }

    console.log('Querying children with parent user_id:', parentProfile.user_id)

    // Get child relationships first
    const { data: relationships, error: relError } = await supabase
      .from('parent_child_relationships')
      .select('id, child_id')
      .eq('parent_id', parentProfile.user_id)

    console.log('Relationships query:', { relationships, relError })

    // Get child profiles separately
    let childProfiles: any[] = []
    if (relationships && relationships.length > 0) {
      const childUserIds = relationships.map(r => r.child_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, school_id, avatar_url, level, grade_level')
        .in('user_id', childUserIds)
      
      console.log('Child profiles query:', { profiles, profilesError, childUserIds })
      childProfiles = profiles || []
    }

    // Get notification settings
    const { data: notificationSettings } = await supabase
      .from('parent_notifications')
      .select('*')
      .eq('parent_id', parentId)

    // Format notification settings with proper typing
    type NotificationSetting = {
      enabled: boolean
      threshold: number | null
      frequency: 'immediate' | 'daily' | 'weekly'
    }

    type NotificationPrefs = {
      low_grade: NotificationSetting
      missing_assignment: NotificationSetting
      attendance: NotificationSetting
      wellbeing: NotificationSetting
      achievement: NotificationSetting
      weekly_summary: NotificationSetting
    }

    const notificationPrefs: NotificationPrefs = {
      low_grade: {
        enabled: true,
        threshold: 70,
        frequency: 'immediate'
      },
      missing_assignment: {
        enabled: true,
        threshold: null,
        frequency: 'immediate'
      },
      attendance: {
        enabled: true,
        threshold: null,
        frequency: 'immediate'
      },
      wellbeing: {
        enabled: true,
        threshold: null,
        frequency: 'daily'
      },
      achievement: {
        enabled: true,
        threshold: null,
        frequency: 'immediate'
      },
      weekly_summary: {
        enabled: true,
        threshold: null,
        frequency: 'weekly'
      }
    }

    // Override with actual settings if they exist
    notificationSettings?.forEach((setting: any) => {
      const notifType = setting.notification_type as keyof NotificationPrefs
      if (notificationPrefs[notifType]) {
        notificationPrefs[notifType] = {
          enabled: setting.is_enabled,
          threshold: setting.threshold_value,
          frequency: setting.frequency
        }
      }
    })

    const settingsData = {
      profile: {
        id: parentProfile.id,
        userId: parentProfile.user_id,
        firstName: parentProfile.first_name,
        lastName: parentProfile.last_name,
        email: parentProfile.email,
        phone: parentProfile.phone,
        avatarUrl: parentProfile.avatar_url
      },
      children: childProfiles.map((child: any) => ({
        id: child.id,
        name: `${child.first_name || ''} ${child.last_name || ''}`.trim(),
        grade: child.grade_level || (child.level ? `Level ${child.level}` : 'Student'),
        school: 'Unknown School',
        avatarUrl: child.avatar_url || null
      })).filter(c => c.id && c.name),
      notifications: notificationPrefs
    }

    // Cache the result for future requests (15 days TTL with auto-invalidation)
    await setCachedParentSettings(parentId, settingsData)
    console.log(`✅ Cached settings data for parent: ${parentId}`)

    return ApiResponse.success(settingsData)

  } catch (error: any) {
    console.error('Settings GET error:', error)
    return ApiResponse.internalError('Failed to fetch settings')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { parentId, notifications, profile } = body
    
    if (!parentId) {
      return ApiResponse.badRequest('Parent ID is required')
    }

    const supabase = getSupabaseAdmin()

    // Update profile if provided
    if (profile) {
      await supabase
        .from('profiles')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentId)
    }

    // Update notification preferences if provided
    if (notifications) {
      const notificationUpdates = Object.entries(notifications).map(([type, settings]: [string, any]) => ({
        parent_id: parentId,
        notification_type: type,
        is_enabled: settings.enabled,
        threshold_value: settings.threshold,
        frequency: settings.frequency,
        updated_at: new Date().toISOString()
      }))

      await supabase
        .from('parent_notifications')
        .upsert(
          notificationUpdates,
          { onConflict: 'parent_id,notification_type' }
        )
    }

    // Invalidate cache after successful update
    await invalidateParentSettings(parentId)
    console.log(`🗑️ Invalidated cache for parent: ${parentId}`)

    return ApiResponse.success({
      message: 'Settings updated successfully'
    })

  } catch (error: any) {
    console.error('Settings PUT error:', error)
    return ApiResponse.internalError('Failed to update settings')
  }
}
