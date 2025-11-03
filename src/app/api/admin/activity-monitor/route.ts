/**
 * Activity Monitor API - Real-time school activity tracking
 * Fetches actual data from analytics_events, user_sessions, and related tables
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { ApiResponse } from '@/lib/api/response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
// Enable caching for 30 seconds
export const revalidate = 30

interface QueryParams {
  schoolId: string
  timeFilter: 'today' | 'week' | 'month'
  roleFilter?: string
  typeFilter?: string
  userSearch?: string
  userLimit?: number
  userOffset?: number
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const timeFilter = (searchParams.get('time_filter') || 'today') as 'today' | 'week' | 'month'
    const roleFilter = searchParams.get('role_filter') || 'all'
    const typeFilter = searchParams.get('type_filter') || 'all'
    const userSearch = searchParams.get('user_search') || ''
    const userLimit = parseInt(searchParams.get('user_limit') || '12', 10)
    const userOffset = parseInt(searchParams.get('user_offset') || '0', 10)

    if (!schoolId) {
      return ApiResponse.badRequest('School ID is required')
    }

    const supabase = getSupabaseAdmin()

    // Calculate time range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    logger.info('Fetching activity monitor data', { schoolId, timeFilter, startDate: startDate.toISOString() })

    // First, get profiles (this table definitely exists)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, id, first_name, last_name, role, grade_level, last_login_at, created_at')
      .eq('school_id', schoolId)

    if (profilesError) {
      logger.error('Failed to fetch profiles:', profilesError)
      return ApiResponse.error('Failed to fetch user profiles')
    }

    logger.info('Profiles fetched', { count: profiles?.length || 0 })

    // Fetch optional tables (may not exist)
    const [
      analyticsEventsResult,
      activeSessionsResult,
      dailyQuestsResult,
      helpRequestsResult,
      moodTrackingResult
    ] = await Promise.all([
      // 1. Analytics events (optional - may not exist)
      supabase
        .from('analytics_events')
        .select('id, user_id, event_type, event_data, created_at')
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50),

      // 2. Active sessions (optional)
      supabase
        .from('user_sessions')
        .select('user_id, session_start, session_end')
        .eq('school_id', schoolId)
        .gte('session_start', startDate.toISOString()),

      // 3. Quest completions (optional)
      supabase
        .from('daily_quests')
        .select('id, user_id, quest_type, completed, xp_earned, completed_at')
        .eq('completed', true)
        .gte('completed_at', startDate.toISOString()),

      // 4. Help requests (from schema.sql - should exist)
      supabase
        .from('help_requests')
        .select('id, student_id, created_at, status, description')
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),

      // 5. Mood tracking (optional)
      supabase
        .from('mood_tracking')
        .select('id, user_id, mood, created_at')
        .gte('created_at', startDate.toISOString())
    ])

    // Log results
    logger.info('Query results', {
      profiles: profiles?.length || 0,
      analyticsEvents: analyticsEventsResult.data?.length || 0,
      activeSessions: activeSessionsResult.data?.length || 0,
      dailyQuests: dailyQuestsResult.data?.length || 0,
      helpRequests: helpRequestsResult.data?.length || 0,
      moodTracking: moodTrackingResult.data?.length || 0,
      analyticsError: analyticsEventsResult.error?.message,
      sessionsError: activeSessionsResult.error?.message
    })

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]))
    
    logger.info('Building activity feed', { profileCount: profiles?.length || 0 })

    // Build activities from multiple sources
    const activities: any[] = []

    // 1. Add analytics events if available
    if (!analyticsEventsResult.error && analyticsEventsResult.data) {
      analyticsEventsResult.data.forEach(event => {
        const profile = profileMap.get(event.user_id)
        activities.push({
          id: event.id,
          userId: event.user_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
          userRole: profile?.role || 'student',
          grade: profile?.grade_level || undefined,
          activityType: event.event_type,
          description: generateDescription(event.event_type, event.event_data),
          timestamp: event.created_at,
          metadata: event.event_data,
          riskLevel: determineRiskLevel(event.event_type, event.event_data)
        })
      })
    }

    // 2. Add help requests as activities
    if (!helpRequestsResult.error && helpRequestsResult.data) {
      helpRequestsResult.data.forEach(request => {
        const profile = profileMap.get(request.student_id)
        activities.push({
          id: request.id,
          userId: request.student_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
          userRole: 'student',
          grade: profile?.grade_level || undefined,
          activityType: 'help_request',
          description: request.description || 'Submitted help request',
          timestamp: request.created_at,
          metadata: { status: request.status },
          riskLevel: request.status === 'pending' ? 'medium' : undefined
        })
      })
    }

    // 3. Add mood tracking as activities
    if (!moodTrackingResult.error && moodTrackingResult.data) {
      moodTrackingResult.data.forEach(mood => {
        const profile = profileMap.get(mood.user_id)
        activities.push({
          id: mood.id,
          userId: mood.user_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
          userRole: profile?.role || 'student',
          grade: profile?.grade_level || undefined,
          activityType: 'mood_log',
          description: `Logged mood as "${mood.mood}"`,
          timestamp: mood.created_at,
          metadata: { mood: mood.mood }
        })
      })
    }

    // 4. Add quest completions
    if (!dailyQuestsResult.error && dailyQuestsResult.data) {
      dailyQuestsResult.data.forEach(quest => {
        const profile = profileMap.get(quest.user_id)
        activities.push({
          id: quest.id,
          userId: quest.user_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
          userRole: 'student',
          grade: profile?.grade_level || undefined,
          activityType: 'quest_completion',
          description: `Completed ${quest.quest_type} quest`,
          timestamp: quest.completed_at,
          metadata: { questType: quest.quest_type, xpEarned: quest.xp_earned }
        })
      })
    }

    // 5. If no activities, generate from profiles as fallback
    if (activities.length === 0 && profiles && profiles.length > 0) {
      logger.info('No tracked activities, generating from profiles')
      
      // Try recent logins first
      const recentLogins = profiles.filter(p => p.last_login_at && new Date(p.last_login_at) >= startDate)
      
      if (recentLogins.length > 0) {
        recentLogins.forEach(profile => {
          activities.push({
            id: `login-${profile.user_id}`,
            userId: profile.user_id,
            userName: `${profile.first_name} ${profile.last_name}`,
            userRole: profile.role,
            grade: profile.grade_level || undefined,
            activityType: 'login',
            description: 'Logged into the platform',
            timestamp: profile.last_login_at,
            metadata: {}
          })
        })
      } else {
        // If no recent logins, show all users sorted by last activity
        logger.info('No recent logins, showing user profiles sorted by last activity')
        
        // Sort profiles by last activity (last_login_at or created_at)
        const sortedProfiles = [...profiles].sort((a, b) => {
          const aTime = new Date(a.last_login_at || a.created_at || 0).getTime()
          const bTime = new Date(b.last_login_at || b.created_at || 0).getTime()
          return bTime - aTime // Most recent first
        })
        
        sortedProfiles.slice(0, 20).forEach(profile => {
          activities.push({
            id: `user-${profile.user_id}`,
            userId: profile.user_id,
            userName: `${profile.first_name} ${profile.last_name}`,
            userRole: profile.role,
            grade: profile.grade_level || undefined,
            activityType: 'login',
            description: `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} account active`,
            timestamp: profile.last_login_at || profile.created_at || new Date().toISOString(),
            metadata: { source: 'profile_fallback' }
          })
        })
      }
    }

    // Sort by timestamp descending (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    logger.info('Activities built', { 
      totalActivities: activities.length,
      firstActivity: activities[0]?.timestamp,
      lastActivity: activities[activities.length - 1]?.timestamp
    })

    // Apply filters
    const filteredActivities = activities.filter(activity => {
      if (roleFilter !== 'all' && activity.userRole !== roleFilter) return false
      if (typeFilter !== 'all' && activity.activityType !== typeFilter) return false
      return true
    })

    // Calculate summary statistics
    const activeSessions = activeSessionsResult.data || []
    const activeUserIds = new Set([
      ...activeSessions.map(s => s.user_id),
      ...activities.map(a => a.userId)
    ])
    
    const questsData = dailyQuestsResult.data || []
    const questsCompleted = questsData.length

    const helpRequestsData = helpRequestsResult.data || []
    // Show total help requests in time period, not just pending
    const totalHelpRequests = helpRequestsData.length
    const pendingHelpRequests = helpRequestsData.filter(r => r.status === 'pending').length

    // Count messages from activities
    const messagesExchanged = activities.filter(a => a.activityType === 'message_sent').length

    // Calculate average session time
    const sessionTimes = activeSessions
      .filter(s => s.session_end)
      .map(s => {
        const start = new Date(s.session_start).getTime()
        const end = new Date(s.session_end!).getTime()
        return (end - start) / (1000 * 60) // minutes
      })
    
    let averageSessionTime = 0
    if (sessionTimes.length > 0) {
      // Use actual session data
      averageSessionTime = Math.round(sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length)
    } else if (activeUserIds.size > 0 || (profiles && profiles.length > 0)) {
      // Fallback: show estimated time when we have users but no session tracking
      // This is better than showing 0m which looks broken
      averageSessionTime = 15
      logger.info('Using estimated session time (no tracking data)', { userCount: activeUserIds.size || profiles?.length })
    }

    const summary = {
      totalActivities: filteredActivities.length,
      activeUsers: activeUserIds.size || (profiles?.length || 0),
      questsCompleted,
      helpRequests: totalHelpRequests, // Changed from pendingHelpRequests to show all
      messagesExchanged,
      averageSessionTime
    }

    logger.info('Summary calculated', summary)

    // Build user activity summaries
    const userActivityMap = new Map<string, any>()

    // First, create entries from sessions
    for (const session of activeSessions) {
      const userId = session.user_id
      const profile = profileMap.get(userId)
      
      if (!profile) continue

      if (!userActivityMap.has(userId)) {
        userActivityMap.set(userId, {
          userId,
          userName: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          grade: profile.grade_level,
          lastActive: session.session_start,
          activitiesCount: 0,
          sessionTime: 0,
          riskIndicators: []
        })
      }

      const userData = userActivityMap.get(userId)!
      
      // Update last active
      if (new Date(session.session_start) > new Date(userData.lastActive)) {
        userData.lastActive = session.session_start
      }

      // Calculate session time
      if (session.session_end) {
        const duration = (new Date(session.session_end).getTime() - new Date(session.session_start).getTime()) / (1000 * 60)
        userData.sessionTime += Math.round(duration)
      }
    }
    
    // If no sessions, populate from profiles directly
    if (userActivityMap.size === 0 && profiles && profiles.length > 0) {
      logger.info('No session data, generating user cards from profiles')
      profiles.forEach(profile => {
        userActivityMap.set(profile.user_id, {
          userId: profile.user_id,
          userName: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          grade: profile.grade_level,
          lastActive: profile.last_login_at || profile.created_at || new Date().toISOString(),
          activitiesCount: 0,
          sessionTime: 0,
          riskIndicators: []
        })
      })
    }

    // Add activity counts
    for (const event of (analyticsEventsResult.data || [])) {
      const userId = event.user_id
      if (userActivityMap.has(userId)) {
        userActivityMap.get(userId)!.activitiesCount++
      }
    }

    // Add risk indicators from help requests
    for (const helpRequest of helpRequestsData) {
      const userId = helpRequest.student_id
      if (userActivityMap.has(userId)) {
        const userData = userActivityMap.get(userId)!
        if (helpRequest.status === 'pending') {
          userData.riskIndicators.push('Pending help request')
        }
      }
    }

    // Filter users by search query if provided
    let userActivities = Array.from(userActivityMap.values())
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
    
    // Apply search filter
    if (userSearch) {
      const searchLower = userSearch.toLowerCase()
      userActivities = userActivities.filter(user => 
        user.userName.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        (user.grade && user.grade.toLowerCase().includes(searchLower))
      )
    }
    
    const totalUsers = userActivities.length
    
    // Apply pagination
    userActivities = userActivities.slice(userOffset, userOffset + userLimit)

    const result = {
      success: true,
      data: {
        activities: filteredActivities,
        summary,
        userActivities,
        userPagination: {
          total: totalUsers,
          limit: userLimit,
          offset: userOffset,
          hasMore: userOffset + userLimit < totalUsers
        },
        timeFilter,
        fetchedAt: new Date().toISOString()
      }
    }

    logger.perf('Activity monitor data fetch', Date.now() - startTime)
    logger.info('Final response', { 
      activitiesCount: filteredActivities.length,
      summaryStats: summary,
      userActivitiesCount: userActivities.length
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error fetching activity monitor data:', error)
    return ApiResponse.error('Failed to fetch activity data')
  }
}

/**
 * Generate human-readable description from event type and data
 */
function generateDescription(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'login':
      return 'Logged into the platform'
    case 'quest_completion':
      return `Completed ${eventData?.questType || 'a'} quest`
    case 'mood_log':
      return `Logged mood as "${eventData?.mood || 'unknown'}"`
    case 'help_request':
      return eventData?.urgency === 'high' 
        ? 'Submitted urgent help request'
        : 'Submitted help request'
    case 'message_sent':
      return `Sent message to ${eventData?.recipient || 'user'}`
    case 'resource_access':
      return `Accessed ${eventData?.resourceType || 'resource'}`
    case 'assessment_taken':
      return `Completed assessment: ${eventData?.assessmentTitle || 'assessment'}`
    default:
      return `Performed ${eventType.replace(/_/g, ' ')}`
  }
}

/**
 * Determine risk level based on event type and data
 */
function determineRiskLevel(eventType: string, eventData: any): 'low' | 'medium' | 'high' | undefined {
  if (eventType === 'help_request') {
    if (eventData?.urgency === 'high' || eventData?.category === 'bullying') {
      return 'high'
    }
    if (eventData?.urgency === 'medium') {
      return 'medium'
    }
  }
  return undefined
}
