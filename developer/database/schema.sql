-- Developer Portal Database Schema
-- This is a SEPARATE Supabase database for the developer portal
-- Database Name: catalystwells-developers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Developer Accounts Table
CREATE TABLE developer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL, -- Links to auth.users in THIS database
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
    account_status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, banned
    suspension_reason TEXT,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    api_key_hash VARCHAR(255) UNIQUE, -- For API access to developer portal
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer Applications Table (mirrors main DB but with developer context)
CREATE TABLE developer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    -- Application Details
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    category VARCHAR(100), -- education, productivity, communication, etc.
    
    -- OAuth Credentials (generated after approval)
    client_id VARCHAR(255) UNIQUE,
    client_secret_hash VARCHAR(255), -- Hashed, never shown again after creation
    
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
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, in_review, approved, rejected, suspended
    is_verified BOOLEAN DEFAULT false,
    is_first_party BOOLEAN DEFAULT false,
    trust_level VARCHAR(50) DEFAULT 'standard', -- standard, verified, trusted, first_party
    
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

-- API Keys for Applications (separate from OAuth)
CREATE TABLE application_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification
    
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
CREATE TABLE application_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    endpoint_url TEXT NOT NULL,
    secret_hash VARCHAR(255) NOT NULL, -- For HMAC signature verification
    
    -- Events to listen to
    events TEXT[] NOT NULL DEFAULT '{}', -- user.authorized, user.revoked, token.refreshed, etc.
    
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

-- Analytics & Usage Logs
CREATE TABLE application_analytics (
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

-- Activity Logs
CREATE TABLE developer_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES developer_accounts(id) ON DELETE SET NULL,
    application_id UUID REFERENCES developer_applications(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- created_app, updated_app, generated_key, etc.
    resource_type VARCHAR(50), -- application, api_key, webhook
    resource_id UUID,
    
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    application_id UUID REFERENCES developer_applications(id) ON DELETE SET NULL,
    
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100), -- technical, billing, feature_request, bug_report
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, waiting_response, resolved, closed
    
    -- Assignment
    assigned_to UUID,
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Messages
CREATE TABLE support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    sender_id UUID NOT NULL, -- Can be developer or admin
    sender_type VARCHAR(50) NOT NULL, -- developer, admin
    
    message TEXT NOT NULL,
    attachments JSONB, -- Array of attachment URLs
    
    is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to developer
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_dev_accounts_email ON developer_accounts(email);
CREATE INDEX idx_dev_accounts_status ON developer_accounts(account_status);
CREATE INDEX idx_dev_apps_developer ON developer_applications(developer_id);
CREATE INDEX idx_dev_apps_client_id ON developer_applications(client_id);
CREATE INDEX idx_dev_apps_status ON developer_applications(status);
CREATE INDEX idx_api_keys_app ON application_api_keys(application_id);
CREATE INDEX idx_api_keys_hash ON application_api_keys(key_hash);
CREATE INDEX idx_webhooks_app ON application_webhooks(application_id);
CREATE INDEX idx_analytics_app_date ON application_analytics(application_id, date);
CREATE INDEX idx_activity_logs_developer ON developer_activity_logs(developer_id);
CREATE INDEX idx_activity_logs_app ON developer_activity_logs(application_id);
CREATE INDEX idx_support_tickets_developer ON support_tickets(developer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE developer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Developer Accounts Policies
CREATE POLICY "Developers can view own account"
    ON developer_accounts FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Developers can update own account"
    ON developer_accounts FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Developer Applications Policies
CREATE POLICY "Developers can view own applications"
    ON developer_applications FOR SELECT
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Developers can create applications"
    ON developer_applications FOR INSERT
    WITH CHECK (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Developers can update own applications"
    ON developer_applications FOR UPDATE
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- API Keys Policies
CREATE POLICY "Developers can manage own API keys"
    ON application_api_keys FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Webhooks Policies
CREATE POLICY "Developers can manage own webhooks"
    ON application_webhooks FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Analytics Policies
CREATE POLICY "Developers can view own analytics"
    ON application_analytics FOR SELECT
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Activity Logs Policies
CREATE POLICY "Developers can view own activity"
    ON developer_activity_logs FOR SELECT
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Support Tickets Policies
CREATE POLICY "Developers can manage own tickets"
    ON support_tickets FOR ALL
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Developers can view own ticket messages"
    ON support_ticket_messages FOR SELECT
    USING (ticket_id IN (
        SELECT id FROM support_tickets 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Functions

-- Function to create developer account after auth signup
CREATE OR REPLACE FUNCTION create_developer_account()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO developer_accounts (auth_user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Developer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create developer account
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
CREATE TRIGGER update_developer_accounts_updated_at
    BEFORE UPDATE ON developer_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_applications_updated_at
    BEFORE UPDATE ON developer_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Developer Portal Database Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: developer_accounts, developer_applications, application_api_keys, webhooks, analytics';
    RAISE NOTICE '🔒 Row Level Security: Enabled with proper policies';
    RAISE NOTICE '🎯 Next: Set up Supabase Auth and configure environment variables';
END $$;
