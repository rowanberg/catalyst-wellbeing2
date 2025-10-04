-- Simple Student Wallets Migration
-- Run this in Supabase SQL Editor

-- Add student_tag column to profiles table (ignore if exists)
DO $$ 
BEGIN
    ALTER TABLE profiles ADD COLUMN student_tag VARCHAR(12) UNIQUE;
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column student_tag already exists in profiles table';
END $$;

-- Create student_wallets table (ignore if exists)
CREATE TABLE IF NOT EXISTS student_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    mind_gems_balance INTEGER DEFAULT 100,
    fluxon_balance DECIMAL(10,4) DEFAULT 10.0,
    wallet_nickname VARCHAR(100) DEFAULT 'My Wallet',
    transaction_password_hash VARCHAR(64),
    wallet_level INTEGER DEFAULT 1,
    wallet_xp INTEGER DEFAULT 0,
    trust_score INTEGER DEFAULT 50,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporarily remove foreign key constraint for development
-- This allows mock UUIDs during development/testing
DO $$ 
BEGIN
    ALTER TABLE student_wallets DROP CONSTRAINT IF EXISTS fk_student_wallets_student_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Foreign key constraint may not exist yet';
END $$;

-- Note: In production, you should add this foreign key constraint back:
-- ALTER TABLE student_wallets 
-- ADD CONSTRAINT fk_student_wallets_student_id 
-- FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE student_wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (drop if exists first)
DROP POLICY IF EXISTS "Users can manage their own wallet" ON student_wallets;
CREATE POLICY "Users can manage their own wallet" ON student_wallets
    FOR ALL USING (auth.uid()::text = student_id::text);

-- Success message
SELECT 'Student Wallets table created successfully!' as status;
