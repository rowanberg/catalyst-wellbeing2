-- Digital Wallet System Schema for Student Mind Gems and Fluxon Transfers
-- This creates a comprehensive cryptocurrency-like wallet system for students

-- Student wallets table
CREATE TABLE IF NOT EXISTS student_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) UNIQUE NOT NULL, -- Ethereum-like address format
    mind_gems_balance INTEGER DEFAULT 0 CHECK (mind_gems_balance >= 0),
    fluxon_balance DECIMAL(18, 8) DEFAULT 0 CHECK (fluxon_balance >= 0), -- 8 decimal places for precision
    transaction_password_hash TEXT, -- Hashed transaction password
    password_salt TEXT,
    password_set_at TIMESTAMPTZ,
    wallet_created_at TIMESTAMPTZ DEFAULT NOW(),
    last_transaction_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false, -- For security lockdown
    failed_password_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    total_transactions_sent INTEGER DEFAULT 0,
    total_transactions_received INTEGER DEFAULT 0,
    wallet_nickname VARCHAR(50),
    qr_code_data TEXT, -- Stored QR code for easy sharing
    backup_phrase TEXT, -- Encrypted recovery phrase
    two_factor_enabled BOOLEAN DEFAULT false,
    daily_limit_gems INTEGER DEFAULT 500,
    daily_limit_fluxon DECIMAL(18, 8) DEFAULT 100.0,
    daily_spent_gems INTEGER DEFAULT 0,
    daily_spent_fluxon DECIMAL(18, 8) DEFAULT 0,
    daily_limit_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
    trust_score INTEGER DEFAULT 50, -- 0-100 trust rating
    wallet_level INTEGER DEFAULT 1,
    wallet_xp INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{
        "notifications": true,
        "public_profile": false,
        "show_balance": false,
        "require_confirmation": true,
        "auto_accept_small": false,
        "small_amount_threshold": 10
    }'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL, -- Unique transaction identifier
    from_wallet_id UUID REFERENCES student_wallets(id),
    to_wallet_id UUID REFERENCES student_wallets(id),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('mind_gems', 'fluxon')),
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    transaction_fee DECIMAL(18, 8) DEFAULT 0,
    net_amount DECIMAL(18, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed')),
    transaction_type VARCHAR(30) CHECK (transaction_type IN ('transfer', 'reward', 'purchase', 'exchange', 'gift', 'quest_reward', 'achievement_bonus')),
    description TEXT,
    memo VARCHAR(200), -- Optional message with transaction
    metadata JSONB DEFAULT '{}'::jsonb,
    gas_used INTEGER DEFAULT 0, -- Gamified transaction cost
    block_number INTEGER, -- For blockchain-like experience
    confirmations INTEGER DEFAULT 0,
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,
    ip_address INET,
    device_info JSONB,
    is_instant BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction requests (for pending transfers)
CREATE TABLE IF NOT EXISTS transaction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_wallet_id UUID NOT NULL REFERENCES student_wallets(id),
    requested_from_wallet_id UUID NOT NULL REFERENCES student_wallets(id),
    currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('mind_gems', 'fluxon')),
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet contacts/friends for easy transfers
CREATE TABLE IF NOT EXISTS wallet_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES student_wallets(id) ON DELETE CASCADE,
    contact_wallet_id UUID NOT NULL REFERENCES student_wallets(id) ON DELETE CASCADE,
    nickname VARCHAR(50),
    is_favorite BOOLEAN DEFAULT false,
    is_trusted BOOLEAN DEFAULT false,
    transaction_count INTEGER DEFAULT 0,
    last_transaction_at TIMESTAMPTZ,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_id, contact_wallet_id)
);

-- Exchange rates for Gems to Fluxon conversion
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(20) NOT NULL,
    to_currency VARCHAR(20) NOT NULL,
    rate DECIMAL(18, 8) NOT NULL,
    fee_percentage DECIMAL(5, 2) DEFAULT 2.5,
    min_amount DECIMAL(18, 8) DEFAULT 1,
    max_amount DECIMAL(18, 8) DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet achievements/badges
CREATE TABLE IF NOT EXISTS wallet_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES student_wallets(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    reward_gems INTEGER DEFAULT 0,
    reward_fluxon DECIMAL(18, 8) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Transaction notifications
CREATE TABLE IF NOT EXISTS wallet_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES student_wallets(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    transaction_id UUID REFERENCES wallet_transactions(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet security logs
CREATE TABLE IF NOT EXISTS wallet_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES student_wallets(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_details TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_wallets_student_id ON student_wallets(student_id);
CREATE INDEX idx_wallets_address ON student_wallets(wallet_address);
CREATE INDEX idx_transactions_from_wallet ON wallet_transactions(from_wallet_id);
CREATE INDEX idx_transactions_to_wallet ON wallet_transactions(to_wallet_id);
CREATE INDEX idx_transactions_hash ON wallet_transactions(transaction_hash);
CREATE INDEX idx_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_requests_requester ON transaction_requests(requester_wallet_id);
CREATE INDEX idx_requests_requested_from ON transaction_requests(requested_from_wallet_id);
CREATE INDEX idx_requests_status ON transaction_requests(status);
CREATE INDEX idx_contacts_wallet ON wallet_contacts(wallet_id);
CREATE INDEX idx_notifications_wallet ON wallet_notifications(wallet_id, is_read);
CREATE INDEX idx_security_logs_wallet ON wallet_security_logs(wallet_id, created_at DESC);

-- Create function to generate wallet address
CREATE OR REPLACE FUNCTION generate_wallet_address() RETURNS VARCHAR(42) AS $$
DECLARE
    new_address VARCHAR(42);
BEGIN
    -- Generate Ethereum-like address (0x + 40 hex characters)
    new_address := '0x' || encode(gen_random_bytes(20), 'hex');
    RETURN new_address;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate transaction hash
CREATE OR REPLACE FUNCTION generate_transaction_hash() RETURNS VARCHAR(66) AS $$
DECLARE
    new_hash VARCHAR(66);
BEGIN
    -- Generate transaction hash (0x + 64 hex characters)
    new_hash := '0x' || encode(gen_random_bytes(32), 'hex');
    RETURN new_hash;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate wallet address
CREATE OR REPLACE FUNCTION set_wallet_address() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wallet_address IS NULL THEN
        NEW.wallet_address := generate_wallet_address();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_wallet_address
    BEFORE INSERT ON student_wallets
    FOR EACH ROW
    EXECUTE FUNCTION set_wallet_address();

-- Trigger to auto-generate transaction hash
CREATE OR REPLACE FUNCTION set_transaction_hash() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_hash IS NULL THEN
        NEW.transaction_hash := generate_transaction_hash();
    END IF;
    -- Calculate net amount
    IF NEW.net_amount IS NULL THEN
        NEW.net_amount := NEW.amount - COALESCE(NEW.transaction_fee, 0);
    END IF;
    -- Set block number (simulated)
    IF NEW.block_number IS NULL THEN
        SELECT COALESCE(MAX(block_number), 0) + 1 INTO NEW.block_number FROM wallet_transactions;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_transaction_hash
    BEFORE INSERT ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_hash();

-- Function to reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_limits() RETURNS void AS $$
BEGIN
    UPDATE student_wallets
    SET 
        daily_spent_gems = 0,
        daily_spent_fluxon = 0,
        daily_limit_reset_at = NOW() + INTERVAL '1 day'
    WHERE daily_limit_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check wallet achievements
CREATE OR REPLACE FUNCTION check_wallet_achievements(wallet_uuid UUID) RETURNS void AS $$
DECLARE
    wallet_record RECORD;
    total_sent INTEGER;
    total_received INTEGER;
BEGIN
    SELECT * INTO wallet_record FROM student_wallets WHERE id = wallet_uuid;
    
    -- Check for first transaction achievement
    IF wallet_record.total_transactions_sent = 1 AND NOT EXISTS (
        SELECT 1 FROM wallet_achievements 
        WHERE wallet_id = wallet_uuid AND achievement_type = 'first_transaction'
    ) THEN
        INSERT INTO wallet_achievements (wallet_id, achievement_type, achievement_name, achievement_description, reward_gems)
        VALUES (wallet_uuid, 'first_transaction', 'First Steps', 'Completed your first transaction!', 10);
        
        UPDATE student_wallets SET mind_gems_balance = mind_gems_balance + 10 WHERE id = wallet_uuid;
    END IF;
    
    -- Check for 10 transactions achievement
    IF wallet_record.total_transactions_sent >= 10 AND NOT EXISTS (
        SELECT 1 FROM wallet_achievements 
        WHERE wallet_id = wallet_uuid AND achievement_type = 'ten_transactions'
    ) THEN
        INSERT INTO wallet_achievements (wallet_id, achievement_type, achievement_name, achievement_description, reward_gems)
        VALUES (wallet_uuid, 'ten_transactions', 'Active Trader', 'Completed 10 transactions!', 50);
        
        UPDATE student_wallets SET mind_gems_balance = mind_gems_balance + 50 WHERE id = wallet_uuid;
    END IF;
    
    -- Add more achievement checks as needed
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies
ALTER TABLE student_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_security_logs ENABLE ROW LEVEL SECURITY;

-- Students can only view and update their own wallet
CREATE POLICY "Students can view own wallet" ON student_wallets
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update own wallet" ON student_wallets
    FOR UPDATE USING (student_id = auth.uid());

-- Students can view transactions they're involved in
CREATE POLICY "Students can view own transactions" ON wallet_transactions
    FOR SELECT USING (
        from_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()) OR
        to_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid())
    );

-- Students can create transactions from their wallet
CREATE POLICY "Students can create transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (
        from_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid())
    );

-- Students can view and manage their transaction requests
CREATE POLICY "Students can view transaction requests" ON transaction_requests
    FOR SELECT USING (
        requester_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()) OR
        requested_from_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid())
    );

CREATE POLICY "Students can create transaction requests" ON transaction_requests
    FOR INSERT WITH CHECK (
        requester_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid())
    );

CREATE POLICY "Students can update transaction requests" ON transaction_requests
    FOR UPDATE USING (
        requested_from_wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid())
    );

-- Students can manage their contacts
CREATE POLICY "Students can view own contacts" ON wallet_contacts
    FOR SELECT USING (wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()));

CREATE POLICY "Students can manage own contacts" ON wallet_contacts
    FOR ALL USING (wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()));

-- Students can view their achievements
CREATE POLICY "Students can view own achievements" ON wallet_achievements
    FOR SELECT USING (wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()));

-- Students can view and update their notifications
CREATE POLICY "Students can view own notifications" ON wallet_notifications
    FOR SELECT USING (wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()));

CREATE POLICY "Students can update own notifications" ON wallet_notifications
    FOR UPDATE USING (wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()));

-- Students can view their security logs
CREATE POLICY "Students can view own security logs" ON wallet_security_logs
    FOR SELECT USING (wallet_id IN (SELECT id FROM student_wallets WHERE student_id = auth.uid()));

-- Insert default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, fee_percentage, min_amount, max_amount)
VALUES 
    ('mind_gems', 'fluxon', 0.1, 2.5, 10, 1000),
    ('fluxon', 'mind_gems', 10, 2.5, 1, 100)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON student_wallets TO authenticated;
GRANT ALL ON wallet_transactions TO authenticated;
GRANT ALL ON transaction_requests TO authenticated;
GRANT ALL ON wallet_contacts TO authenticated;
GRANT ALL ON wallet_achievements TO authenticated;
GRANT ALL ON wallet_notifications TO authenticated;
GRANT SELECT ON wallet_security_logs TO authenticated;
GRANT ALL ON exchange_rates TO authenticated;
