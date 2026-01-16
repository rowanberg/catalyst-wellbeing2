-- OAuth Applications Migration Script
-- This script safely creates or updates the OAuth tables

-- Drop existing tables if they exist (WARNING: This will delete all OAuth data)
-- Comment out these lines if you want to preserve existing data
DROP TABLE IF EXISTS oauth_user_authorized_apps CASCADE;
DROP TABLE IF EXISTS oauth_refresh_tokens CASCADE;
DROP TABLE IF EXISTS oauth_access_tokens CASCADE;
DROP TABLE IF EXISTS oauth_authorization_codes CASCADE;
DROP TABLE IF EXISTS oauth_applications CASCADE;

-- OAuth Applications Table
CREATE TABLE oauth_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    privacy_policy_url TEXT,
    terms_of_service_url TEXT,
    redirect_uris TEXT[] NOT NULL,
    allowed_scopes TEXT[] NOT NULL DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    is_first_party BOOLEAN DEFAULT false,
    trust_level VARCHAR(50) DEFAULT 'standard',
    developer_name VARCHAR(255),
    developer_email VARCHAR(255),
    developer_website TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Authorization Codes Table
CREATE TABLE oauth_authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) UNIQUE NOT NULL,
    client_id VARCHAR(255) NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    scope TEXT[] NOT NULL,
    state TEXT,
    code_challenge VARCHAR(255),
    code_challenge_method VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Access Tokens Table
CREATE TABLE oauth_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    client_id VARCHAR(255) NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope TEXT[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Refresh Tokens Table
CREATE TABLE oauth_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    access_token_id UUID REFERENCES oauth_access_tokens(id) ON DELETE CASCADE,
    client_id VARCHAR(255) NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Authorized Apps Table
CREATE TABLE oauth_user_authorized_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id VARCHAR(255) NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
    scopes TEXT[] NOT NULL,
    first_authorized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_authorized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    authorization_count INTEGER DEFAULT 1,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, client_id)
);

-- Create Indexes
CREATE INDEX idx_oauth_codes_client_id ON oauth_authorization_codes(client_id);
CREATE INDEX idx_oauth_codes_user_id ON oauth_authorization_codes(user_id);
CREATE INDEX idx_oauth_codes_expires_at ON oauth_authorization_codes(expires_at);
CREATE INDEX idx_oauth_access_tokens_user_id ON oauth_access_tokens(user_id);
CREATE INDEX idx_oauth_access_tokens_client_id ON oauth_access_tokens(client_id);
CREATE INDEX idx_oauth_access_tokens_token ON oauth_access_tokens(token);
CREATE INDEX idx_oauth_refresh_tokens_user_id ON oauth_refresh_tokens(user_id);
CREATE INDEX idx_oauth_refresh_tokens_token ON oauth_refresh_tokens(token);
CREATE INDEX idx_oauth_user_apps_user_id ON oauth_user_authorized_apps(user_id);
CREATE INDEX idx_oauth_user_apps_client_id ON oauth_user_authorized_apps(client_id);

-- Insert default first-party apps
INSERT INTO oauth_applications (
    client_id, 
    client_secret, 
    name, 
    description, 
    logo_url,
    website_url,
    privacy_policy_url,
    terms_of_service_url,
    redirect_uris, 
    allowed_scopes,
    is_verified,
    is_first_party,
    trust_level,
    developer_name,
    developer_email
) VALUES 
(
    'luminex-tutor',
    'lum_secret_' || gen_random_uuid()::text,
    'Luminex AI Tutor',
    'AI-powered personalized learning assistant that adapts to your learning style',
    'https://app.catalystwells.com/apps/luminex-logo.png',
    'https://luminex.catalystwells.com',
    'https://luminex.catalystwells.com/privacy',
    'https://luminex.catalystwells.com/terms',
    ARRAY['https://luminex.catalystwells.com/auth/callback', 'http://localhost:3001/auth/callback'],
    ARRAY['profile.read', 'profile.email', 'student.classes.read', 'student.grades.read', 'student.assignments.read'],
    true,
    true,
    'first_party',
    'CatalystWells',
    'support@catalystwells.com'
),
(
    'parent-connect',
    'pc_secret_' || gen_random_uuid()::text,
    'Parent Connect',
    'Stay connected with your child''s education journey',
    'https://app.catalystwells.com/apps/parent-connect-logo.png',
    'https://parent.catalystwells.com',
    'https://parent.catalystwells.com/privacy',
    'https://parent.catalystwells.com/terms',
    ARRAY['https://parent.catalystwells.com/auth/callback', 'http://localhost:3002/auth/callback'],
    ARRAY['profile.read', 'profile.email', 'parent.children.read', 'parent.grades.read', 'parent.communications.read'],
    true,
    true,
    'first_party',
    'CatalystWells',
    'support@catalystwells.com'
),
(
    'study-buddy',
    'sb_secret_' || gen_random_uuid()::text,
    'Study Buddy',
    'Collaborative learning platform for students',
    'https://app.catalystwells.com/apps/study-buddy-logo.png',
    'https://studybuddy.catalystwells.com',
    'https://studybuddy.catalystwells.com/privacy',
    'https://studybuddy.catalystwells.com/terms',
    ARRAY['https://studybuddy.catalystwells.com/auth/callback', 'http://localhost:3003/auth/callback'],
    ARRAY['profile.read', 'profile.email', 'student.classes.read', 'calendar.read'],
    true,
    false,
    'verified',
    'EduTech Solutions',
    'support@edutechsolutions.com'
);

-- Function to clean up expired codes and tokens
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_data()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_authorization_codes WHERE expires_at < NOW();
    DELETE FROM oauth_access_tokens WHERE expires_at < NOW() AND revoked = false;
    DELETE FROM oauth_refresh_tokens WHERE expires_at < NOW() AND revoked = false;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'OAuth tables created successfully!';
    RAISE NOTICE 'Default apps: luminex-tutor, parent-connect, study-buddy';
    RAISE NOTICE 'Run: SELECT client_id, name, client_secret FROM oauth_applications; to see credentials';
END $$;
