import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          }
        }
      }
    )
    const { id } = await params
    
    console.log('🔍 PATCH /api/admin/users/[id] - Starting with ID:', id)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role and get school_id
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id) {
      return NextResponse.json({ error: 'Admin school not found' }, { status: 403 })
    }

    const updateData = await request.json()
    
    // Validate and sanitize the update data
    const allowedFields = ['first_name', 'last_name', 'email', 'role', 'grade_level', 'class_name', 'status']
    const sanitizedData: any = {}
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        sanitizedData[key] = value
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Debug: Check what profiles exist in the database for this school
    const { data: schoolProfiles, error: debugError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, school_id')
      .eq('school_id', adminProfile.school_id)
    
    console.log('🔍 Debug - Profiles in admin school:', schoolProfiles)
    console.log('🔍 Debug - Looking for ID:', id)
    console.log('🔍 Debug - Admin school_id:', adminProfile.school_id)

    // Find the user by matching the ID from the frontend (which is the profile.id)
    const targetUser = schoolProfiles?.find(profile => profile.id === id)
    
    console.log('🔍 Found target user:', targetUser)

    if (!targetUser) {
      console.error('User not found in school profiles')
      return NextResponse.json({ 
        error: 'User not found', 
        details: `Could not find user with ID: ${id} in school ${adminProfile.school_id}`,
        debugInfo: { searchId: id, schoolId: adminProfile.school_id, availableProfiles: schoolProfiles?.map(p => p.id) }
      }, { status: 404 })
    }

    console.log('🔍 Target user found:', { 
      searchId: id, 
      foundUser: targetUser, 
      adminSchoolId: adminProfile.school_id,
      updateData: sanitizedData
    })

    // Update user profile using the correct ID
    const updateId = targetUser.id
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('id', updateId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          }
        }
      }
    )
    const { id } = await params
    
    console.log('🗑️ DELETE /api/admin/users/[id] - Starting deletion for ID:', id)
    
    // Check authentication using regular client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role and get school_id using regular client
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id) {
      return NextResponse.json({ error: 'Admin school not found' }, { status: 403 })
    }

    // Find the target user by profile ID or user_id using ADMIN client for proper permissions
    // Try by profile.id first
    let { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, first_name, last_name, role, school_id')
      .eq('id', id)
      .eq('school_id', adminProfile.school_id)
      .single()

    // If not found by profile.id, try by user_id (auth ID)
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found by id, trying user_id...')
      const result = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, first_name, last_name, role, school_id')
        .eq('user_id', id)
        .eq('school_id', adminProfile.school_id)
        .single()
      
      targetProfile = result.data
      profileError = result.error
    }

    if (profileError || !targetProfile) {
      console.error('User not found:', profileError)
      return NextResponse.json({ 
        error: 'User not found',
        details: `Could not find user with ID: ${id} in school ${adminProfile.school_id}` 
      }, { status: 404 })
    }

    console.log('🎯 Target user found:', targetProfile)

    // Track deletion progress
    const deletionProgress = {
      studentWallet: 0,
      achievements: 0,
      assessmentScores: 0,
      classAssignments: 0,
      parentChildRelations: 0,
      wellbeingData: 0,
      attendance: 0,
      notifications: 0,
      messages: 0,
      communityPosts: 0,
      profile: false,
      authUser: false
    }

    // Delete all related records in order (from dependent to independent)
    // Use supabaseAdmin for all deletions to bypass RLS and ensure proper permissions
    
    // 1. Student Wallet
    const { error: walletError, count: walletCount } = await supabaseAdmin
      .from('student_wallet')
      .delete()
      .eq('student_id', targetProfile.id)
    if (!walletError) {
      deletionProgress.studentWallet = walletCount || 0
      console.log('✅ Deleted student wallet records:', walletCount)
    }

    // 2. Achievements & XP
    const { error: achievementsError, count: achievementsCount } = await supabaseAdmin
      .from('achievements')
      .delete()
      .eq('student_id', targetProfile.id)
    if (!achievementsError) {
      deletionProgress.achievements = achievementsCount || 0
      console.log('✅ Deleted achievements:', achievementsCount)
    }

    // 3. Assessment Scores
    const { error: scoresError, count: scoresCount } = await supabaseAdmin
      .from('assessment_scores')
      .delete()
      .eq('student_id', targetProfile.id)
    if (!scoresError) {
      deletionProgress.assessmentScores = scoresCount || 0
      console.log('✅ Deleted assessment scores:', scoresCount)
    }

    // 4. Class Assignments
    const { error: assignmentsError, count: assignmentsCount } = await supabaseAdmin
      .from('class_assignments')
      .delete()
      .eq('student_id', targetProfile.id)
    if (!assignmentsError) {
      deletionProgress.classAssignments = assignmentsCount || 0
      console.log('✅ Deleted class assignments:', assignmentsCount)
    }

    // 5. Parent-Child Relationships
    const { error: parentChildError, count: parentChildCount } = await supabaseAdmin
      .from('parent_children')
      .delete()
      .or(`parent_id.eq.${targetProfile.id},child_id.eq.${targetProfile.id}`)
    if (!parentChildError) {
      deletionProgress.parentChildRelations = parentChildCount || 0
      console.log('✅ Deleted parent-child relationships:', parentChildCount)
    }

    // 6. Wellbeing Data (mood tracking, gratitude, etc.)
    const wellbeingTables = [
      'mood_tracking',
      'gratitude_entries',
      'courage_log',
      'kindness_counter',
      'breathing_sessions',
      'habit_tracker',
      'help_requests'
    ]

    let totalWellbeingDeleted = 0
    for (const table of wellbeingTables) {
      try {
        const { count } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', targetProfile.id)
        totalWellbeingDeleted += count || 0
        console.log(`✅ Deleted ${table}:`, count)
      } catch (err) {
        console.warn(`⚠️ Could not delete from ${table}:`, err)
      }
    }
    deletionProgress.wellbeingData = totalWellbeingDeleted

    // 7. Attendance Records
    const { error: attendanceError, count: attendanceCount } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('student_id', targetProfile.id)
    if (!attendanceError) {
      deletionProgress.attendance = attendanceCount || 0
      console.log('✅ Deleted attendance records:', attendanceCount)
    }

    // 8. Notifications
    const { error: notificationsError, count: notificationsCount } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', targetProfile.id)
    if (!notificationsError) {
      deletionProgress.notifications = notificationsCount || 0
      console.log('✅ Deleted notifications:', notificationsCount)
    }

    // 9. Messages
    const { error: messagesError, count: messagesCount } = await supabaseAdmin
      .from('messages')
      .delete()
      .or(`sender_id.eq.${targetProfile.id},recipient_id.eq.${targetProfile.id}`)
    if (!messagesError) {
      deletionProgress.messages = messagesCount || 0
      console.log('✅ Deleted messages:', messagesCount)
    }

    // 10. Community Posts & Reactions (uses teacher_id column)
    const { error: postsError, count: postsCount } = await supabaseAdmin
      .from('community_posts')
      .delete()
      .eq('teacher_id', targetProfile.id)
    if (!postsError) {
      deletionProgress.communityPosts = postsCount || 0
      console.log('✅ Deleted community posts:', postsCount)
    }

    // 11. Delete Profile using database function
    // This function handles all deletions with proper schema qualification and trigger handling
    console.log('🛠️ Calling delete_user_cascade database function...')
    
    try {
      const { data: dbResult, error: dbError } = await supabaseAdmin
        .rpc('delete_user_cascade', {
          target_profile_id: targetProfile.id
        })
      
      if (dbError) {
        console.error('❌ Database function error:', dbError)
        console.log('🔄 Falling back to direct deletion methods...')
        
        // Fallback: Try auth user deletion which cascades to profile
        if (targetProfile.user_id) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            targetProfile.user_id
          )
          
          if (!authError) {
            deletionProgress.authUser = true
            deletionProgress.profile = true
            console.log('✅ Auth user deleted (profile cascaded)')
          } else {
            console.error('❌ Auth deletion also failed:', authError)
          }
        }
      } else if (dbResult && typeof dbResult === 'object' && 'error' in dbResult && dbResult.error === true) {
        console.error('❌ Database function returned error:', dbResult)
        console.log('🔄 Falling back to auth user deletion...')
        
        // Fallback to auth deletion
        if (targetProfile.user_id) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            targetProfile.user_id
          )
          
          if (!authError) {
            deletionProgress.authUser = true
            deletionProgress.profile = true
            console.log('✅ Auth user deleted (profile cascaded)')
          }
        }
      } else if (dbResult && typeof dbResult === 'object' && 'success' in dbResult && dbResult.success === true) {
        // Success - profile deleted via database function
        deletionProgress.profile = true
        console.log(`✅ Profile deleted via database function (${dbResult.total_related_records_deleted || 0} related records)`)
        
        // Now delete auth user
        if (targetProfile.user_id) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            targetProfile.user_id
          )
          
          if (!authError) {
            deletionProgress.authUser = true
            console.log('✅ Auth user deleted')
          } else {
            console.warn('⚠️ Auth user deletion failed (but profile is deleted):', authError)
          }
        }
      } else {
        console.warn('⚠️ Unexpected database function response:', dbResult)
      }
    } catch (error) {
      console.error('❌ Deletion error:', error)
    }

    console.log('🎉 User deletion complete:', deletionProgress)

    // Determine if deletion was fully successful
    const fullyDeleted = deletionProgress.profile && deletionProgress.authUser
    const partiallyDeleted = Object.values(deletionProgress).some(v => !!v)

    if (!fullyDeleted && partiallyDeleted) {
      let warning = 'Deletion incomplete: '
      if (!deletionProgress.profile && !deletionProgress.authUser) {
        warning += 'Both profile and auth account could not be deleted'
      } else if (!deletionProgress.profile) {
        warning += 'Profile could not be deleted'
      } else if (!deletionProgress.authUser) {
        warning += 'Auth account could not be deleted'
      }
      
      return NextResponse.json({
        message: 'User partially deleted - some data removed but profile or auth account may remain',
        warning,
        deletedUser: {
          id: targetProfile.id,
          name: `${targetProfile.first_name} ${targetProfile.last_name}`,
          role: targetProfile.role
        },
        deletionProgress
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: targetProfile.id,
        name: `${targetProfile.first_name} ${targetProfile.last_name}`,
        role: targetProfile.role
      },
      deletionProgress
    })

  } catch (error: any) {
    console.error('❌ Delete API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
