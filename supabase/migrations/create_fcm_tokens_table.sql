-- FCM Push Notification Tokens Table
-- Stores Firebase Cloud Messaging tokens for push notifications

CREATE TABLE IF NOT EXISTS fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type TEXT CHECK (device_type IN ('web', 'android', 'ios')) DEFAULT 'web',
    device_name TEXT,
    browser_info TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_active ON fcm_tokens(user_id, is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view own fcm tokens"
    ON fcm_tokens FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own fcm tokens"
    ON fcm_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own fcm tokens"
    ON fcm_tokens FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own fcm tokens"
    ON fcm_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can manage all tokens (for admin operations)
CREATE POLICY "Service role can manage all fcm tokens"
    ON fcm_tokens FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_fcm_tokens_timestamp
    BEFORE UPDATE ON fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_fcm_tokens_updated_at();

-- Function to deactivate old tokens for a user
CREATE OR REPLACE FUNCTION deactivate_old_fcm_tokens(p_user_id UUID, p_current_token TEXT)
RETURNS void AS $$
BEGIN
    UPDATE fcm_tokens
    SET is_active = false
    WHERE user_id = p_user_id 
    AND token != p_current_token
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE fcm_tokens IS 'Stores FCM push notification tokens for users across devices';
COMMENT ON COLUMN fcm_tokens.token IS 'Firebase Cloud Messaging registration token';
COMMENT ON COLUMN fcm_tokens.device_type IS 'Type of device: web, android, or ios';
COMMENT ON COLUMN fcm_tokens.is_active IS 'Whether this token is currently active and should receive notifications';
COMMENT ON COLUMN fcm_tokens.last_used_at IS 'Last time this token was verified or used to send a notification';
