import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const getSupabaseUrl = () => {
    return process.env.NEXT_PUBLIC_DEV_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        ''
}

const getSupabaseAnonKey = () => {
    return process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        ''
}

const getSupabaseServiceKey = () => {
    return process.env.DEV_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        ''
}

// Developer Portal Supabase Client (Separate Database)
let devSupabase: SupabaseClient

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

if (supabaseUrl && supabaseAnonKey) {
    devSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
} else {
    // Create a mock client for dev purposes when env vars are missing
    console.warn('Supabase environment variables not configured. Using mock client.')
    devSupabase = {
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
            signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        from: () => ({
            select: () => ({ data: [], error: null, single: async () => ({ data: null, error: null }) }),
            insert: () => ({ data: null, error: null, select: () => ({ single: async () => ({ data: null, error: null }) }) }),
            update: () => ({ data: null, error: null, eq: () => ({ data: null, error: null }) }),
            delete: () => ({ data: null, error: null, eq: () => ({ data: null, error: null }) }),
        }),
    } as unknown as SupabaseClient
}

export { devSupabase }

// Developer Portal Admin Client (Service Role) - only create if credentials exist
const serviceKey = getSupabaseServiceKey()
export const devSupabaseAdmin = supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
    : devSupabase

// Main CatalystWells Supabase Client (For OAuth Integration)
const mainUrl = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || supabaseUrl
const mainAnonKey = process.env.NEXT_PUBLIC_MAIN_SUPABASE_ANON_KEY || supabaseAnonKey

export const mainSupabase = mainUrl && mainAnonKey
    ? createClient(mainUrl, mainAnonKey, {
        auth: {
            persistSession: false
        }
    })
    : devSupabase

// Main CatalystWells Admin Client (Service Role)
const mainServiceKey = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || serviceKey

export const mainSupabaseAdmin = mainUrl && mainServiceKey
    ? createClient(mainUrl, mainServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
    : devSupabase

// Types
export interface DeveloperAccount {
    id: string
    auth_user_id: string
    email: string
    full_name: string
    company_name?: string
    company_website?: string
    avatar_url?: string
    bio?: string
    github_username?: string
    twitter_username?: string
    email_verified: boolean
    is_approved: boolean
    account_status: 'pending' | 'active' | 'suspended' | 'banned'
    two_factor_enabled: boolean
    created_at: string
    updated_at: string
}

export interface DeveloperApplication {
    id: string
    developer_id: string
    name: string
    description: string
    short_description?: string
    category?: string
    client_id?: string
    website_url: string
    logo_url?: string
    banner_url?: string
    privacy_policy_url: string
    terms_of_service_url: string
    support_url?: string
    documentation_url?: string
    redirect_uris: string[]
    allowed_scopes: string[]
    requested_scopes: string[]
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'suspended'
    is_verified: boolean
    is_first_party: boolean
    trust_level: 'standard' | 'verified' | 'trusted' | 'first_party'
    is_published: boolean
    total_installs: number
    active_installs: number
    rate_limit_per_minute: number
    rate_limit_per_hour: number
    rate_limit_per_day: number
    created_at: string
    updated_at: string
}

export interface ApplicationApiKey {
    id: string
    application_id: string
    developer_id: string
    key_name: string
    key_prefix: string
    scopes: string[]
    is_active: boolean
    last_used_at?: string
    total_requests: number
    expires_at?: string
    created_at: string
}

export interface ApplicationWebhook {
    id: string
    application_id: string
    endpoint_url: string
    events: string[]
    is_active: boolean
    total_deliveries: number
    successful_deliveries: number
    failed_deliveries: number
    last_delivery_at?: string
    created_at: string
}

export interface ApplicationAnalytics {
    id: string
    application_id: string
    date: string
    authorization_requests: number
    successful_authorizations: number
    denied_authorizations: number
    token_exchanges: number
    token_refreshes: number
    api_requests: number
    api_errors: number
    average_response_time_ms: number
    new_users: number
    active_users: number
    revoked_users: number
}

export interface SupportTicket {
    id: string
    developer_id: string
    application_id?: string
    subject: string
    description: string
    category?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
    created_at: string
    updated_at: string
}
