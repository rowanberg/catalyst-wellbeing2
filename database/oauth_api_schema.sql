-- ============================================================================
-- CatalystWells OAuth & API Access Management Schema
-- ============================================================================
-- Secure third-party app integration with role-based permissions
-- Supports OAuth 2.0 Authorization Code Flow
-- ============================================================================

-- 1. OAuth Applications (Registered Third-Party Apps)
CREATE TABLE IF NOT EXISTS oauth_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    client_secret VARCHAR(128) NOT NULL DEFAULT encode(gen_random_bytes(64), 'hex'),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    redirect_uris TEXT[] NOT NULL, -- Array of allowed redirect URIs
    
    -- App verification and trust level
    is_verified BOOLEAN DEFAULT FALSE,
    is_first_party BOOLEAN DEFAULT FALSE, -- CatalystWells owned apps
    trust_level VARCHAR(20) DEFAULT 'standard', -- 'standard', 'trusted', 'official'
    
    -- Developer info
    developer_id UUID REFERENCES profiles(id),
    developer_name VARCHAR(255),
    developer_email VARCHAR(255),
    
    -- Allowed scopes (JSON array of scope keys)
    allowed_scopes JSONB NOT NULL DEFAULT '["profile.read", "profile.email"]',
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OAuth Authorization Codes (Temporary, for OAuth flow)
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(128) UNIQUE NOT NULL,
    application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Authorized scopes for this code
    scopes TEXT[] NOT NULL,
    redirect_uri TEXT NOT NULL,
    
    -- PKCE support
    code_challenge VARCHAR(128),
    code_challenge_method VARCHAR(10), -- 'S256' or 'plain'
    
    -- Security
    state VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OAuth Access Tokens
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(128) UNIQUE NOT NULL, -- SHA-256 hash of the actual token
    application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Token details
    scopes TEXT[] NOT NULL,
    token_type VARCHAR(20) DEFAULT 'Bearer',
    
    -- Expiration and revocation
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OAuth Refresh Tokens
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    access_token_id UUID REFERENCES oauth_access_tokens(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    scopes TEXT[] NOT NULL,
    
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    
    -- Track refresh token rotation
    previous_token_id UUID,
    rotated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. API Keys (For server-to-server communication)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(128) UNIQUE NOT NULL, -- SHA-256 hash of the actual key
    key_prefix VARCHAR(12) NOT NULL, -- First 12 chars for identification (e.g., "cw_live_abc...")
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    application_id UUID REFERENCES oauth_applications(id) ON DELETE CASCADE,
    
    -- Permissions
    scopes TEXT[] NOT NULL,
    ip_whitelist TEXT[], -- Array of allowed IPs (null = all allowed)
    
    -- Environment
    environment VARCHAR(20) DEFAULT 'production', -- 'development', 'staging', 'production'
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT 50000,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count BIGINT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ, -- NULL = never expires
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User App Authorizations (What users have authorized)
CREATE TABLE IF NOT EXISTS oauth_user_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
    
    -- Currently authorized scopes
    scopes TEXT[] NOT NULL,
    
    -- Audit
    first_authorized_at TIMESTAMPTZ DEFAULT NOW(),
    last_authorized_at TIMESTAMPTZ DEFAULT NOW(),
    authorization_count INTEGER DEFAULT 1,
    
    -- Status
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    
    UNIQUE(user_id, application_id)
);

-- 7. API Request Logs (For analytics and debugging)
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request source
    application_id UUID REFERENCES oauth_applications(id),
    api_key_id UUID REFERENCES api_keys(id),
    access_token_id UUID REFERENCES oauth_access_tokens(id),
    user_id UUID, -- May be null for app-only requests
    
    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_body_size INTEGER,
    response_status INTEGER,
    response_time_ms INTEGER,
    
    -- Client info
    ip_address INET,
    user_agent TEXT,
    
    -- Error tracking
    error_code VARCHAR(50),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Rate Limit Tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- Could be API key, token hash, IP, etc.
    identifier_type VARCHAR(20) NOT NULL, -- 'api_key', 'access_token', 'ip'
    
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER DEFAULT 1,
    
    UNIQUE(identifier, window_start)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_oauth_apps_client_id ON oauth_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires ON oauth_authorization_codes(expires_at) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_oauth_access_tokens_hash ON oauth_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_access_tokens_user ON oauth_access_tokens(user_id) WHERE NOT revoked;
CREATE INDEX IF NOT EXISTS idx_oauth_refresh_tokens_hash ON oauth_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_oauth_user_auths_user ON oauth_user_authorizations(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_app ON api_request_logs(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_request_logs(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON api_rate_limits(identifier, window_start);

-- ============================================================================
-- Cleanup Functions
-- ============================================================================

-- Auto-cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired authorization codes
    DELETE FROM oauth_authorization_codes 
    WHERE expires_at < NOW() OR used = TRUE;
    
    -- Mark expired access tokens as revoked
    UPDATE oauth_access_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE expires_at < NOW() AND revoked = FALSE;
    
    -- Delete old refresh tokens
    DELETE FROM oauth_refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    -- Delete old rate limit records
    DELETE FROM api_rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 day';
    
    -- Delete old request logs (keep 30 days)
    DELETE FROM api_request_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Insert Default First-Party Apps
-- ============================================================================

INSERT INTO oauth_applications (
    client_id, 
    name, 
    description,
    redirect_uris,
    is_verified,
    is_first_party,
    trust_level,
    developer_name,
    allowed_scopes
) VALUES 
(
    'luminex-tutor',
    'Luminex AI Tutor',
    'AI-powered personalized tutoring and homework help',
    ARRAY['https://luminex.catalystwells.com/callback', 'http://localhost:3000/callback'],
    TRUE,
    TRUE,
    'official',
    'CatalystWells Education',
    '["profile.read", "profile.email", "student.classes.read", "student.grades.read", "student.assignments.read", "teacher.students.read", "teacher.analytics.read", "admin.reports.read", "parent.children.read", "parent.grades.read"]'::jsonb
),
(
    'parent-connect',
    'Parent Connect',
    'Connect parents with their children''s education',
    ARRAY['https://parents.catalystwells.com/callback', 'http://localhost:3000/callback'],
    TRUE,
    TRUE,
    'official',
    'CatalystWells Education',
    '["profile.read", "profile.email", "parent.children.read", "parent.grades.read", "parent.attendance.read", "parent.communications.read", "parent.meetings.write"]'::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE oauth_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_user_authorizations ENABLE ROW LEVEL SECURITY;

-- Policies for oauth_user_authorizations (users can see their own)
CREATE POLICY "Users can view their own authorizations" ON oauth_user_authorizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can revoke their own authorizations" ON oauth_user_authorizations
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access apps" ON oauth_applications
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access tokens" ON oauth_access_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access api_keys" ON api_keys
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE oauth_applications IS 'Registered third-party applications that can access CatalystWells data via OAuth';
COMMENT ON TABLE oauth_access_tokens IS 'Active OAuth access tokens issued to applications on behalf of users';
COMMENT ON TABLE api_keys IS 'Server-to-server API keys for trusted integrations';
