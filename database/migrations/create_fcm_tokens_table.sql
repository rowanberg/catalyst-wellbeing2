-- Create fcm_tokens table for storing Firebase Cloud Messaging tokens
-- This table stores device tokens for push notifications

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core relationships
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token details
    token TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL CHECK (device_type IN ('web', 'ios', 'android')),
    device_name TEXT,
    browser_info TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Composite unique constraint: one token per device type per user
    CONSTRAINT unique_user_device UNIQUE (user_id, device_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON public.fcm_tokens(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fcm_tokens_updated_at
    BEFORE UPDATE ON public.fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_fcm_tokens_updated_at();

-- Enable Row Level Security
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can manage their own FCM tokens
CREATE POLICY "Users can manage own fcm tokens"
    ON public.fcm_tokens
    FOR ALL
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- Admins can view all FCM tokens (for debugging)
CREATE POLICY "Admins can view all fcm tokens"
    ON public.fcm_tokens
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = (select auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fcm_tokens TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications. One token per device type per user.';
COMMENT ON COLUMN public.fcm_tokens.device_type IS 'Type of device: web, ios, android';
COMMENT ON COLUMN public.fcm_tokens.is_active IS 'Whether this token is currently active and should receive notifications';
COMMENT ON CONSTRAINT unique_user_device ON public.fcm_tokens IS 'Ensures one FCM token per device type per user';

SELECT 'FCM tokens table created successfully' as status;

