import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
    }

    try {
        const { createServerClient } = await import('@supabase/ssr')
        const { cookies } = await import('next/headers')

        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Ignore - called from Server Component
                        }
                    }
                }
            }
        )

        // Exchange code for session
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !user) {
            console.error('Auth callback error:', error)
            return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
        }

        // Check if developer account exists, create if not
        const admin = getSupabaseAdmin()

        const { data: existingAccount } = await admin
            .from('developer_accounts')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

        if (!existingAccount) {
            // Create developer account
            const { error: createError } = await admin
                .from('developer_accounts')
                .insert({
                    auth_user_id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Developer',
                    company_name: user.user_metadata?.company_name || null,
                    company_website: user.user_metadata?.company_website || null,
                    avatar_url: user.user_metadata?.avatar_url || null,
                    email_verified: !!user.email_confirmed_at,
                    auth_provider: user.app_metadata?.provider || 'email'
                })

            if (createError) {
                console.error('Error creating developer account:', createError)
            } else {
                // Log activity
                const { data: newAccount } = await admin
                    .from('developer_accounts')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .single()

                if (newAccount) {
                    await admin.from('developer_activity_logs').insert({
                        developer_id: newAccount.id,
                        action: 'account_created',
                        resource_type: 'developer_account',
                        resource_id: newAccount.id,
                        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                        user_agent: request.headers.get('user-agent')
                    })

                    // Create welcome notification
                    await admin.from('developer_notifications').insert({
                        developer_id: newAccount.id,
                        title: 'Welcome to CatalystWells Developer Portal!',
                        message: 'Start building amazing education apps by creating your first application.',
                        type: 'success',
                        category: 'announcement',
                        action_url: '/dashboard/applications/create',
                        action_label: 'Create Your First App'
                    })
                }
            }
        } else {
            // Update last login
            await admin
                .from('developer_accounts')
                .update({
                    last_login_at: new Date().toISOString(),
                    last_login_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
                })
                .eq('id', existingAccount.id)

            // Log activity
            await admin.from('developer_activity_logs').insert({
                developer_id: existingAccount.id,
                action: 'user_login',
                resource_type: 'session',
                ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                user_agent: request.headers.get('user-agent')
            })
        }

        return NextResponse.redirect(new URL(next, requestUrl.origin))
    } catch (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=server_error', requestUrl.origin))
    }
}
