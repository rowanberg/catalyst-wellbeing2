import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params
    const body = await request.json()
    const { action, data } = body

    // Verify super admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'pause_school': {
        const { data: school, error } = await supabaseAdmin
          .from('schools')
          .update({ 
            is_active: false,
            payment_status: 'suspended'
          })
          .eq('id', schoolId)
          .select()
          .single()

        if (error) throw error

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'pause_school',
            target_school_id: schoolId,
            details: { reason: data.reason || 'Manual suspension' }
          })

        return NextResponse.json({ success: true, school })
      }

      case 'activate_school': {
        const { data: school, error } = await supabaseAdmin
          .from('schools')
          .update({ 
            is_active: true,
            payment_status: 'active'
          })
          .eq('id', schoolId)
          .select()
          .single()

        if (error) throw error

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'activate_school',
            target_school_id: schoolId,
            details: { reason: data.reason || 'Manual activation' }
          })

        return NextResponse.json({ success: true, school })
      }

      case 'set_user_limits': {
        const { total, students, teachers, parents } = data

        // Update school user limit
        const { data: school, error } = await supabaseAdmin
          .from('schools')
          .update({ user_limit: total })
          .eq('id', schoolId)
          .select()
          .single()

        if (error) throw error

        // Store role-specific limits in metadata (you might want to add these columns to the schools table)
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'set_user_limits',
            target_school_id: schoolId,
            details: { 
              total,
              students,
              teachers,
              parents,
              previous_limit: school.user_limit
            }
          })

        return NextResponse.json({ 
          success: true, 
          limits: { total, students, teachers, parents }
        })
      }

      case 'delete_user': {
        const { userId } = data

        // First get user details for logging
        const { data: user } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!user || user.school_id !== schoolId) {
          return NextResponse.json({ error: 'User not found in this school' }, { status: 404 })
        }

        // Delete user profile (will cascade to other tables)
        const { error } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId)

        if (error) throw error

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'delete_user',
            target_school_id: schoolId,
            details: { 
              user_id: userId,
              user_name: `${user.first_name} ${user.last_name}`,
              user_role: user.role
            }
          })

        return NextResponse.json({ success: true, deletedUser: user })
      }

      case 'add_user': {
        const { email, firstName, lastName, role, password } = data

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        })

        if (authError) throw authError

        // Create profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: authUser.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role,
            school_id: schoolId,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (profileError) {
          // Rollback auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          throw profileError
        }

        // If student, generate student tag
        if (role === 'student') {
          // The trigger in the database will handle this automatically
        }

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'add_user',
            target_school_id: schoolId,
            details: { 
              user_id: profile.id,
              user_name: `${firstName} ${lastName}`,
              user_role: role,
              email
            }
          })

        return NextResponse.json({ success: true, user: profile })
      }

      case 'update_plan': {
        const { planType } = data

        // Get plan details
        const { data: plan } = await supabaseAdmin
          .from('subscription_plans')
          .select('*')
          .eq('name', planType)
          .single()

        if (!plan) {
          return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
        }

        // Update school plan
        const { data: school, error } = await supabaseAdmin
          .from('schools')
          .update({ 
            plan_type: planType,
            user_limit: plan.user_limit,
            monthly_fee: plan.monthly_price
          })
          .eq('id', schoolId)
          .select()
          .single()

        if (error) throw error

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'update_plan',
            target_school_id: schoolId,
            details: { 
              new_plan: planType,
              new_limit: plan.user_limit,
              new_fee: plan.monthly_price
            }
          })

        return NextResponse.json({ success: true, school, plan })
      }

      case 'reset_password': {
        const { userId } = data

        // Get user details
        const { data: user } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!user || user.school_id !== schoolId) {
          return NextResponse.json({ error: 'User not found in this school' }, { status: 404 })
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

        // Update auth user password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          user.user_id,
          { password: tempPassword }
        )

        if (error) throw error

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'reset_password',
            target_school_id: schoolId,
            details: { 
              user_id: userId,
              user_name: `${user.first_name} ${user.last_name}`,
              user_role: user.role
            }
          })

        return NextResponse.json({ 
          success: true, 
          tempPassword,
          message: `Password reset for ${user.first_name} ${user.last_name}` 
        })
      }

      case 'bulk_import_users': {
        const { users: usersToImport } = data
        const createdUsers: any[] = []
        const errors: { email: string; error: string; }[] = []

        for (const userData of usersToImport) {
          try {
            // Create auth user
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: userData.email,
              password: userData.password || Math.random().toString(36).slice(-12),
              email_confirm: true
            })

            if (authError) throw authError

            // Create profile
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .insert({
                user_id: authUser.user.id,
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                role: userData.role,
                school_id: schoolId,
                created_at: new Date().toISOString()
              })
              .select()
              .single()

            createdUsers.push(profile)
          } catch (error: any) {
            errors.push({
              email: userData.email,
              error: error.message
            })
          }
        }

        // Log the action
        await supabaseAdmin
          .from('super_admin_logs')
          .insert({
            action: 'bulk_import_users',
            target_school_id: schoolId,
            details: { 
              imported_count: createdUsers.length,
              failed_count: errors.length,
              errors
            }
          })

        return NextResponse.json({ 
          success: true, 
          imported: createdUsers,
          errors
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('School control error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
