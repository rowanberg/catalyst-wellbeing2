-- ============================================================
-- CatalystWells Developer Portal - Complete Database Schema
-- ============================================================
-- Run this file in your Developer Portal Supabase SQL Editor
-- Database: Developer Portal (kbyeiqzxuaslqquhpyvi)
-- 
-- IMPORTANT: Run this in order as each section depends on previous ones
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SECTION 1: CORE DEVELOPER TABLES
-- ============================================================

-- Developer Accounts Table
CREATE TABLE IF NOT EXISTS developer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    company_website TEXT,
    avatar_url TEXT,
    bio TEXT,
    github_username VARCHAR(255),
    twitter_username VARCHAR(255),
    
    -- Verification
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    
    -- Status
    account_status VARCHAR(50) DEFAULT 'pending',
    suspension_reason TEXT,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    api_key_hash VARCHAR(255) UNIQUE,
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer Applications Table
CREATE TABLE IF NOT EXISTS developer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    -- Application Details
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    category VARCHAR(100),
    
    -- OAuth Credentials
    client_id VARCHAR(255) UNIQUE,
    client_secret_hash VARCHAR(255),
    
    -- URLs
    website_url TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    privacy_policy_url TEXT NOT NULL,
    terms_of_service_url TEXT NOT NULL,
    support_url TEXT,
    documentation_url TEXT,
    
    -- OAuth Configuration
    redirect_uris TEXT[] NOT NULL DEFAULT '{}',
    allowed_scopes TEXT[] NOT NULL DEFAULT '{}',
    requested_scopes TEXT[] NOT NULL DEFAULT '{}',
    
    -- Status & Verification
    status VARCHAR(50) DEFAULT 'draft',
    is_verified BOOLEAN DEFAULT false,
    is_first_party BOOLEAN DEFAULT false,
    trust_level VARCHAR(50) DEFAULT 'standard',
    
    -- Review Process
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Publishing
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    total_installs INTEGER DEFAULT 0,
    active_installs INTEGER DEFAULT 0,
    total_api_calls BIGINT DEFAULT 0,
    
    -- Rate Limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'suspended'))
);

-- ============================================================
-- SECTION 2: API KEYS AND WEBHOOKS
-- ============================================================

-- API Keys for Applications
CREATE TABLE IF NOT EXISTS application_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    
    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_requests BIGINT DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(application_id, key_name)
);

-- Webhook Endpoints
CREATE TABLE IF NOT EXISTS application_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    endpoint_url TEXT NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    
    -- Events to listen to
    events TEXT[] NOT NULL DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Delivery Stats
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    last_delivery_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Deliveries Log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES application_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery details
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    http_status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,
    error_message TEXT,
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Retry
    next_retry_at TIMESTAMP WITH TIME ZONE,
    max_retries INTEGER DEFAULT 5,
    
    -- Signature
    signature VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: ANALYTICS AND LOGGING
-- ============================================================

-- Analytics & Usage Logs
CREATE TABLE IF NOT EXISTS application_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    -- Date tracking
    date DATE NOT NULL,
    
    -- OAuth Metrics
    authorization_requests INTEGER DEFAULT 0,
    successful_authorizations INTEGER DEFAULT 0,
    denied_authorizations INTEGER DEFAULT 0,
    token_exchanges INTEGER DEFAULT 0,
    token_refreshes INTEGER DEFAULT 0,
    
    -- API Metrics
    api_requests INTEGER DEFAULT 0,
    api_errors INTEGER DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,
    
    -- User Metrics
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    revoked_users INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, date)
);

-- API Call Logs (for detailed analytics)
CREATE TABLE IF NOT EXISTS api_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES developer_applications(id) ON DELETE SET NULL,
    
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    
    -- Request details
    request_headers JSONB,
    request_body JSONB,
    
    -- Response details  
    response_body JSONB,
    error_message TEXT,
    
    -- Client info
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS developer_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES developer_accounts(id) ON DELETE SET NULL,
    application_id UUID REFERENCES developer_applications(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 4: SUPPORT SYSTEM
-- ============================================================

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    application_id UUID REFERENCES developer_applications(id) ON DELETE SET NULL,
    
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'open',
    
    -- Assignment
    assigned_to UUID,
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    sender_id UUID NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    
    message TEXT NOT NULL,
    attachments JSONB,
    
    is_internal BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 5: NOTIFICATIONS
-- ============================================================

-- Developer Notifications
CREATE TABLE IF NOT EXISTS developer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    category VARCHAR(50),
    
    action_url TEXT,
    action_label VARCHAR(100),
    
    metadata JSONB,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    
    category VARCHAR(50) DEFAULT 'general',
    language VARCHAR(10) DEFAULT 'en',
    
    variables TEXT[] DEFAULT '{}',
    
    default_type VARCHAR(50) DEFAULT 'info',
    default_priority VARCHAR(50) DEFAULT 'normal',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, name)
);

-- ============================================================
-- SECTION 6: TEAM MANAGEMENT
-- ============================================================

-- Team Members
CREATE TABLE IF NOT EXISTS developer_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'developer',
    status VARCHAR(50) DEFAULT 'active',
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    
    permissions JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(developer_id, email)
);

-- Team Invitations
CREATE TABLE IF NOT EXISTS developer_team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'developer',
    
    invited_by UUID NOT NULL REFERENCES developer_accounts(id),
    token VARCHAR(255) UNIQUE,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending',
    
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 7: SCHOOL LINKING
-- ============================================================

-- School Access Requests
CREATE TABLE IF NOT EXISTS school_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending',
    
    purpose TEXT NOT NULL,
    requested_scopes TEXT[] DEFAULT '{}',
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_by UUID NOT NULL REFERENCES developer_accounts(id),
    
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    review_notes TEXT,
    
    approved_scopes TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, school_id)
);

-- Linked Schools
CREATE TABLE IF NOT EXISTS school_app_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    school_name VARCHAR(255),
    school_code VARCHAR(50),
    
    status VARCHAR(50) DEFAULT 'active',
    
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    allowed_scopes TEXT[] DEFAULT '{}',
    
    -- Usage stats
    total_api_calls BIGINT DEFAULT 0,
    last_api_call_at TIMESTAMP WITH TIME ZONE,
    active_users INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, school_id)
);

-- ============================================================
-- SECTION 8: SCOPE DEFINITIONS
-- ============================================================

-- Scope Definitions
CREATE TABLE IF NOT EXISTS scope_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'low',
    data_accessed TEXT[],
    is_premium BOOLEAN DEFAULT false,
    requires_consent BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 9: SANDBOX DATA
-- ============================================================

-- Sandbox Schools
CREATE TABLE IF NOT EXISTS sandbox_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50),
    student_count INTEGER DEFAULT 0,
    teacher_count INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sandbox Students
CREATE TABLE IF NOT EXISTS sandbox_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES sandbox_schools(id) ON DELETE CASCADE,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    grade VARCHAR(10),
    section VARCHAR(10),
    
    attendance_percentage DECIMAL(5,2) DEFAULT 90.00,
    gpa DECIMAL(3,2) DEFAULT 3.50,
    
    data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 10: MARKETPLACE
-- ============================================================

-- App Marketplace Listings
CREATE TABLE IF NOT EXISTS app_marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID UNIQUE NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    tagline VARCHAR(200),
    long_description TEXT,
    screenshots TEXT[] DEFAULT '{}',
    demo_video_url TEXT,
    
    primary_category VARCHAR(100),
    secondary_category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    pricing_model VARCHAR(50) DEFAULT 'free',
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    
    install_count INTEGER DEFAULT 0,
    rating_average DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    is_listed BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    current_version VARCHAR(50),
    
    listed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App Reviews
CREATE TABLE IF NOT EXISTS app_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    reviewer_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    
    is_verified_user BOOLEAN DEFAULT false,
    
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, reviewer_id)
);

-- ============================================================
-- SECTION 11: PLAYGROUND HISTORY
-- ============================================================

-- API Playground Execution History
CREATE TABLE IF NOT EXISTS playground_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    application_id UUID REFERENCES developer_applications(id) ON DELETE SET NULL,
    
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    environment VARCHAR(20) DEFAULT 'sandbox',
    
    request_headers JSONB,
    request_body JSONB,
    request_params JSONB,
    
    response_status INTEGER,
    response_time_ms INTEGER,
    response_body JSONB,
    
    is_successful BOOLEAN DEFAULT false,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECTION 12: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dev_accounts_email ON developer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_dev_accounts_status ON developer_accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_dev_accounts_auth_user ON developer_accounts(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_dev_apps_developer ON developer_applications(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_apps_client_id ON developer_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_dev_apps_status ON developer_applications(status);

CREATE INDEX IF NOT EXISTS idx_api_keys_app ON application_api_keys(application_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON application_api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_webhooks_app ON application_webhooks(application_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_app_date ON application_analytics(application_id, date);
CREATE INDEX IF NOT EXISTS idx_api_logs_app ON api_call_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_call_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_developer ON developer_activity_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_app ON developer_activity_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON developer_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_support_tickets_developer ON support_tickets(developer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_dev_notifications_developer ON developer_notifications(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_notifications_read ON developer_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_team_members_developer ON developer_team_members(developer_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON developer_team_invitations(email);

CREATE INDEX IF NOT EXISTS idx_school_links_app ON school_app_links(application_id);
CREATE INDEX IF NOT EXISTS idx_school_access_app ON school_access_requests(application_id);

CREATE INDEX IF NOT EXISTS idx_notification_templates_app ON notification_templates(application_id);

CREATE INDEX IF NOT EXISTS idx_playground_developer ON playground_executions(developer_id);
CREATE INDEX IF NOT EXISTS idx_playground_created ON playground_executions(created_at);

-- ============================================================
-- SECTION 13: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE developer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_app_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 14: RLS POLICIES
-- ============================================================

-- Developer Accounts Policies
DROP POLICY IF EXISTS "Developers can view own account" ON developer_accounts;
CREATE POLICY "Developers can view own account"
    ON developer_accounts FOR SELECT
    USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Developers can update own account" ON developer_accounts;
CREATE POLICY "Developers can update own account"
    ON developer_accounts FOR UPDATE
    USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Anyone can insert developer account" ON developer_accounts;
CREATE POLICY "Anyone can insert developer account"
    ON developer_accounts FOR INSERT
    WITH CHECK (true);

-- Developer Applications Policies
DROP POLICY IF EXISTS "Developers can view own applications" ON developer_applications;
CREATE POLICY "Developers can view own applications"
    ON developer_applications FOR SELECT
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Developers can create applications" ON developer_applications;
CREATE POLICY "Developers can create applications"
    ON developer_applications FOR INSERT
    WITH CHECK (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Developers can update own applications" ON developer_applications;
CREATE POLICY "Developers can update own applications"
    ON developer_applications FOR UPDATE
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Developers can delete own applications" ON developer_applications;
CREATE POLICY "Developers can delete own applications"
    ON developer_applications FOR DELETE
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- API Keys Policies
DROP POLICY IF EXISTS "Developers can manage own API keys" ON application_api_keys;
CREATE POLICY "Developers can manage own API keys"
    ON application_api_keys FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Webhooks Policies
DROP POLICY IF EXISTS "Developers can manage own webhooks" ON application_webhooks;
CREATE POLICY "Developers can manage own webhooks"
    ON application_webhooks FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Webhook Deliveries
DROP POLICY IF EXISTS "Developers can view own webhook deliveries" ON webhook_deliveries;
CREATE POLICY "Developers can view own webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (webhook_id IN (
        SELECT w.id FROM application_webhooks w
        JOIN developer_applications a ON w.application_id = a.id
        WHERE a.developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Analytics Policies
DROP POLICY IF EXISTS "Developers can view own analytics" ON application_analytics;
CREATE POLICY "Developers can view own analytics"
    ON application_analytics FOR SELECT
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- API Call Logs
DROP POLICY IF EXISTS "Developers can view own api logs" ON api_call_logs;
CREATE POLICY "Developers can view own api logs"
    ON api_call_logs FOR SELECT
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Activity Logs Policies
DROP POLICY IF EXISTS "Developers can view own activity" ON developer_activity_logs;
CREATE POLICY "Developers can view own activity"
    ON developer_activity_logs FOR SELECT
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Support Tickets Policies
DROP POLICY IF EXISTS "Developers can manage own tickets" ON support_tickets;
CREATE POLICY "Developers can manage own tickets"
    ON support_tickets FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Developers can view own ticket messages" ON support_ticket_messages;
CREATE POLICY "Developers can view own ticket messages"
    ON support_ticket_messages FOR SELECT
    USING (ticket_id IN (
        SELECT id FROM support_tickets 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Developer Notifications
DROP POLICY IF EXISTS "Developers can view own notifications" ON developer_notifications;
CREATE POLICY "Developers can view own notifications"
    ON developer_notifications FOR SELECT
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Developers can update own notifications" ON developer_notifications;
CREATE POLICY "Developers can update own notifications"
    ON developer_notifications FOR UPDATE
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Notification Templates
DROP POLICY IF EXISTS "Developers can manage own templates" ON notification_templates;
CREATE POLICY "Developers can manage own templates"
    ON notification_templates FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Team Members
DROP POLICY IF EXISTS "Developers can manage team members" ON developer_team_members;
CREATE POLICY "Developers can manage team members"
    ON developer_team_members FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Team Invitations
DROP POLICY IF EXISTS "Developers can manage team invitations" ON developer_team_invitations;
CREATE POLICY "Developers can manage team invitations"
    ON developer_team_invitations FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- School Access Requests
DROP POLICY IF EXISTS "Developers can manage school access requests" ON school_access_requests;
CREATE POLICY "Developers can manage school access requests"
    ON school_access_requests FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- School Links
DROP POLICY IF EXISTS "Developers can manage school links" ON school_app_links;
CREATE POLICY "Developers can manage school links"
    ON school_app_links FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Scope Definitions - public read
DROP POLICY IF EXISTS "Anyone can read active scopes" ON scope_definitions;
CREATE POLICY "Anyone can read active scopes"
    ON scope_definitions FOR SELECT
    USING (is_active = true);

-- Sandbox - everyone can read
DROP POLICY IF EXISTS "Anyone can read sandbox schools" ON sandbox_schools;
CREATE POLICY "Anyone can read sandbox schools"
    ON sandbox_schools FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can read sandbox students" ON sandbox_students;
CREATE POLICY "Anyone can read sandbox students"
    ON sandbox_students FOR SELECT
    USING (true);

-- Marketplace - public listings
DROP POLICY IF EXISTS "Anyone can read listed apps" ON app_marketplace;
CREATE POLICY "Anyone can read listed apps"
    ON app_marketplace FOR SELECT
    USING (is_listed = true);

DROP POLICY IF EXISTS "Developers can manage own marketplace listing" ON app_marketplace;
CREATE POLICY "Developers can manage own marketplace listing"
    ON app_marketplace FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- App Reviews - public read
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON app_reviews;
CREATE POLICY "Anyone can read approved reviews"
    ON app_reviews FOR SELECT
    USING (is_approved = true);

-- Playground Executions
DROP POLICY IF EXISTS "Developers can manage playground executions" ON playground_executions;
CREATE POLICY "Developers can manage playground executions"
    ON playground_executions FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- ============================================================
-- SECTION 15: FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to create developer account after auth signup
CREATE OR REPLACE FUNCTION create_developer_account()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO developer_accounts (auth_user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_developer_account();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_developer_accounts_updated_at ON developer_accounts;
CREATE TRIGGER update_developer_accounts_updated_at
    BEFORE UPDATE ON developer_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_developer_applications_updated_at ON developer_applications;
CREATE TRIGGER update_developer_applications_updated_at
    BEFORE UPDATE ON developer_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SECTION 16: SEED DATA - SCOPES
-- ============================================================

INSERT INTO scope_definitions (scope_name, display_name, description, category, risk_level, data_accessed, requires_consent) VALUES
-- Profile Scopes
('profile.read', 'Read Basic Profile', 'Access basic profile information including name, avatar, and role', 'profile', 'low', ARRAY['Name', 'Avatar', 'Role', 'School'], true),
('profile.email', 'Read Email Address', 'Access the user''s email address', 'profile', 'medium', ARRAY['Email address'], true),

-- Student Scopes
('student.profile.read', 'Read Student Profile', 'Access student profile details', 'student', 'low', ARRAY['Student name', 'Grade', 'Section', 'Avatar'], true),
('student.attendance.read', 'Read Attendance Records', 'Access student attendance history and patterns', 'student', 'medium', ARRAY['Attendance records', 'Absence history', 'Late arrivals'], true),
('student.academic.read', 'Read Academic Records', 'Access grades, marks, and academic performance', 'student', 'medium', ARRAY['Grades', 'Marks', 'GPA', 'Academic history'], true),
('student.assessments.read', 'Read Assessment Data', 'Access exam results and assessment scores', 'student', 'medium', ARRAY['Exam results', 'Quiz scores', 'Assessment feedback'], true),
('student.timetable.read', 'Read Timetable', 'Access class schedules and timetables', 'student', 'low', ARRAY['Class schedule', 'Subject timings', 'Teacher assignments'], true),
('student.wellbeing.read', 'Read Wellbeing Data', 'Access wellbeing metrics and emotional state (aggregated)', 'student', 'high', ARRAY['Mood trends', 'Wellbeing scores', 'Check-in summaries'], true),
('student.notifications.send', 'Send Student Notifications', 'Send notifications to students', 'student', 'medium', ARRAY['Push notifications', 'In-app messages'], true),
('student.assignments.read', 'Read Assignments', 'Access assignment details and submissions', 'student', 'low', ARRAY['Assignments', 'Due dates', 'Submission status'], true),
('student.homework.read', 'Read Homework', 'Access homework assignments', 'student', 'low', ARRAY['Homework', 'Due dates', 'Completion status'], true),

-- Teacher Scopes
('teacher.profile.read', 'Read Teacher Profile', 'Access teacher profile information', 'teacher', 'low', ARRAY['Teacher name', 'Department', 'Subjects'], true),
('teacher.classes.read', 'Read Assigned Classes', 'Access classes assigned to the teacher', 'teacher', 'low', ARRAY['Class assignments', 'Student rosters'], true),
('teacher.students.read', 'Read Student Information', 'Access information about students in assigned classes', 'teacher', 'medium', ARRAY['Student profiles', 'Contact info'], true),

-- Parent Scopes
('parent.profile.read', 'Read Parent Profile', 'Access parent profile information', 'parent', 'low', ARRAY['Parent name', 'Contact info'], true),
('parent.children.read', 'Read Children Information', 'Access linked children profiles', 'parent', 'medium', ARRAY['Children names', 'Grades', 'Schools'], true),
('parent.grades.read', 'Read Children Grades', 'Access academic grades of linked children', 'parent', 'medium', ARRAY['Children grades', 'Progress reports'], true),
('parent.communications.read', 'Read Communications', 'Access messages from teachers and school', 'parent', 'low', ARRAY['Messages', 'Announcements'], true),

-- School Scopes
('school.structure.read', 'Read School Structure', 'Access school hierarchy and organization', 'school', 'low', ARRAY['Grades', 'Sections', 'Departments'], true),
('school.calendar.read', 'Read Academic Calendar', 'Access academic year and term information', 'school', 'low', ARRAY['Terms', 'Holidays', 'Events'], true),
('school.classes.read', 'Read Class Information', 'Access class rosters and details', 'school', 'low', ARRAY['Class details', 'Subject assignments'], true),

-- Calendar Scopes
('calendar.read', 'Read Calendar Events', 'Access calendar and scheduled events', 'calendar', 'low', ARRAY['Events', 'Schedules'], true),

-- AI Scopes
('ai.insights.read', 'Read AI Insights', 'Access AI-generated academic insights', 'ai', 'medium', ARRAY['Learning patterns', 'Performance predictions'], true),
('ai.recommendations.read', 'Read AI Recommendations', 'Access AI study recommendations', 'ai', 'low', ARRAY['Study tips', 'Resource suggestions'], true)

ON CONFLICT (scope_name) DO NOTHING;

-- ============================================================
-- SECTION 17: SEED DATA - SANDBOX
-- ============================================================

INSERT INTO sandbox_schools (name, code, type, student_count, teacher_count, data) VALUES
('Demo Primary School', 'DEMO-PRI-001', 'primary', 250, 15, '{"grades": ["1", "2", "3", "4", "5"], "sections": ["A", "B"]}'),
('Demo High School', 'DEMO-HIGH-001', 'high_school', 500, 30, '{"grades": ["9", "10", "11", "12"], "sections": ["A", "B", "C"]}'),
('Sandbox International Academy', 'SAND-INT-001', 'secondary', 350, 25, '{"grades": ["6", "7", "8"], "sections": ["A", "B"]}'),
('Test Elementary School', 'TEST-ELEM-001', 'primary', 180, 12, '{"grades": ["K", "1", "2", "3", "4"], "sections": ["A"]}'),
('Sample Secondary School', 'SAMP-SEC-001', 'secondary', 420, 28, '{"grades": ["6", "7", "8", "9", "10"], "sections": ["A", "B", "C"]}')
ON CONFLICT (code) DO NOTHING;

-- Insert sample sandbox students
INSERT INTO sandbox_students (school_id, first_name, last_name, email, grade, section, attendance_percentage, gpa, data)
SELECT 
    s.id,
    'Student' || generate_series,
    'Test' || generate_series,
    'student' || generate_series || '@sandbox.catalystwells.com',
    (ARRAY['9', '10', '11', '12'])[1 + (generate_series % 4)],
    (ARRAY['A', 'B', 'C'])[1 + (generate_series % 3)],
    85 + (random() * 15)::DECIMAL(5,2),
    2.5 + (random() * 1.5)::DECIMAL(3,2),
    '{}'::JSONB
FROM sandbox_schools s
CROSS JOIN generate_series(1, 20)
WHERE s.code = 'DEMO-HIGH-001'
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 18: SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ CatalystWells Developer Portal Schema Created Successfully!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Core Tables:';
    RAISE NOTICE '   - developer_accounts (developer profiles)';
    RAISE NOTICE '   - developer_applications (registered apps)';
    RAISE NOTICE '   - application_api_keys (API key management)';
    RAISE NOTICE '   - application_webhooks (webhook endpoints)';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Analytics:';
    RAISE NOTICE '   - application_analytics (daily metrics)';
    RAISE NOTICE '   - api_call_logs (request logs)';
    RAISE NOTICE '   - developer_activity_logs (activity tracking)';
    RAISE NOTICE '';
    RAISE NOTICE '🎫 Support:';
    RAISE NOTICE '   - support_tickets';
    RAISE NOTICE '   - support_ticket_messages';
    RAISE NOTICE '';
    RAISE NOTICE '🔔 Notifications:';
    RAISE NOTICE '   - developer_notifications';
    RAISE NOTICE '   - notification_templates';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Team Management:';
    RAISE NOTICE '   - developer_team_members';
    RAISE NOTICE '   - developer_team_invitations';
    RAISE NOTICE '';
    RAISE NOTICE '🏫 School Linking:';
    RAISE NOTICE '   - school_access_requests';
    RAISE NOTICE '   - school_app_links';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Sandbox:';
    RAISE NOTICE '   - sandbox_schools (5 demo schools)';
    RAISE NOTICE '   - sandbox_students (sample students)';
    RAISE NOTICE '';
    RAISE NOTICE '🏪 Marketplace:';
    RAISE NOTICE '   - app_marketplace';
    RAISE NOTICE '   - app_reviews';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security:';
    RAISE NOTICE '   - Row Level Security enabled on all tables';
    RAISE NOTICE '   - Automatic developer account creation on signup';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '🎯 Your Developer Portal database is ready!';
    RAISE NOTICE '============================================================';
END $$;
